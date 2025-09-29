#!/usr/bin/env node
// Sample Product Data Seeder
// Creates a curated dataset of popular products for immediate testing

require('dotenv').config();
const { connectMongoDB, getMongoCollection } = require('../config/mongodb');

class SampleDataSeeder {
  constructor() {
    this.collection = null;
  }

  async initialize() {
    console.log('🚀 Initializing Sample Data Seeder...');
    await connectMongoDB();
    this.collection = getMongoCollection('products');
    console.log('✅ Connected to MongoDB');
  }

  getSampleProducts() {
    // Curated list of popular products with real data
    return [
      {
        code: '3017620422003',
        product_name: 'Nutella',
        brands: ['Ferrero'],
        categories: ['spreads', 'chocolate-spreads', 'hazelnut-spreads'],
        ecoscore_grade: 'd',
        nutriscore_grade: 'e',
        nutriments: {
          'energy-kcal_100g': 539,
          'fat_100g': 30.9,
          'saturated-fat_100g': 10.6,
          'carbohydrates_100g': 57.5,
          'sugars_100g': 56.3,
          'proteins_100g': 6.3,
          'salt_100g': 0.107
        },
        packaging: 'glass-jar',
        countries: ['france', 'italy'],
        last_modified_t: Math.floor(Date.now() / 1000)
      },
      {
        code: '7622210951965',
        product_name: 'Oreo Original',
        brands: ['Oreo', 'Mondelez'],
        categories: ['biscuits', 'cookies', 'chocolate-cookies'],
        ecoscore_grade: 'd',
        nutriscore_grade: 'e',
        nutriments: {
          'energy-kcal_100g': 480,
          'fat_100g': 20,
          'saturated-fat_100g': 6,
          'carbohydrates_100g': 71,
          'sugars_100g': 36,
          'proteins_100g': 4.7,
          'salt_100g': 0.87
        },
        packaging: 'plastic-tray',
        countries: ['usa', 'france'],
        last_modified_t: Math.floor(Date.now() / 1000)
      },
      {
        code: '4902430735063',
        product_name: 'Kit Kat 4 Finger',
        brands: ['Kit Kat', 'Nestle'],
        categories: ['chocolate-bars', 'wafer-biscuits'],
        ecoscore_grade: 'd',
        nutriscore_grade: 'e',
        nutriments: {
          'energy-kcal_100g': 518,
          'fat_100g': 26.6,
          'saturated-fat_100g': 15.2,
          'carbohydrates_100g': 59.2,
          'sugars_100g': 47.8,
          'proteins_100g': 7.3,
          'salt_100g': 0.05
        },
        packaging: 'plastic-wrapper',
        countries: ['uk', 'japan'],
        last_modified_t: Math.floor(Date.now() / 1000)
      },
      {
        code: '8901030835289',
        product_name: 'Maggi 2-Minute Noodles',
        brands: ['Maggi', 'Nestle'],
        categories: ['instant-noodles', 'noodles', 'convenience-food'],
        ecoscore_grade: 'c',
        nutriscore_grade: 'd',
        nutriments: {
          'energy-kcal_100g': 420,
          'fat_100g': 15,
          'saturated-fat_100g': 7.5,
          'carbohydrates_100g': 62,
          'sugars_100g': 4.2,
          'proteins_100g': 10,
          'salt_100g': 3.2
        },
        packaging: 'plastic-packet',
        countries: ['india'],
        last_modified_t: Math.floor(Date.now() / 1000)
      },
      {
        code: '0123456789012',
        product_name: 'Organic Bananas',
        brands: ['Fresh Organic'],
        categories: ['fruits', 'fresh-fruits', 'bananas', 'organic'],
        ecoscore_grade: 'a',
        nutriscore_grade: 'a',
        nutriments: {
          'energy-kcal_100g': 89,
          'fat_100g': 0.3,
          'saturated-fat_100g': 0.1,
          'carbohydrates_100g': 23,
          'sugars_100g': 12,
          'proteins_100g': 1.1,
          'salt_100g': 0.001
        },
        packaging: 'none',
        countries: ['ecuador', 'costa-rica'],
        last_modified_t: Math.floor(Date.now() / 1000)
      },
      {
        code: '0987654321098',
        product_name: 'Whole Wheat Bread',
        brands: ['Artisan Bakery'],
        categories: ['breads', 'whole-wheat-breads', 'sliced-breads'],
        ecoscore_grade: 'b',
        nutriscore_grade: 'a',
        nutriments: {
          'energy-kcal_100g': 247,
          'fat_100g': 3.4,
          'saturated-fat_100g': 0.6,
          'carbohydrates_100g': 41,
          'sugars_100g': 6,
          'proteins_100g': 13,
          'salt_100g': 1.2
        },
        packaging: 'plastic-bag',
        countries: ['usa', 'canada'],
        last_modified_t: Math.floor(Date.now() / 1000)
      },
      {
        code: '1122334455667',
        product_name: 'Greek Yogurt Plain',
        brands: ['Dairy Fresh'],
        categories: ['yogurts', 'plain-yogurts', 'greek-yogurts'],
        ecoscore_grade: 'b',
        nutriscore_grade: 'a',
        nutriments: {
          'energy-kcal_100g': 97,
          'fat_100g': 0.4,
          'saturated-fat_100g': 0.3,
          'carbohydrates_100g': 3.6,
          'sugars_100g': 3.6,
          'proteins_100g': 18,
          'salt_100g': 0.13
        },
        packaging: 'plastic-cup',
        countries: ['greece', 'usa'],
        last_modified_t: Math.floor(Date.now() / 1000)
      },
      {
        code: '2233445566778',
        product_name: 'Extra Virgin Olive Oil',
        brands: ['Mediterranean Gold'],
        categories: ['olive-oils', 'vegetable-oils', 'extra-virgin-olive-oils'],
        ecoscore_grade: 'a',
        nutriscore_grade: 'c',
        nutriments: {
          'energy-kcal_100g': 884,
          'fat_100g': 100,
          'saturated-fat_100g': 14,
          'carbohydrates_100g': 0,
          'sugars_100g': 0,
          'proteins_100g': 0,
          'salt_100g': 0.002
        },
        packaging: 'glass-bottle',
        countries: ['spain', 'italy'],
        last_modified_t: Math.floor(Date.now() / 1000)
      },
      {
        code: '3344556677889',
        product_name: 'Coca-Cola Classic',
        brands: ['Coca-Cola'],
        categories: ['sodas', 'cola-sodas', 'carbonated-drinks'],
        ecoscore_grade: 'e',
        nutriscore_grade: 'e',
        nutriments: {
          'energy-kcal_100g': 42,
          'fat_100g': 0,
          'saturated-fat_100g': 0,
          'carbohydrates_100g': 10.6,
          'sugars_100g': 10.6,
          'proteins_100g': 0,
          'salt_100g': 0.01
        },
        packaging: 'aluminum-can',
        countries: ['usa', 'worldwide'],
        last_modified_t: Math.floor(Date.now() / 1000)
      },
      {
        code: '4455667788990',
        product_name: 'Organic Quinoa',
        brands: ['Nature Valley'],
        categories: ['cereals', 'quinoa', 'organic', 'gluten-free'],
        ecoscore_grade: 'a',
        nutriscore_grade: 'a',
        nutriments: {
          'energy-kcal_100g': 368,
          'fat_100g': 6,
          'saturated-fat_100g': 0.7,
          'carbohydrates_100g': 57,
          'sugars_100g': 0,
          'proteins_100g': 14,
          'salt_100g': 0.005
        },
        packaging: 'cardboard-box',
        countries: ['bolivia', 'peru'],
        last_modified_t: Math.floor(Date.now() / 1000)
      }
    ];
  }

