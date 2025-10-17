#!/usr/bin/env node

/**
 * Export Existing Product Barcodes
 * Exports all barcodes from the current MongoDB products collection
 * for matching against Open Food Facts data
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'ectracc-backend', '.env') });
const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'ectracc';
const OUTPUT_DIR = path.join(__dirname, '..', 'data', 'enrichment');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'existing_barcodes.json');

class BarcodeExporter {
  constructor() {
    this.client = null;
    this.stats = {
      totalProducts: 0,
      withBarcodes: 0,
      uniqueBarcodes: 0,
      exported: 0
    };
  }

  async initialize() {
    console.log('🚀 Barcode Export Tool');
    console.log('📊 Exporting existing product barcodes for enrichment matching\n');

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not set');
    }

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`📁 Created output directory: ${OUTPUT_DIR}`);
    }

    // Connect to MongoDB
    this.client = new MongoClient(MONGODB_URI);
    await this.client.connect();
    console.log('✅ Connected to MongoDB');
  }

  async exportBarcodes() {
    console.log('📤 Exporting product barcodes...');
    
    const db = this.client.db(DATABASE_NAME);
    const collection = db.collection('products');

    // Get total count
    this.stats.totalProducts = await collection.countDocuments();
    console.log(`📊 Total products in database: ${this.stats.totalProducts.toLocaleString()}`);

    // Export barcodes with basic product info for matching
    const cursor = collection.find(
      {}, 
      { 
        projection: { 
          _id: 1,
          code: 1, 
          barcode: 1, 
          product_name: 1,
          brands: 1,
          categories: 1,
          // Check which enrichment fields already exist
          quantity: 1,
          product_quantity: 1,
          product_quantity_unit: 1,
          net_weight: 1,
          net_weight_unit: 1,
          packaging: 1,
          packaging_text: 1,
          origins: 1,
          manufacturing_places: 1,
          labels: 1,
          stores: 1,
          countries: 1,
          last_enriched: 1
        } 
      }
    );

    const barcodes = [];
    const seenBarcodes = new Set();

    await cursor.forEach(product => {
      // Use barcode field first, then code field as fallback
      const barcode = product.barcode || product.code;
      
      if (barcode && barcode.trim()) {
        this.stats.withBarcodes++;
        
        // Avoid duplicates
        if (!seenBarcodes.has(barcode)) {
          seenBarcodes.add(barcode);
          this.stats.uniqueBarcodes++;
          
          // Calculate enrichment needs
          const enrichmentNeeds = this.calculateEnrichmentNeeds(product);
          
          barcodes.push({
            _id: product._id.toString(),
            barcode: barcode.trim(),
            product_name: product.product_name || 'Unknown',
            brands: product.brands || [],
            categories: product.categories || [],
            enrichment_needs: enrichmentNeeds,
            enrichment_score: enrichmentNeeds.total_missing
          });
        }
      }
    });

    // Sort by enrichment potential (most missing fields first)
    barcodes.sort((a, b) => b.enrichment_score - a.enrichment_score);

    // Write to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(barcodes, null, 2));
    this.stats.exported = barcodes.length;

    console.log(`✅ Exported ${this.stats.exported.toLocaleString()} unique barcodes`);
    console.log(`📁 Output file: ${OUTPUT_FILE}`);
  }

  calculateEnrichmentNeeds(product) {
    const targetFields = [
      'quantity',
      'product_quantity', 
      'product_quantity_unit',
      'net_weight',
      'net_weight_unit',
      'packaging',
      'packaging_text',
      'origins',
      'manufacturing_places',
      'labels',
      'stores',
      'countries'
    ];

    const needs = {
      missing_fields: [],
      existing_fields: [],
      total_missing: 0,
      total_existing: 0
    };

    targetFields.forEach(field => {
      const value = product[field];
      const isEmpty = !value || 
                     (Array.isArray(value) && value.length === 0) ||
                     (typeof value === 'string' && value.trim() === '');
      
      if (isEmpty) {
        needs.missing_fields.push(field);
        needs.total_missing++;
      } else {
        needs.existing_fields.push(field);
        needs.total_existing++;
      }
    });

    return needs;
  }

  async generateSummaryReport() {
    console.log('\n📊 Export Summary Report');
    console.log('=' .repeat(50));
    console.log(`Total products in database: ${this.stats.totalProducts.toLocaleString()}`);
    console.log(`Products with barcodes: ${this.stats.withBarcodes.toLocaleString()} (${((this.stats.withBarcodes / this.stats.totalProducts) * 100).toFixed(1)}%)`);
    console.log(`Unique barcodes exported: ${this.stats.uniqueBarcodes.toLocaleString()}`);
    console.log(`Duplicates removed: ${(this.stats.withBarcodes - this.stats.uniqueBarcodes).toLocaleString()}`);

    // Analyze enrichment potential
    const barcodes = JSON.parse(fs.readFileSync(OUTPUT_FILE, 'utf8'));
    
    const enrichmentStats = {
      needsAllFields: 0,
      needsMostFields: 0, // 8+ fields missing
      needsSomeFields: 0, // 4-7 fields missing
      needsFewFields: 0,  // 1-3 fields missing
      fullyEnriched: 0    // 0 fields missing
    };

    barcodes.forEach(product => {
      const missing = product.enrichment_score;
      if (missing === 12) enrichmentStats.needsAllFields++;
      else if (missing >= 8) enrichmentStats.needsMostFields++;
      else if (missing >= 4) enrichmentStats.needsSomeFields++;
      else if (missing >= 1) enrichmentStats.needsFewFields++;
      else enrichmentStats.fullyEnriched++;
    });

    console.log('\n🎯 Enrichment Potential:');
    console.log(`Products needing all 12 fields: ${enrichmentStats.needsAllFields.toLocaleString()}`);
    console.log(`Products needing 8+ fields: ${enrichmentStats.needsMostFields.toLocaleString()}`);
    console.log(`Products needing 4-7 fields: ${enrichmentStats.needsSomeFields.toLocaleString()}`);
    console.log(`Products needing 1-3 fields: ${enrichmentStats.needsFewFields.toLocaleString()}`);
    console.log(`Products already enriched: ${enrichmentStats.fullyEnriched.toLocaleString()}`);

    const totalNeedingEnrichment = enrichmentStats.needsAllFields + 
                                  enrichmentStats.needsMostFields + 
                                  enrichmentStats.needsSomeFields + 
                                  enrichmentStats.needsFewFields;
    
    console.log(`\n📈 Total products that could benefit from enrichment: ${totalNeedingEnrichment.toLocaleString()} (${((totalNeedingEnrichment / this.stats.uniqueBarcodes) * 100).toFixed(1)}%)`);
  }

  async cleanup() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.exportBarcodes();
      await this.generateSummaryReport();
      
      console.log('\n🎉 Barcode export completed successfully!');
      console.log(`📁 Next step: Use ${OUTPUT_FILE} to match against Open Food Facts data`);
      
    } catch (error) {
      console.error('❌ Export failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run if called directly
if (require.main === module) {
  const exporter = new BarcodeExporter();
  exporter.run();
}

module.exports = BarcodeExporter;
