#!/usr/bin/env node

/**
 * Test Sample Enrichment
 * Tests the enrichment pipeline on a small sample of products
 * to validate storage impact and data quality before full deployment
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'ectracc-backend', '.env') });
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'ectracc';
const DATA_DIR = path.join(__dirname, '..', 'data', 'enrichment');
const ENRICHMENT_DATA_FILE = path.join(DATA_DIR, 'enrichment_data.json');
const SAMPLE_SIZE = 100; // Test with 100 products
const TEST_COLLECTION_NAME = 'products_test_enrichment';

class SampleEnrichmentTester {
  constructor() {
    this.client = null;
    this.db = null;
    this.originalCollection = null;
    this.testCollection = null;
    this.testResults = {
      sample_size: SAMPLE_SIZE,
      products_found: 0,
      products_enriched: 0,
      storage_before_bytes: 0,
      storage_after_bytes: 0,
      storage_per_product_bytes: 0,
      field_enrichment_counts: {},
      data_quality_samples: [],
      validation_errors: [],
      performance_metrics: {
        enrichment_time_ms: 0,
        avg_time_per_product_ms: 0
      }
    };
  }

  async initialize() {
    console.log('🧪 Sample Enrichment Tester');
    console.log(`📊 Testing enrichment on ${SAMPLE_SIZE} products to validate storage impact and data quality\n`);

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not set');
    }

    if (!fs.existsSync(ENRICHMENT_DATA_FILE)) {
      throw new Error(`Enrichment data file not found: ${ENRICHMENT_DATA_FILE}. Run extract-enrichment-data.js first.`);
    }

    // Connect to MongoDB
    this.client = new MongoClient(MONGODB_URI);
    await this.client.connect();
    this.db = this.client.db(DATABASE_NAME);
    this.originalCollection = this.db.collection('products');
    this.testCollection = this.db.collection(TEST_COLLECTION_NAME);
    
    console.log('✅ Connected to MongoDB');
  }

  async prepareSampleData() {
    console.log('📂 Preparing sample data for testing...');
    
    // Load enrichment data
    const enrichmentData = JSON.parse(fs.readFileSync(ENRICHMENT_DATA_FILE, 'utf8'));
    console.log(`📊 Loaded ${enrichmentData.length.toLocaleString()} enrichment records`);

    // Select high-quality sample products
    const sampleEnrichmentData = enrichmentData
      .filter(product => product.quality_score >= 3) // Only high-quality enrichments
      .slice(0, SAMPLE_SIZE);

    console.log(`🎯 Selected ${sampleEnrichmentData.length} high-quality products for testing`);

    // Get corresponding products from original collection
    const barcodes = sampleEnrichmentData.map(p => p.barcode);
    const originalProducts = await this.originalCollection.find({
      $or: [
        { code: { $in: barcodes } },
        { barcode: { $in: barcodes } }
      ]
    }).toArray();

    this.testResults.products_found = originalProducts.length;
    console.log(`📦 Found ${originalProducts.length} matching products in database`);

    // Create test collection with sample products
    await this.testCollection.deleteMany({}); // Clear any existing test data
    if (originalProducts.length > 0) {
      await this.testCollection.insertMany(originalProducts);
      console.log(`✅ Created test collection with ${originalProducts.length} products`);
    }

    return { sampleEnrichmentData, originalProducts };
  }

  async measureStorageBefore() {
    const stats = await this.testCollection.stats();
    this.testResults.storage_before_bytes = stats.size;
    console.log(`📊 Storage before enrichment: ${this.formatBytes(stats.size)}`);
  }

  async measureStorageAfter() {
    const stats = await this.testCollection.stats();
    this.testResults.storage_after_bytes = stats.size;
    const storageAdded = this.testResults.storage_after_bytes - this.testResults.storage_before_bytes;
    this.testResults.storage_per_product_bytes = Math.round(storageAdded / this.testResults.products_enriched);
    
    console.log(`📊 Storage after enrichment: ${this.formatBytes(stats.size)}`);
    console.log(`📈 Storage added: ${this.formatBytes(storageAdded)}`);
    console.log(`💾 Average per product: ${this.formatBytes(this.testResults.storage_per_product_bytes)}`);
  }

  async performSampleEnrichment(sampleEnrichmentData) {
    console.log('\n🔄 Performing sample enrichment...');
    
    const startTime = Date.now();
    let enrichedCount = 0;

    for (const enrichmentProduct of sampleEnrichmentData) {
      try {
        // Find product in test collection
        const existingProduct = await this.testCollection.findOne({
          $or: [
            { code: enrichmentProduct.barcode },
            { barcode: enrichmentProduct.barcode }
          ]
        });

        if (!existingProduct) continue;

        // Build update fields
        const updateFields = this.buildUpdateFields(existingProduct, enrichmentProduct.enrichment_fields);
        
        if (Object.keys(updateFields).length === 0) continue;

        // Update product
        await this.testCollection.updateOne(
          { _id: existingProduct._id },
          {
            $set: {
              ...updateFields,
              last_enriched: new Date(),
              test_enrichment: true // Mark as test enrichment
            }
          }
        );

        enrichedCount++;

        // Track field enrichment counts
        Object.keys(updateFields).forEach(field => {
          this.testResults.field_enrichment_counts[field] = (this.testResults.field_enrichment_counts[field] || 0) + 1;
        });

        // Collect data quality samples (first 10 products)
        if (this.testResults.data_quality_samples.length < 10) {
          this.testResults.data_quality_samples.push({
            barcode: enrichmentProduct.barcode,
            product_name: existingProduct.product_name,
            fields_added: Object.keys(updateFields),
            quality_score: enrichmentProduct.quality_score,
            sample_data: updateFields
          });
        }

      } catch (error) {
        this.testResults.validation_errors.push({
          barcode: enrichmentProduct.barcode,
          error: error.message
        });
      }
    }

    const endTime = Date.now();
    this.testResults.products_enriched = enrichedCount;
    this.testResults.performance_metrics.enrichment_time_ms = endTime - startTime;
    this.testResults.performance_metrics.avg_time_per_product_ms = Math.round((endTime - startTime) / enrichedCount);

    console.log(`✅ Enriched ${enrichedCount} products in ${endTime - startTime}ms`);
    console.log(`⚡ Average time per product: ${this.testResults.performance_metrics.avg_time_per_product_ms}ms`);
  }

  buildUpdateFields(existingProduct, enrichmentFields) {
    const updateFields = {};

    // Only add fields that are missing or empty in existing product
    Object.entries(enrichmentFields).forEach(([field, value]) => {
      if (value === null || value === undefined) return;

      const existingValue = existingProduct[field];
      const isEmpty = !existingValue || 
                     (Array.isArray(existingValue) && existingValue.length === 0) ||
                     (typeof existingValue === 'string' && existingValue.trim() === '');

      if (isEmpty) {
        updateFields[field] = value;
      }
    });

    return updateFields;
  }

  async validateDataQuality() {
    console.log('\n🔍 Validating data quality...');
    
    // Check for data consistency
    const enrichedProducts = await this.testCollection.find({
      test_enrichment: true
    }).toArray();

    let validationIssues = 0;

    enrichedProducts.forEach(product => {
      // Validate quantity fields consistency
      if (product.product_quantity && !product.product_quantity_unit) {
        this.testResults.validation_errors.push({
          barcode: product.code || product.barcode,
          error: 'Product has quantity value but no unit'
        });
        validationIssues++;
      }

      // Validate array fields are actually arrays
      ['origins', 'manufacturing_places', 'labels', 'stores', 'countries'].forEach(field => {
        if (product[field] && !Array.isArray(product[field])) {
          this.testResults.validation_errors.push({
            barcode: product.code || product.barcode,
            error: `Field ${field} should be array but is ${typeof product[field]}`
          });
          validationIssues++;
        }
      });

      // Validate string length limits
      if (product.packaging_text && product.packaging_text.length > 200) {
        this.testResults.validation_errors.push({
          barcode: product.code || product.barcode,
          error: `packaging_text exceeds 200 character limit (${product.packaging_text.length} chars)`
        });
        validationIssues++;
      }
    });

    console.log(`🔍 Data validation complete: ${validationIssues} issues found`);
  }

  async projectStorageImpact() {
    console.log('\n📊 Projecting full-scale storage impact...');
    
    // Get current database stats
    const currentStats = await this.originalCollection.stats();
    const currentProductCount = currentStats.count;
    
    // Calculate projections
    const storagePerProduct = this.testResults.storage_per_product_bytes;
    const enrichmentRate = this.testResults.products_enriched / this.testResults.products_found;
    
    const projectedEnrichedProducts = Math.round(currentProductCount * enrichmentRate);
    const projectedStorageAddedMB = Math.round((projectedEnrichedProducts * storagePerProduct) / 1024 / 1024 * 10) / 10;
    const currentDatabaseSizeMB = Math.round(currentStats.size / 1024 / 1024 * 10) / 10;
    const projectedFinalSizeMB = currentDatabaseSizeMB + projectedStorageAddedMB;
    const projectedFinalSizeGB = projectedFinalSizeMB / 1024;

    console.log(`📈 Full-Scale Projections:`);
    console.log(`Current products: ${currentProductCount.toLocaleString()}`);
    console.log(`Projected enriched products: ${projectedEnrichedProducts.toLocaleString()} (${(enrichmentRate * 100).toFixed(1)}%)`);
    console.log(`Current database size: ${currentDatabaseSizeMB} MB`);
    console.log(`Projected storage added: ${projectedStorageAddedMB} MB`);
    console.log(`Projected final size: ${projectedFinalSizeMB} MB (${projectedFinalSizeGB.toFixed(2)} GB)`);
    
    // Safety assessment
    const STORAGE_LIMIT_GB = 5;
    if (projectedFinalSizeGB > STORAGE_LIMIT_GB) {
      console.log(`🚨 WARNING: Projected size (${projectedFinalSizeGB.toFixed(2)} GB) exceeds limit (${STORAGE_LIMIT_GB} GB)`);
      console.log(`⚠️  Recommend reducing enrichment scope or increasing storage limit`);
    } else {
      console.log(`✅ SAFE: Projected size within ${STORAGE_LIMIT_GB} GB limit`);
      console.log(`📊 Remaining headroom: ${(STORAGE_LIMIT_GB - projectedFinalSizeGB).toFixed(2)} GB`);
    }

    return {
      projectedEnrichedProducts,
      projectedStorageAddedMB,
      projectedFinalSizeGB,
      withinLimit: projectedFinalSizeGB <= STORAGE_LIMIT_GB
    };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async generateTestReport(projections) {
    console.log('\n📋 Sample Enrichment Test Report');
    console.log('=' .repeat(60));
    
    console.log(`\n🧪 Test Configuration:`);
    console.log(`Sample size: ${this.testResults.sample_size} products`);
    console.log(`Products found: ${this.testResults.products_found}`);
    console.log(`Products enriched: ${this.testResults.products_enriched}`);
    console.log(`Success rate: ${((this.testResults.products_enriched / this.testResults.products_found) * 100).toFixed(1)}%`);

    console.log(`\n💾 Storage Impact:`);
    console.log(`Storage before: ${this.formatBytes(this.testResults.storage_before_bytes)}`);
    console.log(`Storage after: ${this.formatBytes(this.testResults.storage_after_bytes)}`);
    console.log(`Storage added: ${this.formatBytes(this.testResults.storage_after_bytes - this.testResults.storage_before_bytes)}`);
    console.log(`Per product: ${this.formatBytes(this.testResults.storage_per_product_bytes)}`);

    console.log(`\n📈 Field Enrichment Results:`);
    Object.entries(this.testResults.field_enrichment_counts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([field, count]) => {
        const percentage = ((count / this.testResults.products_enriched) * 100).toFixed(1);
        console.log(`${field.padEnd(25)}: ${count.toString().padStart(3)} products (${percentage}%)`);
      });

    console.log(`\n⚡ Performance Metrics:`);
    console.log(`Total enrichment time: ${this.testResults.performance_metrics.enrichment_time_ms}ms`);
    console.log(`Average per product: ${this.testResults.performance_metrics.avg_time_per_product_ms}ms`);

    if (this.testResults.validation_errors.length > 0) {
      console.log(`\n⚠️  Validation Issues (${this.testResults.validation_errors.length}):`);
      this.testResults.validation_errors.slice(0, 5).forEach(error => {
        console.log(`- ${error.barcode}: ${error.error}`);
      });
      if (this.testResults.validation_errors.length > 5) {
        console.log(`... and ${this.testResults.validation_errors.length - 5} more issues`);
      }
    }

    console.log(`\n🔮 Full-Scale Projections:`);
    console.log(`Projected enriched products: ${projections.projectedEnrichedProducts.toLocaleString()}`);
    console.log(`Projected storage added: ${projections.projectedStorageAddedMB} MB`);
    console.log(`Projected final size: ${projections.projectedFinalSizeGB.toFixed(2)} GB`);
    console.log(`Within 5GB limit: ${projections.withinLimit ? '✅ YES' : '❌ NO'}`);

    console.log(`\n💡 Recommendations:`);
    if (projections.withinLimit) {
      console.log(`✅ Safe to proceed with full enrichment`);
      console.log(`📊 Expected to enrich ${projections.projectedEnrichedProducts.toLocaleString()} products`);
      console.log(`💾 Will add approximately ${projections.projectedStorageAddedMB} MB to database`);
    } else {
      console.log(`⚠️  Full enrichment may exceed storage limit`);
      console.log(`🔧 Consider reducing enrichment scope or filtering for higher quality data`);
      console.log(`📊 Current projection: ${projections.projectedFinalSizeGB.toFixed(2)} GB > 5 GB limit`);
    }

    // Save detailed test results
    const reportFile = path.join(DATA_DIR, 'sample_enrichment_test_results.json');
    const fullReport = {
      ...this.testResults,
      projections,
      test_date: new Date().toISOString(),
      recommendations: projections.withinLimit ? 'PROCEED' : 'REDUCE_SCOPE'
    };
    
    fs.writeFileSync(reportFile, JSON.stringify(fullReport, null, 2));
    console.log(`\n📁 Detailed test results saved to: ${reportFile}`);
  }

  async cleanup() {
    // Clean up test collection
    if (this.testCollection) {
      await this.testCollection.drop();
      console.log('🧹 Cleaned up test collection');
    }
    
    if (this.client) {
      await this.client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  async run() {
    try {
      await this.initialize();
      
      const { sampleEnrichmentData } = await this.prepareSampleData();
      
      await this.measureStorageBefore();
      await this.performSampleEnrichment(sampleEnrichmentData);
      await this.measureStorageAfter();
      
      await this.validateDataQuality();
      const projections = await this.projectStorageImpact();
      
      await this.generateTestReport(projections);
      
      console.log('\n🎉 Sample enrichment test completed successfully!');
      
    } catch (error) {
      console.error('❌ Sample enrichment test failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new SampleEnrichmentTester();
  tester.run();
}

module.exports = SampleEnrichmentTester;
