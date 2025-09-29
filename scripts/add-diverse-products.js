#!/usr/bin/env node

/**
 * Add Diverse Products to ECTRACC Database
 * Adds a curated set of diverse products from different categories
 * to expand the database beyond the initial 10 sample products
 */

const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://patrickahern93_db_user:MxRIg6Jop0nK6qay@cluster0.wxqzvqa.mongodb.net/ectracc?retryWrites=true&w=majority&appName=Cluster0';

// Diverse product categories to add
const DIVERSE_PRODUCTS = [
  // Beauty & Personal Care
  {
    code: 'beauty_shampoo_001',
    barcode: '3574661234567',
    product_name: 'Organic Argan Oil Shampoo',
    brands: ['Natural Beauty', 'EcoHair'],
    categories: ['en:cosmetics', 'en:hair-care', 'en:shampoos'],
    ingredients_text: 'Aqua, Sodium Laureth Sulfate, Argan Oil, Glycerin, Natural Extracts',
    countries: 'France',
    labels: 'Organic, Sulfate-free, Cruelty-free',
    packaging: 'Recyclable plastic bottle',
    quantity: '250ml',
    source: 'beauty_products',
    carbon_footprint: 1.2,
    ecoscore_grade: 'b',
    imported_at: new Date().toISOString()
  },
  {
    code: 'beauty_moisturizer_001', 
    barcode: '3574661234568',
    product_name: 'Vitamin C Face Moisturizer',
    brands: ['GlowSkin'],
    categories: ['en:cosmetics', 'en:face-care', 'en:moisturizers'],
    ingredients_text: 'Aqua, Glycerin, Vitamin C, Hyaluronic Acid, Natural Oils',
    countries: 'Germany',
    labels: 'Dermatologist tested, Anti-aging',
    packaging: 'Glass jar',
    quantity: '50ml',
    source: 'beauty_products',
    carbon_footprint: 0.9,
    ecoscore_grade: 'a',
    imported_at: new Date().toISOString()
  },

  // Pet Food
  {
    code: 'pet_dog_food_001',
    barcode: '1234567890123',
    product_name: 'Premium Chicken & Rice Dog Food',
    brands: ['PetNutrition Pro'],
    categories: ['en:pet-food', 'en:dog-food', 'en:dry-dog-food'],
    ingredients_text: 'Chicken meal, brown rice, sweet potato, peas, chicken fat',
    countries: 'United States',
    labels: 'Natural, Grain-free available',
    packaging: 'Recyclable bag',
    quantity: '15kg',
    source: 'pet_products',
    carbon_footprint: 2.8,
    ecoscore_grade: 'c',
    nutriments: {
      'proteins_100g': 26,
      'fat_100g': 16,
      'fiber_100g': 4,
      'energy-kcal_100g': 380
    },
    imported_at: new Date().toISOString()
  },
  {
    code: 'pet_cat_food_001',
    barcode: '1234567890124', 
    product_name: 'Salmon & Tuna Wet Cat Food',
    brands: ['FelineDeluxe'],
    categories: ['en:pet-food', 'en:cat-food', 'en:wet-cat-food'],
    ingredients_text: 'Salmon, tuna, chicken broth, carrots, peas, vitamins',
    countries: 'Canada',
    labels: 'High protein, Grain-free',
    packaging: 'Aluminum can',
    quantity: '400g',
    source: 'pet_products', 
    carbon_footprint: 1.9,
    ecoscore_grade: 'b',
    nutriments: {
      'proteins_100g': 12,
      'fat_100g': 5,
      'fiber_100g': 1,
      'energy-kcal_100g': 85
    },
    imported_at: new Date().toISOString()
  },

  // Household Products
  {
    code: 'household_detergent_001',
    barcode: '9876543210987',
    product_name: 'Eco-Friendly Laundry Detergent',
    brands: ['GreenClean'],
    categories: ['en:household', 'en:laundry', 'en:detergents'],
    ingredients_text: 'Plant-based surfactants, enzymes, essential oils, biodegradable formula',
    countries: 'Netherlands',
    labels: 'Biodegradable, Phosphate-free, Concentrated',
    packaging: 'Recycled plastic bottle',
    quantity: '1L',
    source: 'household_products',
    carbon_footprint: 1.1,
    ecoscore_grade: 'a',
    imported_at: new Date().toISOString()
  },
  {
    code: 'household_cleaner_001',
    barcode: '9876543210988',
    product_name: 'Multi-Surface Cleaner Spray',
    brands: ['CleanHome'],
    categories: ['en:household', 'en:cleaning', 'en:surface-cleaners'],
    ingredients_text: 'Water, vinegar, plant extracts, essential oils',
    countries: 'United Kingdom',
    labels: 'Non-toxic, Child-safe, Natural',
    packaging: 'Recyclable spray bottle',
    quantity: '500ml',
    source: 'household_products',
    carbon_footprint: 0.7,
    ecoscore_grade: 'a',
    imported_at: new Date().toISOString()
  },

  // Additional Food Products
  {
    code: 'food_organic_pasta_001',
    barcode: '8901234567890',
    product_name: 'Organic Whole Wheat Pasta',
    brands: ['BioHarvest'],
    categories: ['en:plant-based-foods', 'en:cereals-and-potatoes', 'en:pasta'],
    ingredients_text: 'Organic whole wheat flour, water',
    countries: 'Italy',
    labels: 'Organic, Whole grain, Vegan',
    packaging: 'Cardboard box',
    quantity: '500g',
    source: 'food_products',
    carbon_footprint: 0.6,
    ecoscore_grade: 'a',
    nutriscore_grade: 'a',
    nova_group: 1,
    nutriments: {
      'energy-kcal_100g': 350,
      'proteins_100g': 13,
      'carbohydrates_100g': 72,
      'fat_100g': 2.5,
      'fiber_100g': 6
    },
    imported_at: new Date().toISOString()
  },
  {
    code: 'food_plant_milk_001',
    barcode: '8901234567891',
    product_name: 'Oat Milk Unsweetened',
    brands: ['PlantGood'],
    categories: ['en:plant-based-foods-and-beverages', 'en:plant-based-beverages', 'en:oat-beverages'],
    ingredients_text: 'Water, oats (10%), rapeseed oil, sea salt',
    countries: 'Sweden',
    labels: 'Vegan, Lactose-free, Gluten-free',
    packaging: 'Tetra pak carton',
    quantity: '1L',
    source: 'food_products',
    carbon_footprint: 0.4,
    ecoscore_grade: 'a',
    nutriscore_grade: 'b',
    nova_group: 2,
    nutriments: {
      'energy-kcal_100g': 45,
      'proteins_100g': 1,
      'carbohydrates_100g': 6.5,
      'fat_100g': 1.5,
      'fiber_100g': 0.8
    },
    imported_at: new Date().toISOString()
  },

  // Tech/Electronics (simulated products)
  {
    code: 'tech_phone_case_001',
    barcode: '5432167890123',
    product_name: 'Biodegradable Phone Case',
    brands: ['EcoTech'],
    categories: ['en:electronics-accessories', 'en:phone-accessories'],
    ingredients_text: 'Plant-based bioplastic, natural fibers',
    countries: 'Denmark',
    labels: 'Biodegradable, Compostable, Plastic-free',
    packaging: 'Minimal cardboard packaging',
    quantity: '1 unit',
    source: 'tech_products',
    carbon_footprint: 0.3,
    ecoscore_grade: 'a',
    imported_at: new Date().toISOString()
  }
];

