#!/usr/bin/env node
// Open Food Facts Data Import Script
// Downloads, processes, and imports the full OFF database

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const https = require('https');
const zlib = require('zlib');
const { Transform } = require('stream');
const { connectMongoDB, getMongoDB, getMongoCollection } = require('../config/mongodb');

class OpenFoodFactsImporter {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.downloadUrl = 'https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz';
    this.processedCount = 0;
    this.importedCount = 0;
    this.skippedCount = 0;
    this.batchSize = 1000;
    this.batch = [];
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🚀 Initializing Open Food Facts Importer...');
    
    // Create data directory
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
      console.log(`📁 Created data directory: ${this.dataDir}`);
    }

    // Connect to MongoDB
    await connectMongoDB();
    this.db = getMongoDB();
    this.collection = getMongoCollection('products');
    
    console.log('✅ MongoDB connection established');
    console.log('✅ Importer initialized');
  }

  async downloadData() {
    const filePath = path.join(this.dataDir, 'openfoodfacts-products.jsonl.gz');
    
    console.log('📥 Downloading Open Food Facts database...');
    console.log(`🔗 URL: ${this.downloadUrl}`);
    console.log(`📂 Saving to: ${filePath}`);
    
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filePath);
      
      const downloadFile = (url) => {
        https.get(url, (response) => {
          // Handle redirects
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = response.headers.location;
            console.log(`🔄 Redirecting to: ${redirectUrl}`);
            downloadFile(redirectUrl);
            return;
          }
          
          if (response.statusCode !== 200) {
            reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
            return;
          }

        const totalSize = parseInt(response.headers['content-length'] || '0');
        let downloadedSize = 0;
        let lastProgress = 0;

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          const progress = Math.floor((downloadedSize / totalSize) * 100);
          
          if (progress > lastProgress) {
            process.stdout.write(`\r📊 Progress: ${progress}% (${this.formatBytes(downloadedSize)}/${this.formatBytes(totalSize)})`);
            lastProgress = progress;
          }
        });

        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log('\n✅ Download completed!');
          resolve(filePath);
        });

          file.on('error', (err) => {
            fs.unlink(filePath, () => {}); // Delete partial file
            reject(err);
          });
        }).on('error', reject);
      };
      
      downloadFile(this.downloadUrl);
    });
  }

  async processData(filePath) {
    console.log('\n🔄 Processing Open Food Facts data...');
    console.log('📝 Removing images and optimizing for carbon footprint tracking...');
    
    return new Promise((resolve, reject) => {
      const readStream = fs.createReadStream(filePath)
        .pipe(zlib.createGunzip())
        .pipe(new Transform({
          objectMode: true,
          transform: (chunk, encoding, callback) => {
            // Split by newlines and process each JSON object
            const lines = chunk.toString().split('\n');
            
            for (const line of lines) {
              if (line.trim()) {
                try {
                  const product = JSON.parse(line);
                  const processed = this.processProduct(product);
                  if (processed) {
                    this.batch.push(processed);
                    
                    if (this.batch.length >= this.batchSize) {
                      this.importBatch();
                    }
                  }
                } catch (err) {
                  // Skip invalid JSON lines
                  this.skippedCount++;
                }
              }
            }
            callback();
          }
        }));

      readStream.on('end', async () => {
        // Import remaining batch
        if (this.batch.length > 0) {
          await this.importBatch();
        }
        
        console.log('\n✅ Data processing completed!');
        this.printStats();
        resolve();
      });

      readStream.on('error', reject);
    });
  }

  processProduct(product) {
    this.processedCount++;
    
    // Show progress every 10,000 products
    if (this.processedCount % 10000 === 0) {
      const elapsed = (Date.now() - this.startTime) / 1000;
      const rate = Math.floor(this.processedCount / elapsed);
      process.stdout.write(`\r🔄 Processed: ${this.processedCount.toLocaleString()} products (${rate}/sec)`);
    }

    // Skip products without essential data
    if (!product.code || !product.product_name) {
      this.skippedCount++;
      return null;
    }

    // Create optimized product object (removing images and unnecessary data)
    const optimized = {
      code: product.code,
      product_name: product.product_name,
      brands: this.processArray(product.brands_tags),
      categories: this.processArray(product.categories_tags),
      ecoscore_grade: product.ecoscore_grade || null,
      nutriscore_grade: product.nutriscore_grade || null,
      nutriments: this.processNutriments(product.nutriments),
      ingredients: product.ingredients ? product.ingredients.slice(0, 20) : [], // Limit ingredients
      packaging: product.packaging || null,
      countries: this.processArray(product.countries_tags),
      manufacturing_places: product.manufacturing_places || null,
      last_modified_t: product.last_modified_t || Math.floor(Date.now() / 1000),
      // Remove all image data to save space
      // images: null,
      // image_url: null,
      // image_front_url: null,
      // etc.
    };

    return optimized;
  }

  processArray(data) {
    if (!data || !Array.isArray(data)) return [];
    
    // Clean and limit array data
    return data
      .filter(item => typeof item === 'string' && item.length > 0)
      .map(item => item.replace(/^en:/, '')) // Remove language prefixes
      .slice(0, 10); // Limit to 10 items max
  }

  processNutriments(nutriments) {
    if (!nutriments || typeof nutriments !== 'object') return null;

    // Extract only essential nutrition data
    const essential = {};
    const keys = [
      'energy-kcal_100g',
      'energy-kj_100g', 
      'fat_100g',
      'saturated-fat_100g',
      'carbohydrates_100g',
      'sugars_100g',
      'fiber_100g',
      'proteins_100g',
      'salt_100g',
      'sodium_100g'
    ];

    for (const key of keys) {
      if (nutriments[key] !== undefined && !isNaN(nutriments[key])) {
        essential[key] = parseFloat(nutriments[key]);
      }
    }

    return Object.keys(essential).length > 0 ? essential : null;
  }

  async importBatch() {
    try {
      if (this.batch.length === 0) return;

      // Use upsert to avoid duplicates
      const operations = this.batch.map(product => ({
        updateOne: {
          filter: { code: product.code },
          update: { $set: product },
          upsert: true
        }
      }));

      const result = await this.collection.bulkWrite(operations, { ordered: false });
      this.importedCount += result.upsertedCount + result.modifiedCount;
      
      this.batch = []; // Clear batch
    } catch (error) {
      console.error('\n❌ Batch import error:', error.message);
      // Continue processing even if some batches fail
      this.batch = [];
    }
  }

  printStats() {
    const elapsed = (Date.now() - this.startTime) / 1000;
    const minutes = Math.floor(elapsed / 60);
    const seconds = Math.floor(elapsed % 60);
    
    console.log('\n📊 Import Statistics:');
    console.log(`⏱️  Total time: ${minutes}m ${seconds}s`);
    console.log(`📦 Products processed: ${this.processedCount.toLocaleString()}`);
    console.log(`✅ Products imported: ${this.importedCount.toLocaleString()}`);
    console.log(`⏭️  Products skipped: ${this.skippedCount.toLocaleString()}`);
    console.log(`📈 Processing rate: ${Math.floor(this.processedCount / elapsed)} products/sec`);
    
    const coverage = ((this.importedCount / this.processedCount) * 100).toFixed(1);
    console.log(`🎯 Import coverage: ${coverage}%`);
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async run() {
    try {
      await this.initialize();
      
      const filePath = await this.downloadData();
      await this.processData(filePath);
      
      console.log('\n🎉 Open Food Facts import completed successfully!');
      console.log('🔍 Testing database...');
      
      // Test the imported data
      const totalProducts = await this.collection.countDocuments();
      const withBarcodes = await this.collection.countDocuments({ code: { $exists: true, $ne: '' } });
      const withEcoScore = await this.collection.countDocuments({ ecoscore_grade: { $exists: true, $ne: null } });
      
      console.log(`\n📊 Final Database Stats:`);
      console.log(`📦 Total products: ${totalProducts.toLocaleString()}`);
      console.log(`🔍 With barcodes: ${withBarcodes.toLocaleString()}`);
      console.log(`🌱 With eco scores: ${withEcoScore.toLocaleString()}`);
      
      console.log('\n✅ Your ECTRACC app now has access to the complete Open Food Facts database!');
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    }
  }
}

// Run the importer if called directly
if (require.main === module) {
  const importer = new OpenFoodFactsImporter();
  importer.run().then(() => {
    console.log('🚀 Ready to restart your backend with real product data!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = OpenFoodFactsImporter;
