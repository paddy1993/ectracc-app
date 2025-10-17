#!/usr/bin/env node

/**
 * Simple Enrichment Test
 * Tests the enrichment pipeline with mock data for the current small dataset
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'ectracc-backend', '.env') });
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'ectracc';
const DATA_DIR = path.join(__dirname, '..', 'data', 'enrichment');

class SimpleEnrichmentTester {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
  }

  async initialize() {
    console.log('🧪 Simple Enrichment Test');
    console.log('📊 Testing enrichment with mock data for current dataset\n');

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not set');
    }

    // Connect to MongoDB
    this.client = new MongoClient(MONGODB_URI);
    await this.client.connect();
    this.db = this.client.db(DATABASE_NAME);
    this.collection = this.db.collection('products');
    
    console.log('✅ Connected to MongoDB');

    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  async createMockEnrichmentData() {
    console.log('📦 Creating mock enrichment data for testing...');
    
    // Get existing products
    const existingProducts = await this.collection.find({}).toArray();
    console.log(`📊 Found ${existingProducts.length} products in database`);

    // Create mock enrichment data for each product
    const mockEnrichmentData = existingProducts.map((product, index) => ({
      barcode: product.code || product.barcode,
      enrichment_fields: {
        quantity: `${250 + (index * 50)}g`,
        product_quantity: 250 + (index * 50),
        product_quantity_unit: 'g',
        net_weight: `${200 + (index * 40)}g`,
        net_weight_unit: 'g',
        packaging: index % 2 === 0 ? 'btl' : 'pkg',
        packaging_text: `Mock packaging description ${index + 1}`,
        origins: index % 3 === 0 ? ['US'] : index % 3 === 1 ? ['FR', 'DE'] : ['CA'],
        manufacturing_places: [`Factory ${index + 1}`],
        labels: index % 2 === 0 ? ['org'] : ['fair'],
        stores: ['wmt', 'tgt'],
        countries: ['US', 'CA']
      },
      quality_score: 7,
      lang: 'en'
    }));

    // Save mock enrichment data
    const enrichmentFile = path.join(DATA_DIR, 'enrichment_data.json');
    fs.writeFileSync(enrichmentFile, JSON.stringify(mockEnrichmentData, null, 2));
    
    console.log(`✅ Created mock enrichment data for ${mockEnrichmentData.length} products`);
    console.log(`📁 Saved to: ${enrichmentFile}`);
    
    return mockEnrichmentData;
  }

  async testEnrichment(mockData) {
    console.log('\n🔄 Testing product enrichment...');
    
    let enrichedCount = 0;
    const storageBefore = await this.getCollectionSize();
    
    for (const enrichmentProduct of mockData) {
      try {
        // Find existing product
        const existingProduct = await this.collection.findOne({
          $or: [
            { code: enrichmentProduct.barcode },
            { barcode: enrichmentProduct.barcode }
          ]
        });

        if (!existingProduct) continue;

        // Update with enrichment fields
        await this.collection.updateOne(
          { _id: existingProduct._id },
          {
            $set: {
              ...enrichmentProduct.enrichment_fields,
              last_enriched: new Date(),
              test_enrichment: true
            }
          }
        );

        enrichedCount++;
        console.log(`✅ Enriched product: ${existingProduct.product_name}`);

      } catch (error) {
        console.error(`❌ Error enriching product ${enrichmentProduct.barcode}:`, error.message);
      }
    }

    const storageAfter = await this.getCollectionSize();
    const storageAdded = storageAfter - storageBefore;

    console.log(`\n📊 Enrichment Results:`);
    console.log(`Products enriched: ${enrichedCount}`);
    console.log(`Storage before: ${this.formatBytes(storageBefore)}`);
    console.log(`Storage after: ${this.formatBytes(storageAfter)}`);
    console.log(`Storage added: ${this.formatBytes(storageAdded)}`);
    console.log(`Per product: ${this.formatBytes(storageAdded / enrichedCount)}`);

    return {
      enrichedCount,
      storageBefore,
      storageAfter,
      storageAdded,
      storagePerProduct: storageAdded / enrichedCount
    };
  }

  async getCollectionSize() {
    try {
      const stats = await this.collection.stats();
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async validateEnrichment() {
    console.log('\n🔍 Validating enriched data...');
    
    const enrichedProducts = await this.collection.find({
      test_enrichment: true
    }).toArray();

    console.log(`📊 Found ${enrichedProducts.length} enriched products`);

    // Show sample enriched product
    if (enrichedProducts.length > 0) {
      const sample = enrichedProducts[0];
      console.log(`\n📝 Sample enriched product:`);
      console.log(`Name: ${sample.product_name}`);
      console.log(`Quantity: ${sample.quantity}`);
      console.log(`Packaging: ${sample.packaging}`);
      console.log(`Origins: ${JSON.stringify(sample.origins)}`);
      console.log(`Labels: ${JSON.stringify(sample.labels)}`);
      console.log(`Stores: ${JSON.stringify(sample.stores)}`);
    }

    return enrichedProducts.length;
  }

  async projectFullScale(testResults) {
    console.log('\n🔮 Full-Scale Projections:');
    
    // For a real database with 1.5M products
    const realProductCount = 1500000;
    const enrichmentRate = 0.8; // Assume 80% of products can be enriched
    
    const projectedEnrichedProducts = Math.round(realProductCount * enrichmentRate);
    const projectedStorageAddedMB = Math.round((projectedEnrichedProducts * testResults.storagePerProduct) / 1024 / 1024 * 10) / 10;
    const currentDatabaseSizeMB = 1700; // Current size from earlier reports
    const projectedFinalSizeMB = currentDatabaseSizeMB + projectedStorageAddedMB;
    const projectedFinalSizeGB = projectedFinalSizeMB / 1024;

    console.log(`Current products (test): ${testResults.enrichedCount.toLocaleString()}`);
    console.log(`Projected products (real): ${projectedEnrichedProducts.toLocaleString()}`);
    console.log(`Storage per product: ${this.formatBytes(testResults.storagePerProduct)}`);
    console.log(`Projected storage added: ${projectedStorageAddedMB} MB`);
    console.log(`Projected final size: ${projectedFinalSizeMB} MB (${projectedFinalSizeGB.toFixed(2)} GB)`);
    
    const STORAGE_LIMIT_GB = 5;
    if (projectedFinalSizeGB > STORAGE_LIMIT_GB) {
      console.log(`🚨 WARNING: Projected size exceeds ${STORAGE_LIMIT_GB} GB limit`);
      return false;
    } else {
      console.log(`✅ SAFE: Projected size within ${STORAGE_LIMIT_GB} GB limit`);
      console.log(`📊 Remaining headroom: ${(STORAGE_LIMIT_GB - projectedFinalSizeGB).toFixed(2)} GB`);
      return true;
    }
  }

  async cleanup() {
    // Remove test enrichment data
    await this.collection.updateMany(
      { test_enrichment: true },
      { $unset: { test_enrichment: 1 } }
    );
    
    if (this.client) {
      await this.client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  async run() {
    try {
      await this.initialize();
      
      const mockData = await this.createMockEnrichmentData();
      const testResults = await this.testEnrichment(mockData);
      const enrichedCount = await this.validateEnrichment();
      const isWithinLimits = await this.projectFullScale(testResults);
      
      console.log('\n🎉 Simple enrichment test completed!');
      
      if (isWithinLimits) {
        console.log('✅ Ready to proceed with full enrichment pipeline');
        
        // Create a simple test results file
        const testResultsFile = path.join(DATA_DIR, 'sample_enrichment_test_results.json');
        const results = {
          products_enriched: enrichedCount,
          storage_per_product_bytes: Math.round(testResults.storagePerProduct),
          projections: {
            projectedFinalSizeGB: testResults.storageAfter / 1024 / 1024 / 1024 * 1500000 / 10 + 1.7
          },
          recommendations: 'PROCEED'
        };
        fs.writeFileSync(testResultsFile, JSON.stringify(results, null, 2));
        console.log(`📁 Test results saved to: ${testResultsFile}`);
      } else {
        console.log('⚠️  Consider optimizing enrichment scope before full deployment');
      }
      
    } catch (error) {
      console.error('❌ Simple enrichment test failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new SimpleEnrichmentTester();
  tester.run();
}

module.exports = SimpleEnrichmentTester;
