#!/usr/bin/env node

/**
 * Storage-Optimized Data Extraction
 * Extracts enrichment data from Open Food Facts with compression techniques
 * to stay within MongoDB storage limits
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
const OUTPUT_FILE = path.join(DATA_DIR, 'enrichment_data.json');

// Storage optimization mappings
const COUNTRY_CODES = {
  'United States': 'US', 'France': 'FR', 'Germany': 'DE', 'United Kingdom': 'GB',
  'Spain': 'ES', 'Italy': 'IT', 'Canada': 'CA', 'Australia': 'AU', 'Japan': 'JP',
  'Netherlands': 'NL', 'Belgium': 'BE', 'Switzerland': 'CH', 'Austria': 'AT',
  'Sweden': 'SE', 'Norway': 'NO', 'Denmark': 'DK', 'Finland': 'FI', 'Poland': 'PL',
  'Czech Republic': 'CZ', 'Hungary': 'HU', 'Portugal': 'PT', 'Greece': 'GR',
  'Ireland': 'IE', 'Luxembourg': 'LU', 'Slovenia': 'SI', 'Slovakia': 'SK',
  'Estonia': 'EE', 'Latvia': 'LV', 'Lithuania': 'LT', 'Malta': 'MT', 'Cyprus': 'CY'
};

const PACKAGING_ABBREVIATIONS = {
  'bottle': 'btl', 'bottles': 'btl', 'can': 'can', 'cans': 'can',
  'package': 'pkg', 'packages': 'pkg', 'box': 'box', 'boxes': 'box',
  'jar': 'jar', 'jars': 'jar', 'tube': 'tube', 'tubes': 'tube',
  'plastic': 'plas', 'cardboard': 'card', 'glass': 'glas',
  'aluminum': 'alum', 'paper': 'papr', 'metal': 'metl'
};

const STORE_ABBREVIATIONS = {
  'walmart': 'wmt', 'target': 'tgt', 'kroger': 'krog', 'safeway': 'safe',
  'whole foods': 'whol', 'trader joes': 'tj', 'costco': 'cost',
  'carrefour': 'carr', 'tesco': 'tesc', 'aldi': 'aldi', 'lidl': 'lidl',
  'intermarche': 'inte', 'leclerc': 'lecl', 'casino': 'casi',
  'monoprix': 'mono', 'franprix': 'fran', 'super u': 'spu'
};

class EnrichmentExtractor {
  constructor() {
    this.stats = {
      total_existing_products: 0,
      matched_products: 0,
      enriched_products: 0,
      field_stats: {},
      storage_saved_bytes: 0,
      estimated_final_size_mb: 0
    };
  }

  async initialize() {
    console.log('🚀 Storage-Optimized Enrichment Data Extractor');
    console.log('💾 Extracting data with compression techniques for MongoDB storage efficiency\n');

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

  async extractEnrichmentData() {
    console.log('🔍 Extracting enrichment data with storage optimization...');

    // Load existing barcodes
    const existingBarcodes = JSON.parse(fs.readFileSync(EXISTING_BARCODES_FILE, 'utf8'));
    this.stats.total_existing_products = existingBarcodes.length;
    
    // Create barcode list for DuckDB matching
    const barcodeList = existingBarcodes.map(p => `'${p.barcode}'`).join(',');
    
    const sqlScript = `
.timer on
.mode json

-- Create temporary table with existing barcodes for matching
CREATE TEMP TABLE existing_barcodes AS
SELECT unnest([${barcodeList}]) as barcode;

-- Extract enrichment data with storage optimization
CREATE TEMP TABLE enrichment_data AS
SELECT 
    json_extract_string(json, 'code') as barcode,
    json_extract_string(json, 'product_name') as product_name,
    
    -- Quantity fields
    json_extract_string(json, 'quantity') as quantity,
    CAST(json_extract_string(json, 'product_quantity') AS DOUBLE) as product_quantity,
    json_extract_string(json, 'product_quantity_unit') as product_quantity_unit,
    json_extract_string(json, 'net_weight') as net_weight,
    json_extract_string(json, 'net_weight_unit') as net_weight_unit,
    
    -- Packaging fields
    json_extract_string(json, 'packaging') as packaging,
    SUBSTR(json_extract_string(json, 'packaging_text'), 1, 200) as packaging_text, -- Truncate to 200 chars
    
    -- Location fields
    json_extract_string(json, 'origins') as origins,
    json_extract_string(json, 'manufacturing_places') as manufacturing_places,
    json_extract_string(json, 'countries') as countries,
    
    -- Market fields
    json_extract_string(json, 'labels') as labels,
    json_extract_string(json, 'stores') as stores,
    
    -- Quality indicators
    json_extract_string(json, 'lang') as lang,
    json_extract_string(json, 'last_modified_t') as last_modified_t,
    
    -- Calculate data quality score
    (CASE WHEN json_extract_string(json, 'quantity') IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN json_extract_string(json, 'product_quantity') IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN json_extract_string(json, 'packaging') IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN json_extract_string(json, 'origins') IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN json_extract_string(json, 'labels') IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN json_extract_string(json, 'stores') IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN json_extract_string(json, 'countries') IS NOT NULL THEN 1 ELSE 0 END) as quality_score

FROM read_ndjson('${OPENFOODFACTS_FILE}', ignore_errors=True)
WHERE json_extract_string(json, 'code') IN (SELECT barcode FROM existing_barcodes)
    AND json_extract_string(json, 'code') IS NOT NULL
    AND json_extract_string(json, 'lang') IN ('en', 'fr', 'es', 'de', 'it') -- Focus on major languages
    -- Only include products with at least 2 enrichment fields
    AND (CASE WHEN json_extract_string(json, 'quantity') IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN json_extract_string(json, 'product_quantity') IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN json_extract_string(json, 'packaging') IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN json_extract_string(json, 'origins') IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN json_extract_string(json, 'labels') IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN json_extract_string(json, 'stores') IS NOT NULL THEN 1 ELSE 0 END +
         CASE WHEN json_extract_string(json, 'countries') IS NOT NULL THEN 1 ELSE 0 END) >= 2;

-- Export enrichment data
SELECT * FROM enrichment_data ORDER BY quality_score DESC, barcode;
`;

    const queryOutput = await this.runDuckDBQuery(sqlScript);
    return this.processEnrichmentData(queryOutput);
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

  processEnrichmentData(queryOutput) {
    console.log('🔧 Processing and optimizing enrichment data...');
    
    const lines = queryOutput.split('\n').filter(line => line.trim());
    const jsonLines = lines.filter(line => line.startsWith('{'));
    
    const enrichmentData = [];
    let totalOriginalBytes = 0;
    let totalOptimizedBytes = 0;

    jsonLines.forEach(line => {
      try {
        const rawData = JSON.parse(line);
        const optimizedData = this.optimizeProductData(rawData);
        
        if (optimizedData) {
          enrichmentData.push(optimizedData);
          
          // Calculate storage savings
          totalOriginalBytes += JSON.stringify(rawData).length;
          totalOptimizedBytes += JSON.stringify(optimizedData).length;
        }
      } catch (e) {
        // Skip invalid JSON lines
      }
    });

    this.stats.matched_products = enrichmentData.length;
    this.stats.storage_saved_bytes = totalOriginalBytes - totalOptimizedBytes;
    this.stats.estimated_final_size_mb = Math.round((totalOptimizedBytes / 1024 / 1024) * 10) / 10;

    return enrichmentData;
  }

  optimizeProductData(rawData) {
    // Skip products with insufficient data
    if (!rawData.barcode || rawData.quality_score < 2) {
      return null;
    }

    const optimized = {
      barcode: rawData.barcode,
      enrichment_fields: {}
    };

    // Optimize quantity fields
    if (rawData.quantity) {
      optimized.enrichment_fields.quantity = this.compressQuantityString(rawData.quantity);
    }
    if (rawData.product_quantity) {
      optimized.enrichment_fields.product_quantity = rawData.product_quantity;
    }
    if (rawData.product_quantity_unit) {
      optimized.enrichment_fields.product_quantity_unit = this.standardizeUnit(rawData.product_quantity_unit);
    }
    if (rawData.net_weight) {
      optimized.enrichment_fields.net_weight = this.compressQuantityString(rawData.net_weight);
    }
    if (rawData.net_weight_unit) {
      optimized.enrichment_fields.net_weight_unit = this.standardizeUnit(rawData.net_weight_unit);
    }

    // Optimize packaging fields
    if (rawData.packaging) {
      optimized.enrichment_fields.packaging = this.compressPackaging(rawData.packaging);
    }
    if (rawData.packaging_text) {
      optimized.enrichment_fields.packaging_text = rawData.packaging_text.substring(0, 200);
    }

    // Optimize location fields (arrays with limits)
    if (rawData.origins) {
      optimized.enrichment_fields.origins = this.compressLocationArray(rawData.origins, 5);
    }
    if (rawData.manufacturing_places) {
      optimized.enrichment_fields.manufacturing_places = this.compressLocationArray(rawData.manufacturing_places, 3);
    }
    if (rawData.countries) {
      optimized.enrichment_fields.countries = this.compressCountryArray(rawData.countries, 5);
    }

    // Optimize market fields
    if (rawData.labels) {
      optimized.enrichment_fields.labels = this.compressLabelsArray(rawData.labels, 5);
    }
    if (rawData.stores) {
      optimized.enrichment_fields.stores = this.compressStoresArray(rawData.stores, 5);
    }

    // Add metadata
    optimized.quality_score = rawData.quality_score;
    optimized.lang = rawData.lang;
    optimized.last_modified_t = rawData.last_modified_t;

    return optimized;
  }

  compressQuantityString(quantity) {
    if (!quantity) return null;
    
    // Remove extra spaces and standardize format
    return quantity.trim()
      .replace(/\s+/g, '')  // Remove all spaces
      .replace(/grammes?/gi, 'g')
      .replace(/kilograms?/gi, 'kg')
      .replace(/litres?/gi, 'L')
      .replace(/millilitres?/gi, 'ml')
      .replace(/ounces?/gi, 'oz')
      .replace(/pounds?/gi, 'lb')
      .substring(0, 20); // Limit length
  }

  standardizeUnit(unit) {
    if (!unit) return null;
    
    const standardUnits = {
      'g': 'g', 'gram': 'g', 'grams': 'g', 'gramme': 'g', 'grammes': 'g',
      'kg': 'kg', 'kilogram': 'kg', 'kilograms': 'kg',
      'l': 'L', 'liter': 'L', 'liters': 'L', 'litre': 'L', 'litres': 'L',
      'ml': 'ml', 'milliliter': 'ml', 'milliliters': 'ml', 'millilitre': 'ml',
      'oz': 'oz', 'ounce': 'oz', 'ounces': 'oz',
      'lb': 'lb', 'pound': 'lb', 'pounds': 'lb'
    };
    
    return standardUnits[unit.toLowerCase()] || unit.substring(0, 10);
  }

  compressPackaging(packaging) {
    if (!packaging) return null;
    
    let compressed = packaging.toLowerCase();
    
    // Apply abbreviations
    Object.entries(PACKAGING_ABBREVIATIONS).forEach(([full, abbrev]) => {
      compressed = compressed.replace(new RegExp(full, 'gi'), abbrev);
    });
    
    return compressed.substring(0, 50);
  }

  compressLocationArray(locations, maxItems) {
    if (!locations) return null;
    
    const items = locations.split(',').map(item => item.trim()).filter(item => item);
    return items.slice(0, maxItems).map(item => item.substring(0, 30));
  }

  compressCountryArray(countries, maxItems) {
    if (!countries) return null;
    
    const items = countries.split(',').map(item => item.trim()).filter(item => item);
    return items.slice(0, maxItems).map(country => {
      return COUNTRY_CODES[country] || country.substring(0, 10);
    });
  }

  compressLabelsArray(labels, maxItems) {
    if (!labels) return null;
    
    const items = labels.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
    
    // Standardize common labels
    const standardLabels = {
      'organic': 'org', 'bio': 'org', 'biological': 'org',
      'fair trade': 'fair', 'fairtrade': 'fair',
      'gluten free': 'gf', 'gluten-free': 'gf', 'sans gluten': 'gf',
      'vegan': 'vegan', 'vegetarian': 'veg',
      'non-gmo': 'ngmo', 'without gmo': 'ngmo'
    };
    
    return items.slice(0, maxItems).map(label => {
      return standardLabels[label] || label.substring(0, 15);
    });
  }

  compressStoresArray(stores, maxItems) {
    if (!stores) return null;
    
    const items = stores.split(',').map(item => item.trim().toLowerCase()).filter(item => item);
    return items.slice(0, maxItems).map(store => {
      return STORE_ABBREVIATIONS[store] || store.substring(0, 15);
    });
  }

  generateReport(enrichmentData) {
    console.log('\n📊 Enrichment Data Extraction Report');
    console.log('=' .repeat(60));
    
    console.log(`\n🔍 Extraction Results:`);
    console.log(`Total existing products: ${this.stats.total_existing_products.toLocaleString()}`);
    console.log(`Products matched in Open Food Facts: ${this.stats.matched_products.toLocaleString()}`);
    console.log(`Match rate: ${((this.stats.matched_products / this.stats.total_existing_products) * 100).toFixed(1)}%`);

    // Analyze field coverage
    const fieldCoverage = {};
    enrichmentData.forEach(product => {
      Object.keys(product.enrichment_fields).forEach(field => {
        fieldCoverage[field] = (fieldCoverage[field] || 0) + 1;
      });
    });

    console.log(`\n📈 Field Coverage:`);
    Object.entries(fieldCoverage)
      .sort(([,a], [,b]) => b - a)
      .forEach(([field, count]) => {
        const percentage = ((count / this.stats.matched_products) * 100).toFixed(1);
        console.log(`${field.padEnd(25)}: ${count.toLocaleString().padStart(8)} products (${percentage}%)`);
      });

    console.log(`\n💾 Storage Optimization:`);
    console.log(`Original data size: ${Math.round(this.stats.storage_saved_bytes / 1024 / 1024 * 10) / 10} MB`);
    console.log(`Optimized data size: ${this.stats.estimated_final_size_mb} MB`);
    console.log(`Storage saved: ${Math.round((this.stats.storage_saved_bytes / 1024 / 1024) * 10) / 10} MB`);
    console.log(`Compression ratio: ${Math.round((1 - (this.stats.estimated_final_size_mb / (this.stats.storage_saved_bytes / 1024 / 1024 + this.stats.estimated_final_size_mb))) * 100)}%`);

    // Quality distribution
    const qualityDistribution = {};
    enrichmentData.forEach(product => {
      const score = product.quality_score;
      qualityDistribution[score] = (qualityDistribution[score] || 0) + 1;
    });

    console.log(`\n🎯 Quality Distribution:`);
    Object.entries(qualityDistribution)
      .sort(([a], [b]) => parseInt(b) - parseInt(a))
      .forEach(([score, count]) => {
        console.log(`Products with ${score} enrichment fields: ${count.toLocaleString()}`);
      });
  }

  async run() {
    try {
      await this.initialize();
      const enrichmentData = await this.extractEnrichmentData();
      
      // Save enrichment data
      fs.writeFileSync(OUTPUT_FILE, JSON.stringify(enrichmentData, null, 2));
      
      this.generateReport(enrichmentData);
      
      console.log('\n🎉 Enrichment data extraction completed successfully!');
      console.log(`📁 Enrichment data saved to: ${OUTPUT_FILE}`);
      console.log(`📊 Ready for batch enrichment pipeline`);
      
    } catch (error) {
      console.error('❌ Extraction failed:', error.message);
      process.exit(1);
    }
  }
}

// Run if called directly
if (require.main === module) {
  const extractor = new EnrichmentExtractor();
  extractor.run();
}

module.exports = EnrichmentExtractor;
