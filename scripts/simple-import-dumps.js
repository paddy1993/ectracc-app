#!/usr/bin/env node

/**
 * Simple MongoDB Dump Importer
 * Imports Open Facts dumps using a simpler approach
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const os = require('os');

// Configuration
const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://patrickahern93_db_user:MxRIg6Jop0nK6qay@cluster0.wxqzvqa.mongodb.net/ectracc?retryWrites=true&w=majority&appName=Cluster0';

class SimpleImporter {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async initialize() {
    console.log('🚀 Simple MongoDB Dump Importer');
    console.log('📦 Connecting to MongoDB Atlas...');
    
    this.client = new MongoClient(MONGODB_URI);
    await this.client.connect();
    this.db = this.client.db('ectracc');
    console.log('✅ Connected to MongoDB Atlas');
  }

  async importDumpWithMongorestore(dumpFile, tempDbName) {
    const fullPath = path.join(DESKTOP_PATH, dumpFile);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`❌ File not found: ${dumpFile}`);
      return false;
    }

    console.log(`📦 Importing ${dumpFile} to temporary database: ${tempDbName}`);
    
    // Create a temporary URI for the specific database
    const tempUri = MONGODB_URI.replace('/ectracc?', `/${tempDbName}?`);
    
    const command = `mongorestore --uri="${tempUri}" --drop "${fullPath}"`;
    
    return new Promise((resolve, reject) => {
      console.log('🔄 Running mongorestore...');
      
      exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Mongorestore failed:', error.message);
          console.error('stderr:', stderr);
          resolve(false);
        } else {
          console.log('✅ Mongorestore completed');
          if (stdout) console.log(stdout);
          resolve(true);
        }
      });
    });
  }

  async processAndCleanData(tempDbName, sourceName, maxProducts = 10000) {
    console.log(`🧹 Processing and cleaning data from ${tempDbName}...`);
    
    const tempDb = this.client.db(tempDbName);
    const collections = await tempDb.listCollections().toArray();
    
    console.log(`📋 Found collections: ${collections.map(c => c.name).join(', ')}`);
    
    // Find the products collection (might have different names)
    let sourceCollection = null;
    for (const coll of collections) {
      if (coll.name.includes('product') || coll.name === 'products') {
        sourceCollection = tempDb.collection(coll.name);
        console.log(`📦 Using collection: ${coll.name}`);
        break;
      }
    }
    
    if (!sourceCollection) {
      console.log('❌ No products collection found');
      return 0;
    }
    
    const targetCollection = this.db.collection('products');
    
    let imported = 0;
    let processed = 0;
    let skipped = 0;
    
    console.log(`📊 Processing up to ${maxProducts} products...`);
    
    const cursor = sourceCollection.find({}).limit(maxProducts);
    
    while (await cursor.hasNext()) {
      const product = await cursor.next();
      processed++;
      
      try {
        const cleanedProduct = this.cleanProduct(product, sourceName);
        if (!cleanedProduct) {
          skipped++;
          continue;
        }
        
        // Use upsert to avoid duplicates
        await targetCollection.updateOne(
          { code: cleanedProduct.code },
          { $set: cleanedProduct },
          { upsert: true }
        );
        
        imported++;
        
        if (processed % 1000 === 0) {
          console.log(`📈 Progress: ${processed} processed, ${imported} imported, ${skipped} skipped`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing product:`, error.message);
        skipped++;
      }
    }
    
    console.log(`✅ Completed: ${imported} products imported from ${sourceName}`);
    
    // Drop temporary database
    await tempDb.dropDatabase();
    console.log(`🗑️ Dropped temporary database: ${tempDbName}`);
    
    return imported;
  }

  cleanProduct(product, sourceName) {
    if (!product || !product.code) {
      return null;
    }

    // Remove all image-related fields
    const imagesToRemove = [
      'image_url', 'image_small_url', 'image_thumb_url',
      'image_front_url', 'image_front_small_url', 'image_front_thumb_url',
      'image_ingredients_url', 'image_ingredients_small_url', 'image_ingredients_thumb_url',
      'image_nutrition_url', 'image_nutrition_small_url', 'image_nutrition_thumb_url',
      'images', 'selected_images', 'image_packaging_url', 'image_packaging_small_url',
      'image_packaging_thumb_url'
    ];

    const cleaned = { ...product };
    
    // Remove image fields
    imagesToRemove.forEach(field => {
      delete cleaned[field];
    });

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
    return brands.split(',').map(b => b.trim()).slice(0, 5);
  }

  parseCategories(categories) {
    if (!categories) return [];
    if (Array.isArray(categories)) return categories.slice(0, 10);
    return categories.split(',').map(c => c.trim()).slice(0, 10);
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
      const baseFootprint = {
        'a': 0.8, 'b': 1.5, 'c': 2.5, 'd': 3.5, 'e': 4.8
      };
      return baseFootprint[grade] || 2.5;
    }
    
    if (product.categories) {
      const categories = product.categories.toLowerCase();
      if (categories.includes('meat')) return 4.5;
      if (categories.includes('dairy')) return 3.2;
      if (categories.includes('fish')) return 2.8;
      if (categories.includes('vegetable') || categories.includes('fruit')) return 0.5;
      if (categories.includes('cosmetic') || categories.includes('beauty')) return 1.0;
    }
    
    return 2.0;
  }

  async printStats() {
    const collection = this.db.collection('products');
    const totalCount = await collection.countDocuments();
    const openFactsCount = await collection.countDocuments({ source: { $regex: /^open/ } });
    
    console.log('\n📊 Database Statistics:');
    console.log(`   • Total Products: ${totalCount.toLocaleString()}`);
    console.log(`   • Open Facts Products: ${openFactsCount.toLocaleString()}`);
    
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
      
      const dumps = [
        { file: 'openbeautyfacts-mongodbdump', name: 'open_beauty_facts', maxProducts: 5000 },
        { file: 'openproductsfacts-mongodbdump', name: 'open_products_facts', maxProducts: 8000 },
        { file: 'openfoodfacts-mongodbdump', name: 'open_food_facts', maxProducts: 20000 }
      ];
      
      let totalImported = 0;
      
      for (const dump of dumps) {
        console.log(`\n🔍 Processing ${dump.name}...`);
        
        const tempDbName = `temp_${dump.name}`;
        const success = await this.importDumpWithMongorestore(dump.file, tempDbName);
        
        if (success) {
          const imported = await this.processAndCleanData(tempDbName, dump.name, dump.maxProducts);
          totalImported += imported;
        } else {
          console.log(`⏭️ Skipping ${dump.name} due to import failure`);
        }
      }
      
      await this.printStats();
      
      console.log(`\n🎉 Import completed! Total products imported: ${totalImported.toLocaleString()}`);
      
    } catch (error) {
      console.error('❌ Import failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

if (require.main === module) {
  const importer = new SimpleImporter();
  importer.run().catch(console.error);
}

module.exports = SimpleImporter;
