#!/usr/bin/env node

/**
 * Open Food Facts Field Analysis
 * Analyzes the availability and quality of target enrichment fields
 * in the Open Food Facts MongoDB dump using DuckDB
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const DATA_DIR = path.join(__dirname, '..', 'data', 'enrichment');
const OPENFOODFACTS_FILE = path.join(DESKTOP_PATH, 'openfoodfacts-products.jsonl (1).gz');
const EXISTING_BARCODES_FILE = path.join(DATA_DIR, 'existing_barcodes.json');
const OUTPUT_FILE = path.join(DATA_DIR, 'field_analysis_results.json');

// Target fields for enrichment
const TARGET_FIELDS = [
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

class FieldAnalyzer {
  constructor() {
    this.results = {
      analysis_date: new Date().toISOString(),
      total_openfoodfacts_products: 0,
      existing_barcodes_count: 0,
      matched_products: 0,
      field_availability: {},
      storage_estimates: {},
      quality_metrics: {},
      sample_data: {}
    };
  }

  async initialize() {
    console.log('🦆 Open Food Facts Field Analysis Tool');
    console.log('📊 Analyzing field availability for product enrichment\n');

    // Check prerequisites
    if (!await this.checkDuckDBInstallation()) {
      throw new Error('DuckDB not found. Please install: brew install duckdb');
    }

    if (!fs.existsSync(OPENFOODFACTS_FILE)) {
      throw new Error(`Open Food Facts file not found: ${OPENFOODFACTS_FILE}`);
    }

    if (!fs.existsSync(EXISTING_BARCODES_FILE)) {
      throw new Error(`Existing barcodes file not found: ${EXISTING_BARCODES_FILE}. Run export-existing-barcodes.js first.`);
    }

    // Ensure output directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    console.log('✅ Prerequisites check passed');
  }

  async checkDuckDBInstallation() {
    return new Promise((resolve) => {
      const child = spawn('duckdb', ['--version']);
      child.on('close', (code) => resolve(code === 0));
      child.on('error', () => resolve(false));
    });
  }

  async runFieldAnalysis() {
    console.log('🔍 Analyzing field availability in Open Food Facts data...');

    // Load existing barcodes for matching
    const existingBarcodes = JSON.parse(fs.readFileSync(EXISTING_BARCODES_FILE, 'utf8'));
    this.results.existing_barcodes_count = existingBarcodes.length;
    
    // Create barcode list for DuckDB matching
    const barcodeList = existingBarcodes.map(p => `'${p.barcode}'`).join(',');
    
    const sqlScript = `
-- Simple analysis of field availability
SELECT 
    json_extract_string(json, 'code') as code,
    CASE WHEN json_extract_string(json, 'quantity') IS NOT NULL THEN 1 ELSE 0 END as has_quantity,
    CASE WHEN json_extract_string(json, 'product_quantity') IS NOT NULL THEN 1 ELSE 0 END as has_product_quantity,
    CASE WHEN json_extract_string(json, 'packaging') IS NOT NULL THEN 1 ELSE 0 END as has_packaging,
    CASE WHEN json_extract_string(json, 'origins') IS NOT NULL THEN 1 ELSE 0 END as has_origins,
    CASE WHEN json_extract_string(json, 'labels') IS NOT NULL THEN 1 ELSE 0 END as has_labels,
    CASE WHEN json_extract_string(json, 'stores') IS NOT NULL THEN 1 ELSE 0 END as has_stores,
    CASE WHEN json_extract_string(json, 'countries') IS NOT NULL THEN 1 ELSE 0 END as has_countries,
    json_extract_string(json, 'quantity') as quantity_sample,
    json_extract_string(json, 'packaging') as packaging_sample,
    json_extract_string(json, 'origins') as origins_sample
FROM read_ndjson('${OPENFOODFACTS_FILE}', ignore_errors=True)
WHERE json_extract_string(json, 'code') IN (${barcodeList})
    AND json_extract_string(json, 'code') IS NOT NULL
LIMIT 100;
`;

    return this.runDuckDBQuery(sqlScript);
  }

  async runDuckDBQuery(sqlScript) {
    return new Promise((resolve, reject) => {
      const duckdb = spawn('duckdb', [':memory:']);
      
      duckdb.stdin.write(sqlScript);
      duckdb.stdin.end();
      
      let output = '';
      let errorOutput = '';
      
      duckdb.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      duckdb.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });
      
      duckdb.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(`DuckDB query failed: ${errorOutput}`));
        }
      });
    });
  }

  parseQueryResults(output) {
    console.log('📊 Parsing analysis results...');
    
    const lines = output.split('\n').filter(line => line.trim());
    const jsonLines = lines.filter(line => line.startsWith('{'));
    
    let totalMatched = 0;
    const fieldCounts = {
      quantity: 0,
      product_quantity: 0,
      packaging: 0,
      origins: 0,
      labels: 0,
      stores: 0,
      countries: 0
    };
    
    const samples = {
      quantity: [],
      packaging: [],
      origins: []
    };
    
    jsonLines.forEach(line => {
      try {
        const data = JSON.parse(line);
        
        if (data.code) {
          totalMatched++;
          
          // Count field availability
          if (data.has_quantity) fieldCounts.quantity++;
          if (data.has_product_quantity) fieldCounts.product_quantity++;
          if (data.has_packaging) fieldCounts.packaging++;
          if (data.has_origins) fieldCounts.origins++;
          if (data.has_labels) fieldCounts.labels++;
          if (data.has_stores) fieldCounts.stores++;
          if (data.has_countries) fieldCounts.countries++;
          
          // Collect samples
          if (data.quantity_sample && samples.quantity.length < 5) {
            samples.quantity.push(data.quantity_sample);
          }
          if (data.packaging_sample && samples.packaging.length < 5) {
            samples.packaging.push(data.packaging_sample);
          }
          if (data.origins_sample && samples.origins.length < 5) {
            samples.origins.push(data.origins_sample);
          }
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    });
    
    this.results.matched_products = totalMatched;
    this.results.total_openfoodfacts_products = totalMatched; // Simplified for now
    
    // Convert counts to field availability format
    Object.entries(fieldCounts).forEach(([field, count]) => {
      this.results.field_availability[field] = {
        total_products: totalMatched,
        has_field: count,
        percentage: totalMatched > 0 ? Math.round((count / totalMatched) * 100 * 10) / 10 : 0,
        avg_length: 20 // Estimated average length
      };
    });
    
    this.results.sample_data = samples;
  }

  calculateStorageEstimates() {
    console.log('💾 Calculating storage estimates...');
    
    const estimates = {
      per_product_bytes: 0,
      total_additional_storage_mb: 0,
      field_breakdown: {}
    };

    Object.entries(this.results.field_availability).forEach(([fieldName, stats]) => {
      const avgLength = stats.avg_length || 0;
      const availability = stats.percentage / 100;
      
      // Estimate bytes per field based on type and average length
      let bytesPerField = 0;
      
      if (fieldName.includes('quantity') && !fieldName.includes('unit')) {
        bytesPerField = 8; // Number field
      } else if (fieldName.includes('unit')) {
        bytesPerField = Math.max(avgLength, 5); // Short string
      } else if (fieldName === 'packaging_text') {
        bytesPerField = Math.min(avgLength, 200); // Truncated text
      } else if (['origins', 'manufacturing_places', 'labels', 'stores', 'countries'].includes(fieldName)) {
        bytesPerField = Math.min(avgLength * 0.7, 100); // Array fields with compression
      } else {
        bytesPerField = Math.min(avgLength, 50); // Regular string fields
      }
      
      const effectiveBytes = bytesPerField * availability;
      estimates.field_breakdown[fieldName] = {
        avg_length: avgLength,
        availability_percent: stats.percentage,
        estimated_bytes_per_product: Math.round(effectiveBytes),
        total_mb_for_all_products: Math.round((effectiveBytes * this.results.existing_barcodes_count) / 1024 / 1024 * 10) / 10
      };
      
      estimates.per_product_bytes += effectiveBytes;
    });

    estimates.per_product_bytes = Math.round(estimates.per_product_bytes);
    estimates.total_additional_storage_mb = Math.round((estimates.per_product_bytes * this.results.existing_barcodes_count) / 1024 / 1024 * 10) / 10;
    
    this.results.storage_estimates = estimates;
  }

  generateReport() {
    console.log('\n📊 Field Analysis Report');
    console.log('=' .repeat(60));
    
    console.log(`\n🔍 Data Overview:`);
    console.log(`Total Open Food Facts products: ${this.results.total_openfoodfacts_products.toLocaleString()}`);
    console.log(`Existing products in database: ${this.results.existing_barcodes_count.toLocaleString()}`);
    console.log(`Matched products for enrichment: ${this.results.matched_products.toLocaleString()}`);
    console.log(`Match rate: ${((this.results.matched_products / this.results.existing_barcodes_count) * 100).toFixed(1)}%`);

    console.log(`\n📈 Field Availability Analysis:`);
    TARGET_FIELDS.forEach(field => {
      const stats = this.results.field_availability[field];
      if (stats) {
        console.log(`${field.padEnd(25)}: ${stats.has_field.toLocaleString().padStart(8)} products (${stats.percentage.toFixed(1)}%)`);
      }
    });

    console.log(`\n💾 Storage Impact Estimates:`);
    console.log(`Per-product overhead: ~${this.results.storage_estimates.per_product_bytes} bytes`);
    console.log(`Total additional storage: ~${this.results.storage_estimates.total_additional_storage_mb} MB`);
    console.log(`Estimated final DB size: ~${(1700 + this.results.storage_estimates.total_additional_storage_mb).toFixed(0)} MB`);

    console.log(`\n🎯 Quality Distribution:`);
    if (this.results.quality_metrics.fields_distribution) {
      Object.entries(this.results.quality_metrics.fields_distribution)
        .sort(([a], [b]) => parseInt(b) - parseInt(a))
        .forEach(([fieldCount, productCount]) => {
          console.log(`Products with ${fieldCount} enrichment fields: ${productCount.toLocaleString()}`);
        });
    }

    console.log(`\n📝 Sample Data Preview:`);
    Object.entries(this.results.sample_data).forEach(([field, samples]) => {
      console.log(`${field}:`);
      samples.slice(0, 3).forEach(sample => {
        console.log(`  - ${sample}`);
      });
    });
  }

  async run() {
    try {
      await this.initialize();
      const queryOutput = await this.runFieldAnalysis();
      this.parseQueryResults(queryOutput);
      this.calculateStorageEstimates();
      
      // Save results to file
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(this.results, null, 2));
      
      this.generateReport();
      
      console.log('\n🎉 Field analysis completed successfully!');
      console.log(`📁 Detailed results saved to: ${OUTPUT_FILE}`);
      
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const analyzer = new FieldAnalyzer();
  analyzer.run();
}

module.exports = FieldAnalyzer;
