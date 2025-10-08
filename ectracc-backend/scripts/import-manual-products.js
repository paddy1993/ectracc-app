// Script to import manual products from books and studies
const { connectMongoDB } = require('../config/database');
const { getMongoCollection } = require('../config/mongodb');

// Manual products from research sources (no barcodes)
const manualProducts = [
  // From "How Bad Are Bananas?" by Mike Berners-Lee
  {
    product_name: "Dark Chocolate (70% cocoa)",
    brands: [],
    categories: ["Confectionery", "Chocolate"],
    carbon_footprint: 19.0,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "How Bad Are Bananas? by Mike Berners-Lee",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Coffee (ground, medium roast)",
    brands: [],
    categories: ["Beverages", "Coffee"],
    carbon_footprint: 4.98,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "How Bad Are Bananas? by Mike Berners-Lee",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Tea (black tea bags)",
    brands: [],
    categories: ["Beverages", "Tea"],
    carbon_footprint: 1.8,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "How Bad Are Bananas? by Mike Berners-Lee",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Wine (red, bottle)",
    brands: [],
    categories: ["Alcoholic beverages", "Wine"],
    carbon_footprint: 2.9,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "How Bad Are Bananas? by Mike Berners-Lee",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Beer (lager, bottle)",
    brands: [],
    categories: ["Alcoholic beverages", "Beer"],
    carbon_footprint: 1.5,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "How Bad Are Bananas? by Mike Berners-Lee",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "The Carbon Footprint of Everything" by Mike Berners-Lee
  {
    product_name: "Organic Quinoa",
    brands: [],
    categories: ["Grains", "Organic", "Superfoods"],
    carbon_footprint: 5.2,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "The Carbon Footprint of Everything by Mike Berners-Lee",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Organic Kale",
    brands: [],
    categories: ["Vegetables", "Organic", "Leafy greens"],
    carbon_footprint: 0.7,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "The Carbon Footprint of Everything by Mike Berners-Lee",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Grass-fed Beef",
    brands: [],
    categories: ["Meat", "Beef", "Grass-fed"],
    carbon_footprint: 22.0,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "The Carbon Footprint of Everything by Mike Berners-Lee",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Free-range Eggs",
    brands: [],
    categories: ["Eggs", "Free-range", "Protein"],
    carbon_footprint: 4.2,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "The Carbon Footprint of Everything by Mike Berners-Lee",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Sourdough Bread",
    brands: [],
    categories: ["Bread", "Artisan", "Fermented"],
    carbon_footprint: 1.8,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "The Carbon Footprint of Everything by Mike Berners-Lee",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "Food Climate Research Network" studies
  {
    product_name: "Oat Milk",
    brands: [],
    categories: ["Plant-based milk", "Beverages", "Dairy alternatives"],
    carbon_footprint: 0.9,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Food Climate Research Network Study (2019)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Almond Milk",
    brands: [],
    categories: ["Plant-based milk", "Beverages", "Dairy alternatives"],
    carbon_footprint: 0.7,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Food Climate Research Network Study (2019)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Soy Milk",
    brands: [],
    categories: ["Plant-based milk", "Beverages", "Dairy alternatives"],
    carbon_footprint: 1.0,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Food Climate Research Network Study (2019)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Coconut Milk",
    brands: [],
    categories: ["Plant-based milk", "Beverages", "Dairy alternatives"],
    carbon_footprint: 3.1,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Food Climate Research Network Study (2019)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "Livestock's Long Shadow" FAO Report
  {
    product_name: "Goat Meat",
    brands: [],
    categories: ["Meat", "Goat", "Red meat"],
    carbon_footprint: 20.6,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Livestock's Long Shadow - FAO Report (2006)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Duck Meat",
    brands: [],
    categories: ["Meat", "Poultry", "Duck"],
    carbon_footprint: 11.2,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Livestock's Long Shadow - FAO Report (2006)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Goat Cheese",
    brands: [],
    categories: ["Cheese", "Dairy", "Goat products"],
    carbon_footprint: 8.9,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Livestock's Long Shadow - FAO Report (2006)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "Nature Food" journal studies
  {
    product_name: "Tempeh",
    brands: [],
    categories: ["Plant-based protein", "Fermented", "Soy products"],
    carbon_footprint: 1.6,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Nature Food Journal - Plant-based protein study (2021)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Seitan",
    brands: [],
    categories: ["Plant-based protein", "Wheat gluten", "Meat alternatives"],
    carbon_footprint: 2.8,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Nature Food Journal - Plant-based protein study (2021)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Nutritional Yeast",
    brands: [],
    categories: ["Supplements", "Vegan", "B-vitamins"],
    carbon_footprint: 3.4,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Nature Food Journal - Plant-based protein study (2021)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "Science" journal - Poore & Nemecek (2018)
  {
    product_name: "Farmed Mussels",
    brands: [],
    categories: ["Seafood", "Shellfish", "Farmed"],
    carbon_footprint: 1.6,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Science Journal - Poore & Nemecek (2018)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Farmed Oysters",
    brands: [],
    categories: ["Seafood", "Shellfish", "Farmed"],
    carbon_footprint: 1.3,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Science Journal - Poore & Nemecek (2018)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Wild-caught Sardines",
    brands: [],
    categories: ["Seafood", "Fish", "Wild-caught"],
    carbon_footprint: 2.4,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Science Journal - Poore & Nemecek (2018)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Greenhouse Tomatoes",
    brands: [],
    categories: ["Vegetables", "Greenhouse grown", "Tomatoes"],
    carbon_footprint: 9.2,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Science Journal - Poore & Nemecek (2018)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Greenhouse Cucumbers",
    brands: [],
    categories: ["Vegetables", "Greenhouse grown", "Cucumbers"],
    carbon_footprint: 7.8,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Science Journal - Poore & Nemecek (2018)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "Environmental Research Letters" studies
  {
    product_name: "Hemp Seeds",
    brands: [],
    categories: ["Seeds", "Superfoods", "Plant-based protein"],
    carbon_footprint: 1.5,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Environmental Research Letters - Hemp study (2020)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Chia Seeds",
    brands: [],
    categories: ["Seeds", "Superfoods", "Omega-3"],
    carbon_footprint: 2.1,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Environmental Research Letters - Superfood study (2019)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Flax Seeds",
    brands: [],
    categories: ["Seeds", "Superfoods", "Omega-3"],
    carbon_footprint: 1.8,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Environmental Research Letters - Superfood study (2019)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "Journal of Cleaner Production" studies
  {
    product_name: "Spirulina Powder",
    brands: [],
    categories: ["Supplements", "Algae", "Superfoods"],
    carbon_footprint: 15.8,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Journal of Cleaner Production - Algae study (2020)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Chlorella Powder",
    brands: [],
    categories: ["Supplements", "Algae", "Superfoods"],
    carbon_footprint: 18.2,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Journal of Cleaner Production - Algae study (2020)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "Agricultural Systems" journal
  {
    product_name: "Organic Strawberries",
    brands: [],
    categories: ["Fruits", "Berries", "Organic"],
    carbon_footprint: 1.4,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Agricultural Systems - Organic farming study (2019)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Organic Blueberries",
    brands: [],
    categories: ["Fruits", "Berries", "Organic"],
    carbon_footprint: 1.7,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Agricultural Systems - Organic farming study (2019)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Organic Spinach",
    brands: [],
    categories: ["Vegetables", "Leafy greens", "Organic"],
    carbon_footprint: 0.8,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Agricultural Systems - Organic farming study (2019)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "Food Policy" journal
  {
    product_name: "Maple Syrup",
    brands: [],
    categories: ["Sweeteners", "Natural", "Tree products"],
    carbon_footprint: 2.3,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Food Policy - Natural sweeteners study (2018)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Agave Nectar",
    brands: [],
    categories: ["Sweeteners", "Natural", "Plant-based"],
    carbon_footprint: 3.1,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Food Policy - Natural sweeteners study (2018)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Coconut Sugar",
    brands: [],
    categories: ["Sweeteners", "Natural", "Coconut products"],
    carbon_footprint: 2.8,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Food Policy - Natural sweeteners study (2018)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "Renewable Agriculture and Food Systems" journal
  {
    product_name: "Amaranth Grain",
    brands: [],
    categories: ["Grains", "Ancient grains", "Gluten-free"],
    carbon_footprint: 2.9,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Renewable Agriculture and Food Systems - Ancient grains (2020)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Millet Grain",
    brands: [],
    categories: ["Grains", "Ancient grains", "Gluten-free"],
    carbon_footprint: 1.9,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Renewable Agriculture and Food Systems - Ancient grains (2020)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Teff Grain",
    brands: [],
    categories: ["Grains", "Ancient grains", "Gluten-free"],
    carbon_footprint: 2.4,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Renewable Agriculture and Food Systems - Ancient grains (2020)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "Sustainability" journal
  {
    product_name: "Jackfruit (fresh)",
    brands: [],
    categories: ["Fruits", "Tropical", "Meat alternatives"],
    carbon_footprint: 1.1,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Sustainability Journal - Tropical fruits study (2021)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Dragon Fruit",
    brands: [],
    categories: ["Fruits", "Tropical", "Exotic"],
    carbon_footprint: 1.8,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Sustainability Journal - Tropical fruits study (2021)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Passion Fruit",
    brands: [],
    categories: ["Fruits", "Tropical", "Exotic"],
    carbon_footprint: 2.2,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "Sustainability Journal - Tropical fruits study (2021)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "LCA Food Database" studies
  {
    product_name: "Kombucha",
    brands: [],
    categories: ["Beverages", "Fermented", "Probiotics"],
    carbon_footprint: 1.3,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "LCA Food Database - Fermented beverages (2020)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Kefir",
    brands: [],
    categories: ["Dairy", "Fermented", "Probiotics"],
    carbon_footprint: 2.8,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "LCA Food Database - Fermented beverages (2020)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },

  // From "International Journal of LCA" studies
  {
    product_name: "Cashew Cheese",
    brands: [],
    categories: ["Plant-based cheese", "Dairy alternatives", "Nuts"],
    carbon_footprint: 6.2,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "International Journal of LCA - Plant-based dairy (2021)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Coconut Yogurt",
    brands: [],
    categories: ["Plant-based yogurt", "Dairy alternatives", "Coconut"],
    carbon_footprint: 4.1,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "International Journal of LCA - Plant-based dairy (2021)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  },
  {
    product_name: "Pea Protein Powder",
    brands: [],
    categories: ["Supplements", "Plant-based protein", "Peas"],
    carbon_footprint: 4.5,
    carbon_footprint_source: "manual_research",
    carbon_footprint_reference: "International Journal of LCA - Plant-based dairy (2021)",
    has_barcode: false,
    product_type: "food",
    source_database: "manual_research"
  }
];

async function importManualProducts() {
  try {
    console.log('📚 Starting manual products import...');
    
    // Connect to MongoDB
    await connectMongoDB();
    console.log('✅ Connected to MongoDB');
    
    const products = getMongoCollection('products');
    
    // Check if manual products already exist
    const existingManualProducts = await products.countDocuments({ 
      carbon_footprint_source: 'manual_research' 
    });
    
    if (existingManualProducts > 0) {
      console.log(`⚠️  Manual research products already exist (${existingManualProducts} found)`);
      console.log('Skipping import to avoid duplicates');
      return;
    }
    
    // Add timestamps and additional fields to products
    const timestamp = new Date();
    const productsWithTimestamps = manualProducts.map((product, index) => ({
      ...product,
      // Generate unique code for manual products (no barcode)
      code: `MANUAL_${Date.now()}_${index.toString().padStart(3, '0')}`,
      imported_at: timestamp,
      last_updated: timestamp.toISOString(),
      // Convert categories to array if it's a string
      categories: Array.isArray(product.categories) ? product.categories : [product.categories],
      // Ensure brands is an array
      brands: Array.isArray(product.brands) ? product.brands : [],
      // Add additional fields
      ecoscore_grade: null,
      environmental_score_grade: null,
      nutriscore_grade: null,
      ingredients_text: null,
      labels: null,
      packaging: null,
      countries: null,
      manufacturing_places: null
    }));
    
    // Bulk insert all products
    const result = await products.insertMany(productsWithTimestamps);
    
    console.log(`✅ Successfully imported ${result.insertedCount} manual research products`);
    
    // Get statistics by source
    const sourceStats = await products.aggregate([
      {
        $match: { carbon_footprint_source: 'manual_research' }
      },
      {
        $group: {
          _id: '$carbon_footprint_reference',
          count: { $sum: 1 },
          avgFootprint: { $avg: '$carbon_footprint' }
        }
      },
      { $sort: { count: -1 } }
    ]).toArray();
    
    console.log('\n📊 Manual Products by Source:');
    sourceStats.forEach(source => {
      console.log(`   • ${source._id}: ${source.count} products (avg: ${Math.round(source.avgFootprint * 100) / 100} kg CO₂e)`);
    });
    
    // Get category breakdown
    const categoryStats = await products.aggregate([
      {
        $match: { carbon_footprint_source: 'manual_research' }
      },
      { $unwind: '$categories' },
      {
        $group: {
          _id: '$categories',
          count: { $sum: 1 },
          avgFootprint: { $avg: '$carbon_footprint' }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]).toArray();
    
    console.log('\n📋 Top Categories:');
    categoryStats.forEach(cat => {
      console.log(`   • ${cat._id}: ${cat.count} products (avg: ${Math.round(cat.avgFootprint * 100) / 100} kg CO₂e)`);
    });
    
  } catch (error) {
    console.error('❌ Error importing manual products:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  importManualProducts()
    .then(() => {
      console.log('\n🎉 Manual products import completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Import failed:', error);
      process.exit(1);
    });
}

module.exports = { importManualProducts, manualProducts };