  async seedData() {
    console.log('🌱 Seeding sample product data...');
    
    const products = this.getSampleProducts();
    console.log(`📦 Preparing ${products.length} sample products...`);

    try {
      // Clear existing products (optional - comment out to keep existing data)
      // await this.collection.deleteMany({});
      // console.log('🗑️ Cleared existing products');

      // Insert sample products with upsert to avoid duplicates
      const operations = products.map(product => ({
        updateOne: {
          filter: { code: product.code },
          update: { $set: product },
          upsert: true
        }
      }));

      const result = await this.collection.bulkWrite(operations);
      
      console.log('✅ Sample data seeding completed!');
      console.log(`📊 Results:`);
      console.log(`   • Inserted: ${result.upsertedCount}`);
      console.log(`   • Updated: ${result.modifiedCount}`);
      console.log(`   • Total: ${result.upsertedCount + result.modifiedCount}`);

      // Test the data
      const totalProducts = await this.collection.countDocuments();
      const withBarcodes = await this.collection.countDocuments({ code: { $exists: true, $ne: '' } });
      const withEcoScore = await this.collection.countDocuments({ ecoscore_grade: { $exists: true, $ne: null } });

      console.log(`\n📊 Database Stats:`);
      console.log(`   • Total products: ${totalProducts}`);
      console.log(`   • With barcodes: ${withBarcodes}`);
      console.log(`   • With eco scores: ${withEcoScore}`);

      console.log('\n🎉 Sample products ready for testing!');
      console.log('🔍 Try scanning these barcodes:');
      console.log('   • 3017620422003 (Nutella)');
      console.log('   • 7622210951965 (Oreo)');
      console.log('   • 4902430735063 (Kit Kat)');
      console.log('   • 8901030835289 (Maggi Noodles)');

    } catch (error) {
      console.error('❌ Seeding failed:', error);
      throw error;
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.seedData();
      console.log('\n✅ Sample data seeding completed successfully!');
      console.log('🚀 Your ECTRACC app is ready for testing with real product data!');
    } catch (error) {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    }
  }
}

// Run the seeder if called directly
if (require.main === module) {
  const seeder = new SampleDataSeeder();
  seeder.run().then(() => {
    console.log('🎯 Ready to test your barcode scanner and product search!');
    process.exit(0);
  }).catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
  });
}

module.exports = SampleDataSeeder;
