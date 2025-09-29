#!/usr/bin/env node

/**
 * Import Open Facts MongoDB Dumps
 * Processes MongoDB dumps from Open Food Facts, Open Beauty Facts, and Open Products Facts
 * Removes images and unnecessary data to optimize storage
 */

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');
const os = require('os');

// Configuration
const DESKTOP_PATH = path.join(os.homedir(), 'Desktop');
const TEMP_DIR = path.join(__dirname, '../temp-dumps');

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://patrickahern93_db_user:MxRIg6Jop0nK6qay@cluster0.wxqzvqa.mongodb.net/ectracc?retryWrites=true&w=majority&appName=Cluster0';
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'ectracc';

// Files to process (starting with smaller ones first)
const DUMP_FILES = [
  {
    name: 'Open Beauty Facts',
    filename: 'openbeautyfacts-mongodbdump',
    collection: 'products',
    priority: 1, // Process first (smallest)
    maxProducts: 10000
  },
  {
    name: 'Open Products Facts',
    filename: 'openproductsfacts-mongodbdump',
    collection: 'products', 
    priority: 2,
    maxProducts: 15000
  },
  {
    name: 'Open Food Facts',
    filename: 'openfoodfacts-mongodbdump',
    collection: 'products',
    priority: 3, // Process last (largest)
    maxProducts: 50000 // Limit for initial import
  }
];

class OpenFactsImporter {
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
    console.log('🚀 Initializing Open Facts Importer...');
    console.log('📁 Looking for dump files on Desktop...');
    
