#!/usr/bin/env node

/**
 * Batch Enrichment Pipeline
 * Enriches existing products with Open Food Facts data in batches
 * while monitoring MongoDB storage usage to stay under 5GB limit
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
const BATCH_SIZE = 1000; // Process 1000 products at a time
const STORAGE_LIMIT_GB = 5;
const STORAGE_WARNING_GB = 4.5;

class BatchEnrichmentPipeline {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.stats = {
      total_products_to_enrich: 0,
      processed_batches: 0,
      enriched_products: 0,
      skipped_products: 0,
      failed_products: 0,
      storage_before_mb: 0,
      storage_after_mb: 0,
      storage_added_mb: 0,
      field_enrichment_counts: {},
      processing_start_time: null,
      processing_end_time: null
    };
  }

  async initialize() {
    console.log('🚀 Batch Enrichment Pipeline');
    console.log('💾 Enriching products while monitoring MongoDB storage usage\n');

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
    this.collection = this.db.collection('products');
    
    console.log('✅ Connected to MongoDB');

    // Check initial storage usage
    this.stats.storage_before_mb = await this.getStorageUsageMB();
    console.log(`📊 Initial database size: ${this.stats.storage_before_mb.toFixed(1)} MB`);

    if (this.stats.storage_before_mb > STORAGE_WARNING_GB * 1024) {
      console.warn(`⚠️  Warning: Database already near storage limit (${(this.stats.storage_before_mb / 1024).toFixed(1)} GB)`);
    }
  }

  async getStorageUsageMB() {
    try {
      const stats = await this.db.stats();
      return Math.round((stats.dataSize / 1024 / 1024) * 10) / 10;
    } catch (error) {
      console.warn('Could not get exact storage stats, using collection stats');
      const stats = await this.collection.stats();
      return Math.round((stats.size / 1024 / 1024) * 10) / 10;
    }
  }

  async loadEnrichmentData() {
    console.log('📂 Loading enrichment data...');
    
    const enrichmentData = JSON.parse(fs.readFileSync(ENRICHMENT_DATA_FILE, 'utf8'));
    this.stats.total_products_to_enrich = enrichmentData.length;
    
    console.log(`📊 Loaded ${this.stats.total_products_to_enrich.toLocaleString()} products for enrichment`);
    
    // Sort by quality score (best first) to prioritize high-value enrichments
    enrichmentData.sort((a, b) => (b.quality_score || 0) - (a.quality_score || 0));
    
    return enrichmentData;
  }

  async processBatch(batch, batchNumber) {
    console.log(`\n🔄 Processing batch ${batchNumber} (${batch.length} products)...`);
    
    const bulkOps = [];
    let batchEnriched = 0;
    let batchSkipped = 0;
    let batchFailed = 0;

    for (const enrichmentProduct of batch) {
      try {
        // Find existing product by barcode
        const existingProduct = await this.collection.findOne({ 
          $or: [
            { code: enrichmentProduct.barcode },
            { barcode: enrichmentProduct.barcode }
          ]
        });

        if (!existingProduct) {
          batchSkipped++;
          continue;
        }

        // Build update document with only new/missing fields
        const updateFields = this.buildUpdateFields(existingProduct, enrichmentProduct.enrichment_fields);
        
        if (Object.keys(updateFields).length === 0) {
          batchSkipped++; // Product already has all available enrichment data
          continue;
        }

        // Add to bulk operations
        bulkOps.push({
          updateOne: {
            filter: { _id: existingProduct._id },
            update: {
              $set: {
                ...updateFields,
                last_enriched: new Date()
              }
            }
          }
        });

        batchEnriched++;

        // Track field enrichment counts
        Object.keys(updateFields).forEach(field => {
          this.stats.field_enrichment_counts[field] = (this.stats.field_enrichment_counts[field] || 0) + 1;
        });

      } catch (error) {
        console.error(`Error processing product ${enrichmentProduct.barcode}:`, error.message);
        batchFailed++;
      }
    }

    // Execute bulk operations if any
    if (bulkOps.length > 0) {
      try {
        const result = await this.collection.bulkWrite(bulkOps, { ordered: false });
        console.log(`✅ Batch ${batchNumber}: Updated ${result.modifiedCount} products`);
      } catch (error) {
        console.error(`❌ Bulk write error in batch ${batchNumber}:`, error.message);
        batchFailed += bulkOps.length;
      }
    }

    // Update stats
    this.stats.enriched_products += batchEnriched;
    this.stats.skipped_products += batchSkipped;
    this.stats.failed_products += batchFailed;

    console.log(`📊 Batch ${batchNumber} results: ${batchEnriched} enriched, ${batchSkipped} skipped, ${batchFailed} failed`);

    return { enriched: batchEnriched, skipped: batchSkipped, failed: batchFailed };
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

  async checkStorageLimit() {
    const currentStorageMB = await this.getStorageUsageMB();
    const currentStorageGB = currentStorageMB / 1024;

    console.log(`💾 Current database size: ${currentStorageMB.toFixed(1)} MB (${currentStorageGB.toFixed(2)} GB)`);

    if (currentStorageGB > STORAGE_LIMIT_GB) {
      throw new Error(`Storage limit exceeded: ${currentStorageGB.toFixed(2)} GB > ${STORAGE_LIMIT_GB} GB`);
    }

    if (currentStorageGB > STORAGE_WARNING_GB) {
      console.warn(`⚠️  Warning: Approaching storage limit (${currentStorageGB.toFixed(2)} GB / ${STORAGE_LIMIT_GB} GB)`);
    }

    return currentStorageMB;
  }

  async createEnrichmentIndexes() {
    console.log('🔍 Creating indexes for enriched fields...');
    
    try {
      // Create indexes for commonly queried enrichment fields
      await this.collection.createIndex({ quantity: 1 });
      await this.collection.createIndex({ product_quantity_unit: 1 });
      await this.collection.createIndex({ origins: 1 });
      await this.collection.createIndex({ countries: 1 });
      await this.collection.createIndex({ labels: 1 });
      await this.collection.createIndex({ stores: 1 });
      await this.collection.createIndex({ last_enriched: 1 });
      
      console.log('✅ Enrichment indexes created');
    } catch (error) {
      console.warn('⚠️  Could not create all indexes:', error.message);
    }
  }

  generateProgressReport(batchNumber, totalBatches) {
    const progress = ((batchNumber / totalBatches) * 100).toFixed(1);
    const elapsed = Date.now() - this.stats.processing_start_time;
    const estimatedTotal = (elapsed / batchNumber) * totalBatches;
    const remaining = estimatedTotal - elapsed;

    console.log(`\n📈 Progress Report - Batch ${batchNumber}/${totalBatches} (${progress}%)`);
    console.log(`⏱️  Elapsed: ${this.formatDuration(elapsed)}, Estimated remaining: ${this.formatDuration(remaining)}`);
    console.log(`✅ Enriched: ${this.stats.enriched_products.toLocaleString()}`);
    console.log(`⏭️  Skipped: ${this.stats.skipped_products.toLocaleString()}`);
    console.log(`❌ Failed: ${this.stats.failed_products.toLocaleString()}`);
  }

  formatDuration(ms) {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  }

  async generateFinalReport() {
    this.stats.processing_end_time = Date.now();
    this.stats.storage_after_mb = await this.getStorageUsageMB();
    this.stats.storage_added_mb = this.stats.storage_after_mb - this.stats.storage_before_mb;

    console.log('\n🎉 Batch Enrichment Pipeline Completed!');
    console.log('=' .repeat(60));
    
    console.log(`\n📊 Processing Summary:`);
    console.log(`Total products processed: ${this.stats.total_products_to_enrich.toLocaleString()}`);
    console.log(`Successfully enriched: ${this.stats.enriched_products.toLocaleString()}`);
    console.log(`Skipped (no match/already enriched): ${this.stats.skipped_products.toLocaleString()}`);
    console.log(`Failed: ${this.stats.failed_products.toLocaleString()}`);
    console.log(`Success rate: ${((this.stats.enriched_products / this.stats.total_products_to_enrich) * 100).toFixed(1)}%`);

    console.log(`\n💾 Storage Impact:`);
    console.log(`Database size before: ${this.stats.storage_before_mb.toFixed(1)} MB`);
    console.log(`Database size after: ${this.stats.storage_after_mb.toFixed(1)} MB`);
    console.log(`Storage added: ${this.stats.storage_added_mb.toFixed(1)} MB`);
    console.log(`Final size: ${(this.stats.storage_after_mb / 1024).toFixed(2)} GB / ${STORAGE_LIMIT_GB} GB limit`);

    console.log(`\n📈 Field Enrichment Breakdown:`);
    Object.entries(this.stats.field_enrichment_counts)
      .sort(([,a], [,b]) => b - a)
      .forEach(([field, count]) => {
        console.log(`${field.padEnd(25)}: ${count.toLocaleString()} products`);
      });

    const totalTime = this.stats.processing_end_time - this.stats.processing_start_time;
    console.log(`\n⏱️  Total processing time: ${this.formatDuration(totalTime)}`);
    console.log(`📊 Processing rate: ${Math.round(this.stats.total_products_to_enrich / (totalTime / 1000))} products/second`);

    // Storage efficiency metrics
    const avgBytesPerProduct = (this.stats.storage_added_mb * 1024 * 1024) / this.stats.enriched_products;
    console.log(`💾 Average storage per enriched product: ${Math.round(avgBytesPerProduct)} bytes`);
  }

  async cleanup() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  async run() {
    try {
      this.stats.processing_start_time = Date.now();
      
      await this.initialize();
      const enrichmentData = await this.loadEnrichmentData();

      // Process in batches
      const totalBatches = Math.ceil(enrichmentData.length / BATCH_SIZE);
      console.log(`📦 Processing ${totalBatches} batches of ${BATCH_SIZE} products each`);

      for (let i = 0; i < totalBatches; i++) {
        const batchStart = i * BATCH_SIZE;
        const batchEnd = Math.min(batchStart + BATCH_SIZE, enrichmentData.length);
        const batch = enrichmentData.slice(batchStart, batchEnd);
        
        // Process batch
        await this.processBatch(batch, i + 1);
        this.stats.processed_batches++;

        // Check storage after each batch
        await this.checkStorageLimit();

        // Progress report every 5 batches
        if ((i + 1) % 5 === 0 || i === totalBatches - 1) {
          this.generateProgressReport(i + 1, totalBatches);
        }

        // Small delay to prevent overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Create indexes for enriched fields
      await this.createEnrichmentIndexes();

      // Generate final report
      await this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Enrichment pipeline failed:', error.message);
      
      // Emergency storage check
      try {
        const currentStorage = await this.getStorageUsageMB();
        console.log(`💾 Current database size: ${currentStorage.toFixed(1)} MB`);
      } catch (e) {
        console.error('Could not check storage after error');
      }
      
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const pipeline = new BatchEnrichmentPipeline();
  pipeline.run();
}

module.exports = BatchEnrichmentPipeline;