class DiverseProductsImporter {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async initialize() {
    console.log('🚀 Adding Diverse Products to ECTRACC Database...');
    
    this.client = new MongoClient(MONGODB_URI);
    await this.client.connect();
    this.db = this.client.db('ectracc');
    console.log('✅ Connected to MongoDB Atlas');
  }

  async addProducts() {
    const collection = this.db.collection('products');
    let imported = 0;
    let updated = 0;

    console.log(`📦 Adding ${DIVERSE_PRODUCTS.length} diverse products...`);

    for (const product of DIVERSE_PRODUCTS) {
      try {
        const result = await collection.updateOne(
          { code: product.code },
          { 
            $set: {
              ...product,
              _id: product.code
            }
          },
          { upsert: true }
        );

        if (result.upsertedCount > 0) {
          imported++;
          console.log(`✅ Added: ${product.product_name} (${product.source})`);
        } else {
          updated++;
          console.log(`🔄 Updated: ${product.product_name} (${product.source})`);
        }

      } catch (error) {
        console.error(`❌ Error adding ${product.product_name}:`, error.message);
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   • New products imported: ${imported}`);
    console.log(`   • Existing products updated: ${updated}`);
    console.log(`   • Total processed: ${imported + updated}`);
  }

  async printStats() {
    const collection = this.db.collection('products');
    const totalCount = await collection.countDocuments();
    
    console.log(`\n📈 Database Status:`);
    console.log(`   • Total Products: ${totalCount.toLocaleString()}`);
    
    // Show breakdown by source
    const sources = await collection.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📋 By Source:');
    sources.forEach(source => {
      console.log(`   • ${source._id || 'sample'}: ${source.count.toLocaleString()}`);
    });

    // Show breakdown by eco-score
    const ecoScores = await collection.aggregate([
      { $group: { _id: '$ecoscore_grade', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]).toArray();
    
    console.log('\n🌱 By Eco-Score:');
    ecoScores.forEach(score => {
      const grade = score._id || 'unknown';
      console.log(`   • Grade ${grade.toUpperCase()}: ${score.count.toLocaleString()}`);
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
      await this.addProducts();
      await this.printStats();
      
      console.log('\n🎉 Diverse products added successfully!');
      console.log('🚀 Your ECTRACC database now has products from multiple categories!');
      
    } catch (error) {
      console.error('❌ Import failed:', error);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

if (require.main === module) {
  const importer = new DiverseProductsImporter();
  importer.run().catch(console.error);
}

module.exports = DiverseProductsImporter;
