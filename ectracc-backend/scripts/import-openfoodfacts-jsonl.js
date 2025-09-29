#!/usr/bin/env node

/**
 * Import Open Food Facts JSONL Data
 * Processes the JSONL format data from Open Food Facts
 * Removes images and imports to MongoDB Atlas
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { createGunzip } = require('zlib');
const readline = require('readline');

// Configuration
const DOWNLOAD_PATH = path.join(__dirname, '../temp-data');
const JSONL_FILE = path.join(DOWNLOAD_PATH, 'openfoodfacts-sample.jsonl.gz');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://patrickahern93_db_user:MxRIg6Jop0nK6qay@cluster0.wxqzvqa.mongodb.net/ectracc?retryWrites=true&w=majority&appName=Cluster0';

// Processing limits
const MAX_PRODUCTS = 5000; // Limit for sample testing
const BATCH_SIZE = 1000;

class OpenFoodFactsImporter {
  constructor() {
    this.client = null;
    this.db = null;
    this.stats = {
      processed: 0,
      imported: 0,
      skipped: 0,
      errors: 0
    };
  }

  async initialize() {
    console.log('🚀 Open Food Facts JSONL Importer');
    console.log(`📊 Will process up to ${MAX_PRODUCTS.toLocaleString()} products`);
    
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB Atlas...');
    this.client = new MongoClient(MONGODB_URI);
    await this.client.connect();
    this.db = this.client.db('ectracc');
    console.log('✅ Connected to MongoDB Atlas');
  }

  checkDownload() {
    if (!fs.existsSync(JSONL_FILE)) {
      console.log('❌ JSONL file not found. Please download it first:');
      console.log('   curl -L -o temp-data/openfoodfacts-products.jsonl.gz https://static.openfoodfacts.org/data/openfoodfacts-products.jsonl.gz');
      return false;
    }

    const stats = fs.statSync(JSONL_FILE);
    console.log(`📄 Found JSONL file: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    
    if (stats.size < 1000000) { // Less than 1MB suggests incomplete download
      console.log('⚠️ File seems too small, might be incomplete');
      return false;
    }
    
    return true;
  }

  cleanProduct(product) {
    if (!product || !product.code) {
      return null;
    }

    // Remove all image-related fields to save space
    const imagesToRemove = [
      'image_url', 'image_small_url', 'image_thumb_url',
      'image_front_url', 'image_front_small_url', 'image_front_thumb_url',
      'image_ingredients_url', 'image_ingredients_small_url', 'image_ingredients_thumb_url',
      'image_nutrition_url', 'image_nutrition_small_url', 'image_nutrition_thumb_url',
      'image_packaging_url', 'image_packaging_small_url', 'image_packaging_thumb_url',
      'images', 'selected_images'
    ];

    const cleaned = { ...product };
    
    // Remove image fields
    imagesToRemove.forEach(field => {
      delete cleaned[field];
    });

    // Create standardized product for ECTRACC
    const essentialProduct = {
      _id: cleaned.code,
      code: cleaned.code,
      barcode: cleaned.code,
      product_name: cleaned.product_name || cleaned.product_name_en,
      brands: this.parseBrands(cleaned.brands),
      categories: this.parseCategories(cleaned.categories),
      ecoscore_grade: cleaned.ecoscore_grade,
      nutriscore_grade: cleaned.nutriscore_grade,
      nova_group: cleaned.nova_group,
      nutriments: this.cleanNutriments(cleaned.nutriments),
      ingredients_text: cleaned.ingredients_text || cleaned.ingredients_text_en,
      countries: cleaned.countries,
      manufacturing_places: cleaned.manufacturing_places,
      labels: cleaned.labels,
      packaging: cleaned.packaging,
      quantity: cleaned.quantity,
      serving_size: cleaned.serving_size,
      last_modified_t: cleaned.last_modified_t,
      created_t: cleaned.created_t,
      source: 'open_food_facts',
      carbon_footprint: this.calculateCarbonFootprint(cleaned),
      imported_at: new Date().toISOString()
    };

    // Only return products with essential data
    if (essentialProduct.code && 
        (essentialProduct.product_name || essentialProduct.brands.length > 0) &&
        essentialProduct.product_name !== '' &&
        essentialProduct.product_name !== null) {
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
      if (nutriments[field] !== undefined && nutriments[field] !== null && !isNaN(nutriments[field])) {
        essential[field] = parseFloat(nutriments[field]);
      }
    });
    
    return essential;
  }

  calculateCarbonFootprint(product) {
    // Enhanced carbon footprint calculation based on eco-score
    if (product.ecoscore_grade) {
      const grade = product.ecoscore_grade.toLowerCase();
      const baseFootprint = {
        'a': 0.8,
        'b': 1.5, 
        'c': 2.5,
        'd': 3.5,
        'e': 4.8
      };
      return baseFootprint[grade] || 2.5;
    }
    
    // Category-based fallback calculation
    if (product.categories) {
      const categories = product.categories.toLowerCase();
      if (categories.includes('meat') || categories.includes('beef')) return 4.5;
      if (categories.includes('dairy') || categories.includes('cheese')) return 3.2;
      if (categories.includes('fish') || categories.includes('seafood')) return 2.8;
      if (categories.includes('vegetable') || categories.includes('fruit')) return 0.5;
      if (categories.includes('plant-based')) return 0.8;
    }
    
    return 2.0; // Default footprint
  }

  async processJSONL() {
    console.log('🔄 Processing JSONL data...');
    
    const collection = this.db.collection('products');
    let batch = [];
    let processed = 0;
    let imported = 0;
    let skipped = 0;

    // Create read stream with gunzip
    const stream = fs.createReadStream(JSONL_FILE).pipe(createGunzip());
    const rl = readline.createInterface({
      input: stream,
      crlfDelay: Infinity
    });

    return new Promise((resolve, reject) => {
      rl.on('line', async (line) => {
        try {
          // Stop if we've reached the limit
          if (processed >= MAX_PRODUCTS) {
            console.log(`\n⏹️ Reached maximum products limit (${MAX_PRODUCTS.toLocaleString()})`);
            rl.close();
            return;
          }

          processed++;
          
          // Parse JSON
          let product;
          try {
            product = JSON.parse(line);
          } catch (parseError) {
            skipped++;
            return;
          }
          
          // Clean and validate product
          const cleanedProduct = this.cleanProduct(product);
          if (!cleanedProduct) {
            skipped++;
            return;
          }
          
          // Add to batch
          batch.push({
            updateOne: {
              filter: { code: cleanedProduct.code },
              update: { $set: cleanedProduct },
              upsert: true
            }
          });
          
          // Process batch when full
          if (batch.length >= BATCH_SIZE) {
            try {
              await collection.bulkWrite(batch, { ordered: false });
              imported += batch.length;
              batch = [];
              
              if (processed % 10000 === 0) {
                console.log(`\n📊 Progress: ${processed.toLocaleString()} processed, ${imported.toLocaleString()} imported, ${skipped.toLocaleString()} skipped`);
              } else if (processed % 1000 === 0) {
                process.stdout.write(`\r📊 ${processed.toLocaleString()} processed`);
              }
            } catch (bulkError) {
              console.error(`\n❌ Batch write error:`, bulkError.message);
              this.stats.errors++;
            }
          }
          
        } catch (error) {
          console.error(`\n❌ Error processing line:`, error.message);
          this.stats.errors++;
          skipped++;
        }
      });

      rl.on('close', async () => {
        try {
          // Process final batch
          if (batch.length > 0) {
            await collection.bulkWrite(batch, { ordered: false });
            imported += batch.length;
          }

          console.log(`\n✅ Processing completed`);
          
          this.stats.processed = processed;
          this.stats.imported = imported;
          this.stats.skipped = skipped;
          
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      rl.on('error', (error) => {
        reject(error);
      });
    });
  }

  async createIndexes() {
    console.log('📊 Creating optimized database indexes...');
    const collection = this.db.collection('products');
    
    try {
      // Drop existing text index if it exists
      try {
        await collection.dropIndex('product_name_text');
      } catch (e) {
        // Index might not exist, that's okay
      }
      
      await collection.createIndex({ code: 1 }, { unique: true });
      await collection.createIndex({ barcode: 1 });
      await collection.createIndex({ product_name: 'text', brands: 'text', categories: 'text' });
      await collection.createIndex({ ecoscore_grade: 1 });
      await collection.createIndex({ source: 1 });
      await collection.createIndex({ carbon_footprint: 1 });
      await collection.createIndex({ imported_at: 1 });
      
      console.log('✅ Indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error.message);
    }
  }

  async printStats() {
    console.log('\n📊 Import Statistics:');
    console.log(`   • Processed: ${this.stats.processed.toLocaleString()}`);
    console.log(`   • Imported: ${this.stats.imported.toLocaleString()}`);
    console.log(`   • Skipped: ${this.stats.skipped.toLocaleString()}`);
    console.log(`   • Errors: ${this.stats.errors.toLocaleString()}`);
    
    // Get database stats
    const collection = this.db.collection('products');
    const totalCount = await collection.countDocuments();
    const openFactsCount = await collection.countDocuments({ source: 'open_food_facts' });
    
    console.log(`\n📈 Database Status:`);
    console.log(`   • Total Products: ${totalCount.toLocaleString()}`);
    console.log(`   • Open Food Facts: ${openFactsCount.toLocaleString()}`);
    
    // Show breakdown by source
    const sources = await collection.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📋 By Source:');
    sources.forEach(source => {
      console.log(`   • ${source._id || 'unknown'}: ${source.count.toLocaleString()}`);
    });

    // Show eco-score distribution
    const ecoScores = await collection.aggregate([
      { $match: { ecoscore_grade: { $exists: true, $ne: null } } },
      { $group: { _id: '$ecoscore_grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    if (ecoScores.length > 0) {
      console.log('\n🌱 Eco-Score Distribution:');
      ecoScores.forEach(score => {
        console.log(`   • Grade ${score._id.toUpperCase()}: ${score.count.toLocaleString()}`);
      });
    }
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
      
      if (!this.checkDownload()) {
        console.log('❌ Download check failed. Please ensure the JSONL file is downloaded.');
        return;
      }
      
      await this.processJSONL();
      await this.createIndexes();
      await this.printStats();
      
      console.log('\n🎉 Open Food Facts import completed successfully!');
      console.log('🚀 Your ECTRACC database now has real product data from Open Food Facts!');
      console.log(`📊 Ready to test with up to ${this.stats.imported.toLocaleString()} products!`);
      
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
  const importer = new OpenFoodFactsImporter();
  importer.run().catch(console.error);
}

module.exports = OpenFoodFactsImporter;