    // Connect to MongoDB
    console.log('📦 Connecting to MongoDB Atlas...');
    this.client = new MongoClient(MONGODB_URI);
    await this.client.connect();
    this.db = this.client.db(DATABASE_NAME);
    console.log(`✅ Connected to database: ${DATABASE_NAME}`);
  }

  async checkDumpFile(dumpInfo) {
    const filePath = path.join(DESKTOP_PATH, dumpInfo.filename);
    
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`📄 Found ${dumpInfo.name}: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
      return { path: filePath, size: stats.size };
    } else {
      console.log(`❌ File not found: ${dumpInfo.filename}`);
      return null;
    }
  }

  async processMongoDump(dumpInfo, filePath) {
    console.log(`\n🔄 Processing ${dumpInfo.name}...`);
    console.log(`📂 File: ${filePath}`);
    
    // For this initial implementation, we'll use mongorestore to import the dump
    // then clean up the data afterwards
    
    const tempDbName = `temp_${dumpInfo.name.toLowerCase().replace(/\s+/g, '_')}`;
    
    try {
      console.log(`📦 Restoring dump to temporary database: ${tempDbName}`);
      
      // Use mongorestore to import the dump to a temporary database
      await this.runMongorestore(filePath, tempDbName);
      
      // Connect to the temporary database and clean the data
      await this.cleanAndTransferData(tempDbName, dumpInfo);
      
      // Drop the temporary database
      await this.client.db(tempDbName).dropDatabase();
      console.log(`🗑️ Dropped temporary database: ${tempDbName}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${dumpInfo.name}:`, error.message);
      this.stats.errors++;
    }
  }

  async runMongorestore(dumpFilePath, tempDbName) {
    return new Promise((resolve, reject) => {
      // Extract connection details from URI
      const uri = new URL(MONGODB_URI);
      const host = uri.hostname;
      const username = uri.username;
      const password = uri.password;
      
      const args = [
        '--host', `${host}:27017`,
        '--username', username,
        '--password', password,
        '--db', tempDbName,
        '--authenticationDatabase', 'admin',
        '--ssl',
        dumpFilePath
      ];
      
      console.log('🔄 Running mongorestore...');
      const mongorestore = spawn('mongorestore', args);
      
      mongorestore.stdout.on('data', (data) => {
        console.log(`📦 ${data.toString().trim()}`);
      });
      
      mongorestore.stderr.on('data', (data) => {
        console.error(`⚠️ ${data.toString().trim()}`);
      });
      
      mongorestore.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Mongorestore completed');
          resolve();
        } else {
          reject(new Error(`Mongorestore failed with code ${code}`));
        }
      });
    });
  }

  async cleanAndTransferData(tempDbName, dumpInfo) {
    console.log(`🧹 Cleaning and transferring data from ${tempDbName}...`);
    
    const tempDb = this.client.db(tempDbName);
    const tempCollection = tempDb.collection('products');
    const targetCollection = this.db.collection('products');
    
    let processed = 0;
    let imported = 0;
    let skipped = 0;
    
    // Process in batches
    const cursor = tempCollection.find({}).limit(dumpInfo.maxProducts || 50000);
    
    while (await cursor.hasNext()) {
      const product = await cursor.next();
      processed++;
      
      try {
        const cleanedProduct = this.cleanProduct(product, dumpInfo.name);
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
          console.log(`📊 Progress: ${processed} processed, ${imported} imported, ${skipped} skipped`);
        }
        
      } catch (error) {
        console.error(`❌ Error processing product ${product.code}:`, error.message);
        this.stats.errors++;
      }
    }
    
    console.log(`✅ ${dumpInfo.name} completed: ${imported} products imported`);
    
    this.stats.totalProcessed += processed;
    this.stats.totalImported += imported;
    this.stats.totalSkipped += skipped;
  }

  cleanProduct(product, sourceName) {
    if (!product || !product.code) {
      return null;
    }

    // Remove all image-related fields to save space
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

    // Create standardized product for ECTRACC
    const essentialProduct = {
      _id: cleaned.code, // Use code as _id
      code: cleaned.code,
      barcode: cleaned.code, // Use code as barcode
      product_name: cleaned.product_name || cleaned.product_name_en || cleaned.name,
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
      last_modified_t: cleaned.last_modified_t || cleaned.last_updated_t,
      created_t: cleaned.created_t,
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
    if (Array.isArray(brands)) return brands.slice(0, 5); // Limit to 5 brands
    return brands.split(',').map(b => b.trim()).slice(0, 5);
  }

  parseCategories(categories) {
    if (!categories) return [];
    if (Array.isArray(categories)) return categories.slice(0, 10); // Limit to 10 categories
    return categories.split(',').map(c => c.trim()).slice(0, 10);
  }

  cleanNutriments(nutriments) {
    if (!nutriments || typeof nutriments !== 'object') return {};
    
    // Keep only essential nutrition data
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
    // Enhanced carbon footprint calculation
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
    
    // Category-based calculation
    if (product.categories) {
      const categories = product.categories.toLowerCase();
      if (categories.includes('meat') || categories.includes('beef')) return 4.5;
      if (categories.includes('dairy') || categories.includes('cheese')) return 3.2;
      if (categories.includes('fish') || categories.includes('seafood')) return 2.8;
      if (categories.includes('vegetable') || categories.includes('fruit')) return 0.5;
      if (categories.includes('cosmetic') || categories.includes('beauty')) return 1.0;
    }
    
    return 2.0; // Default footprint
  }

  async createIndexes() {
    console.log('📊 Creating optimized database indexes...');
    const collection = this.db.collection('products');
    
    try {
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
        
        const fileInfo = await this.checkDumpFile(dumpInfo);
        if (!fileInfo) {
          console.log(`⏭️ Skipping ${dumpInfo.name} - file not found`);
          continue;
        }
        
        // Check if mongorestore is available
        try {
          await new Promise((resolve, reject) => {
            exec('mongorestore --version', (error, stdout, stderr) => {
              if (error) reject(error);
              else resolve(stdout);
            });
          });
        } catch (error) {
          console.log('❌ mongorestore not found. Please install MongoDB tools:');
          console.log('   brew install mongodb/brew/mongodb-database-tools');
          process.exit(1);
        }
        
        await this.processMongoDump(dumpInfo, fileInfo.path);
      }
      
      await this.createIndexes();
      await this.printStats();
      
      console.log('\n🎉 Import process completed successfully!');
      console.log('🚀 Your ECTRACC database now has real product data!');
      
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
  const importer = new OpenFactsImporter();
  importer.run().catch(console.error);
}

module.exports = OpenFactsImporter;
