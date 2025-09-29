#!/usr/bin/env node

/**
 * Import Open Facts Text Dumps
 * Processes the text-based dump files from Open Food Facts, Open Beauty Facts, etc.
 * Removes images and optimizes data for ECTRACC
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { createReadStream } = require('fs');
const { createGunzip } = require('zlib');
const readline = require('readline');
const os = require('os');

// Configuration
const DATADUMPS_PATH = path.join(os.homedir(), 'Desktop', 'Open Facts Datadumps');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://patrickahern93_db_user:MxRIg6Jop0nK6qay@cluster0.wxqzvqa.mongodb.net/ectracc?retryWrites=true&w=majority&appName=Cluster0';

// Files to process
const DUMP_FILES = [
  {
    name: 'Open Pet Food Facts',
    filename: 'openpetfoodfacts-mongodbdump.gz',
    maxProducts: 5000,
    priority: 1
  },
  {
    name: 'Open Products Facts',
    filename: 'openproductsfacts-mongodbdump.gz', 
    maxProducts: 8000,
    priority: 2
  },
  {
    name: 'Open Beauty Facts',
    filename: 'openbeautyfacts-mongodbdump.gz',
    maxProducts: 10000,
    priority: 3
  }
];

class TextDumpImporter {
  constructor() {
    this.client = null;
    this.db = null;
    this.stats = {
      totalProcessed: 0,
      totalImported: 0,
      totalSkipped: 0,
      errors: 0
    };
  }

  async initialize() {
    console.log('🚀 Initializing Text Dump Importer...');
    console.log(`📁 Looking for dump files in: ${DATADUMPS_PATH}`);
    
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB Atlas...');
    this.client = new MongoClient(MONGODB_URI);
    await this.client.connect();
    this.db = this.client.db('ectracc');
    console.log('✅ Connected to MongoDB Atlas');
  }

  parseValue(value) {
    if (!value || typeof value !== 'string') return value;
    
    const trimmed = value.trim();
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    
    // Try to parse as number
    if (!isNaN(trimmed) && trimmed !== '') {
      return trimmed.includes('.') ? parseFloat(trimmed) : parseInt(trimmed);
    }
    
    return trimmed;
  }

  parseDocument(text) {
    const doc = {};
    const lines = text.split('\n');
    let currentKey = null;
    let currentValue = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Check if this line contains a key (ends with :)
      const keyMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*):(.*)$/);
      if (keyMatch) {
        // Save previous key-value pair
        if (currentKey && currentValue.length > 0) {
          const valueText = currentValue.join(' ').trim();
          doc[currentKey] = this.parseValue(valueText);
        }
        
        // Start new key-value pair
        currentKey = keyMatch[1];
        currentValue = keyMatch[2] ? [keyMatch[2].trim()] : [];
      } else if (currentKey) {
        // Continue value for current key
        currentValue.push(trimmed);
      }
    }

    // Don't forget the last key-value pair
    if (currentKey && currentValue.length > 0) {
      const valueText = currentValue.join(' ').trim();
      doc[currentKey] = this.parseValue(valueText);
    }

    return doc;
  }

  cleanProduct(product, sourceName) {
    if (!product || !product.code) {
      return null;
    }

    // Remove image-related fields
    const imagesToRemove = [
      'image_url', 'image_small_url', 'image_thumb_url',
      'image_front_url', 'image_front_small_url', 'image_front_thumb_url',
      'image_ingredients_url', 'image_ingredients_small_url', 'image_ingredients_thumb_url',
      'image_nutrition_url', 'image_nutrition_small_url', 'image_nutrition_thumb_url',
      'images', 'selected_images'
    ];

    const cleaned = { ...product };
    imagesToRemove.forEach(field => delete cleaned[field]);

    // Create standardized product
    const essentialProduct = {
      _id: cleaned.code,
      code: cleaned.code,
      barcode: cleaned.code,
      product_name: cleaned.product_name || cleaned.product_name_en || cleaned.name,
      brands: this.parseBrands(cleaned.brands),
      categories: this.parseCategories(cleaned.categories),
      ecoscore_grade: cleaned.ecoscore_grade,
      nutriscore_grade: cleaned.nutriscore_grade,
      nova_group: cleaned.nova_group,
      nutriments: this.cleanNutriments(cleaned.nutriments),
      ingredients_text: cleaned.ingredients_text || cleaned.ingredients_text_en,
      countries: cleaned.countries,
      labels: cleaned.labels,
      packaging: cleaned.packaging,
      quantity: cleaned.quantity,
      last_modified_t: cleaned.last_modified_t,
      source: sourceName.toLowerCase().replace(/\s+/g, '_'),
      carbon_footprint: this.calculateCarbonFootprint(cleaned),
      imported_at: new Date().toISOString()
    };

    // Only return products with essential data
    if (essentialProduct.code && (essentialProduct.product_name || essentialProduct.brands.length > 0)) {
      return essentialProduct;
    }
    
    return null;
  }

  parseBrands(brands) {
    if (!brands) return [];
    if (Array.isArray(brands)) return brands.slice(0, 5);
    return brands.split(',').map(b => b.trim()).filter(b => b).slice(0, 5);
  }

  parseCategories(categories) {
    if (!categories) return [];
    if (Array.isArray(categories)) return categories.slice(0, 10);
    return categories.split(',').map(c => c.trim()).filter(c => c).slice(0, 10);
  }

  cleanNutriments(nutriments) {
    if (!nutriments || typeof nutriments !== 'object') return {};
    
    const essential = {};
    const importantFields = [
      'energy-kcal_100g', 'energy_100g', 'fat_100g', 'saturated-fat_100g',
      'carbohydrates_100g', 'sugars_100g', 'fiber_100g', 'proteins_100g',
      'salt_100g', 'sodium_100g'
    ];
    
    importantFields.forEach(field => {
      if (nutriments[field] !== undefined && nutriments[field] !== null) {
        essential[field] = nutriments[field];
      }
    });
    
    return essential;
  }

  calculateCarbonFootprint(product) {
    if (product.ecoscore_grade) {
      const grade = product.ecoscore_grade.toLowerCase();
      const baseFootprint = { 'a': 0.8, 'b': 1.5, 'c': 2.5, 'd': 3.5, 'e': 4.8 };
      return baseFootprint[grade] || 2.5;
    }
    
    if (product.categories) {
      const categories = product.categories.toLowerCase();
      if (categories.includes('meat')) return 4.5;
      if (categories.includes('dairy')) return 3.2;
      if (categories.includes('fish')) return 2.8;
      if (categories.includes('pet')) return 1.8;
      if (categories.includes('cosmetic') || categories.includes('beauty')) return 1.0;
    }
    
    return 2.0;
  }

  async processFile(dumpInfo) {
    const filePath = path.join(DATADUMPS_PATH, dumpInfo.filename);
    
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File not found: ${dumpInfo.filename}`);
      return 0;
    }

    console.log(`\n🔄 Processing ${dumpInfo.name}...`);
    console.log(`📂 File: ${filePath}`);

    const collection = this.db.collection('products');
    
    let processed = 0;
    let imported = 0;
    let skipped = 0;
    let currentDoc = '';
    let batch = [];
    const batchSize = 100;

    // Create read stream (with gunzip if compressed)
    let stream = createReadStream(filePath);
    if (dumpInfo.filename.endsWith('.gz')) {
      stream = stream.pipe(createGunzip());
    }

    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    return new Promise((resolve, reject) => {
      rl.on('line', async (line) => {
        try {
          // Check if this line starts a new document
          if (line.includes('_id:') || line.includes('code:')) {
            // Process previous document if exists
            if (currentDoc.trim()) {
              processed++;
              
              try {
                const rawProduct = this.parseDocument(currentDoc);
                const cleanedProduct = this.cleanProduct(rawProduct, dumpInfo.name);
                
                if (cleanedProduct) {
                  batch.push({
                    updateOne: {
                      filter: { code: cleanedProduct.code },
                      update: { $set: cleanedProduct },
                      upsert: true
                    }
                  });
                  imported++;
                } else {
                  skipped++;
                }

                // Process batch when full
                if (batch.length >= batchSize) {
                  await collection.bulkWrite(batch, { ordered: false });
                  batch = [];
                  
                  if (processed % 1000 === 0) {
                    console.log(`📊 Progress: ${processed} processed, ${imported} imported, ${skipped} skipped`);
                  }
                }

                // Stop if we've reached the limit
                if (processed >= dumpInfo.maxProducts) {
                  console.log(`⏹️ Reached maximum products limit (${dumpInfo.maxProducts})`);
                  rl.close();
                  return;
                }

              } catch (error) {
                console.error(`❌ Error processing product: ${error.message}`);
                skipped++;
              }
            }
            
            currentDoc = line + '\n';
          } else {
            currentDoc += line + '\n';
          }
        } catch (error) {
          console.error(`❌ Error processing line: ${error.message}`);
        }
      });

      rl.on('close', async () => {
        try {
          // Process final document
          if (currentDoc.trim()) {
            const rawProduct = this.parseDocument(currentDoc);
            const cleanedProduct = this.cleanProduct(rawProduct, dumpInfo.name);
            
            if (cleanedProduct) {
              batch.push({
                updateOne: {
                  filter: { code: cleanedProduct.code },
                  update: { $set: cleanedProduct },
                  upsert: true
                }
              });
              imported++;
            }
          }

          // Process final batch
          if (batch.length > 0) {
            await collection.bulkWrite(batch, { ordered: false });
          }

          console.log(`✅ ${dumpInfo.name} completed: ${imported} products imported`);
          
          this.stats.totalProcessed += processed;
          this.stats.totalImported += imported;
          this.stats.totalSkipped += skipped;
          
          resolve(imported);
        } catch (error) {
          reject(error);
        }
      });

      rl.on('error', (error) => {
        reject(error);
      });
    });
  }

  async printStats() {
    console.log('\n📊 Import Statistics:');
    console.log(`   • Total Processed: ${this.stats.totalProcessed.toLocaleString()}`);
    console.log(`   • Total Imported: ${this.stats.totalImported.toLocaleString()}`);
    console.log(`   • Total Skipped: ${this.stats.totalSkipped.toLocaleString()}`);
    console.log(`   • Errors: ${this.stats.errors.toLocaleString()}`);
    
    // Get database stats
    const collection = this.db.collection('products');
    const totalCount = await collection.countDocuments();
    const openFactsCount = await collection.countDocuments({ source: { $regex: /^open/ } });
    
    console.log(`\n📈 Database Status:`);
    console.log(`   • Total Products in DB: ${totalCount.toLocaleString()}`);
    console.log(`   • Open Facts Products: ${openFactsCount.toLocaleString()}`);
    
    // Show breakdown by source
    const sources = await collection.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📋 By Source:');
    sources.forEach(source => {
      console.log(`   • ${source._id}: ${source.count.toLocaleString()}`);
    });
  }

  async cleanup() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Database connection closed');
    }
  }

  async run() {
    try {
      await this.initialize();
      
      // Sort files by priority (smallest first)
      const sortedFiles = DUMP_FILES.sort((a, b) => a.priority - b.priority);
      
      for (const dumpInfo of sortedFiles) {
        console.log(`\n🔍 Checking ${dumpInfo.name}...`);
        
        try {
          await this.processFile(dumpInfo);
        } catch (error) {
          console.error(`❌ Error processing ${dumpInfo.name}:`, error.message);
          this.stats.errors++;
        }
      }
      
      await this.printStats();
      
      console.log('\n🎉 Import process completed successfully!');
      console.log('🚀 Your ECTRACC database now has real Open Facts product data!');
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the importer
if (require.main === module) {
  const importer = new TextDumpImporter();
  importer.run().catch(console.error);
}

module.exports = TextDumpImporter;
