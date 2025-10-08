// Script to populate base components with initial data
const { connectMongoDB } = require('../config/database');
const BaseComponent = require('../models/BaseComponent');

const initialBaseComponents = [
  // Meat & Poultry
  { 
    name: "Beef (average)", 
    category: "Meat & Poultry", 
    carbon_footprint: 27.0, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Average carbon footprint across different beef production methods"
  },
  { 
    name: "Chicken (average)", 
    category: "Meat & Poultry", 
    carbon_footprint: 6.9, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Average carbon footprint for chicken meat production"
  },
  { 
    name: "Pork (average)", 
    category: "Meat & Poultry", 
    carbon_footprint: 12.1, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Average carbon footprint for pork production"
  },
  { 
    name: "Lamb (average)", 
    category: "Meat & Poultry", 
    carbon_footprint: 39.2, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Average carbon footprint for lamb production"
  },
  { 
    name: "Turkey (average)", 
    category: "Meat & Poultry", 
    carbon_footprint: 10.9, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Average carbon footprint for turkey production"
  },

  // Dairy
  { 
    name: "Milk (whole)", 
    category: "Dairy", 
    carbon_footprint: 3.2, 
    unit: "per liter", 
    source: "Multiple studies average",
    description: "Whole milk carbon footprint including production and processing"
  },
  { 
    name: "Cheese (hard)", 
    category: "Dairy", 
    carbon_footprint: 13.5, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Hard cheese varieties like cheddar, gouda"
  },
  { 
    name: "Butter", 
    category: "Dairy", 
    carbon_footprint: 23.8, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Dairy butter production footprint"
  },
  { 
    name: "Yogurt", 
    category: "Dairy", 
    carbon_footprint: 2.2, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Plain yogurt production footprint"
  },
  { 
    name: "Cream", 
    category: "Dairy", 
    carbon_footprint: 7.6, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Heavy cream production footprint"
  },

  // Grains & Cereals
  { 
    name: "Rice (white)", 
    category: "Grains & Cereals", 
    carbon_footprint: 2.7, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "White rice production including methane emissions from paddies"
  },
  { 
    name: "Wheat flour", 
    category: "Grains & Cereals", 
    carbon_footprint: 1.4, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Wheat flour production and processing"
  },
  { 
    name: "Oats", 
    category: "Grains & Cereals", 
    carbon_footprint: 2.5, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Oat grain production footprint"
  },
  { 
    name: "Bread (white)", 
    category: "Grains & Cereals", 
    carbon_footprint: 1.6, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "White bread including baking and packaging"
  },
  { 
    name: "Pasta", 
    category: "Grains & Cereals", 
    carbon_footprint: 1.4, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Dried pasta production footprint"
  },
  { 
    name: "Quinoa", 
    category: "Grains & Cereals", 
    carbon_footprint: 5.2, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Quinoa grain production including transport"
  },

  // Fruits & Vegetables
  { 
    name: "Apples", 
    category: "Fruits & Vegetables", 
    carbon_footprint: 0.4, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Apple production including orchard management"
  },
  { 
    name: "Bananas", 
    category: "Fruits & Vegetables", 
    carbon_footprint: 0.7, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Banana production including transport from tropical regions"
  },
  { 
    name: "Tomatoes", 
    category: "Fruits & Vegetables", 
    carbon_footprint: 2.1, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Tomato production (field grown average)"
  },
  { 
    name: "Potatoes", 
    category: "Fruits & Vegetables", 
    carbon_footprint: 0.5, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Potato production including storage"
  },
  { 
    name: "Carrots", 
    category: "Fruits & Vegetables", 
    carbon_footprint: 0.4, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Carrot production and processing"
  },
  { 
    name: "Onions", 
    category: "Fruits & Vegetables", 
    carbon_footprint: 0.5, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Onion production including storage"
  },
  { 
    name: "Lettuce", 
    category: "Fruits & Vegetables", 
    carbon_footprint: 0.3, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Lettuce production (field grown)"
  },
  { 
    name: "Avocados", 
    category: "Fruits & Vegetables", 
    carbon_footprint: 2.8, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Avocado production including high water usage"
  },

  // Legumes & Nuts
  { 
    name: "Lentils", 
    category: "Legumes & Nuts", 
    carbon_footprint: 0.9, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Lentil production with nitrogen fixation benefits"
  },
  { 
    name: "Chickpeas", 
    category: "Legumes & Nuts", 
    carbon_footprint: 1.0, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Chickpea production including processing"
  },
  { 
    name: "Black beans", 
    category: "Legumes & Nuts", 
    carbon_footprint: 1.2, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Black bean production and processing"
  },
  { 
    name: "Almonds", 
    category: "Legumes & Nuts", 
    carbon_footprint: 8.8, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Almond production including high water usage"
  },
  { 
    name: "Peanuts", 
    category: "Legumes & Nuts", 
    carbon_footprint: 2.5, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Peanut production including processing"
  },

  // Seafood
  { 
    name: "Salmon (farmed)", 
    category: "Seafood", 
    carbon_footprint: 6.0, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Farmed salmon including feed production"
  },
  { 
    name: "Tuna (canned)", 
    category: "Seafood", 
    carbon_footprint: 6.1, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Canned tuna including fishing and processing"
  },
  { 
    name: "Shrimp (farmed)", 
    category: "Seafood", 
    carbon_footprint: 18.0, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Farmed shrimp with high environmental impact"
  },
  { 
    name: "Cod", 
    category: "Seafood", 
    carbon_footprint: 2.9, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Wild-caught cod including fishing operations"
  },

  // Oils & Fats
  { 
    name: "Olive oil", 
    category: "Oils & Fats", 
    carbon_footprint: 5.4, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Extra virgin olive oil production"
  },
  { 
    name: "Sunflower oil", 
    category: "Oils & Fats", 
    carbon_footprint: 3.5, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Sunflower oil production and processing"
  },
  { 
    name: "Coconut oil", 
    category: "Oils & Fats", 
    carbon_footprint: 2.7, 
    unit: "per kg", 
    source: "Multiple studies average",
    description: "Coconut oil production including transport"
  }
];

async function populateBaseComponents() {
  try {
    console.log('🌱 Starting base components population...');
    
    // Connect to MongoDB
    await connectMongoDB();
    console.log('✅ Connected to MongoDB');
    
    // Check if base components already exist
    const existingComponents = await BaseComponent.getAll();
    if (existingComponents.length > 0) {
      console.log(`⚠️  Base components already exist (${existingComponents.length} found)`);
      console.log('Skipping population to avoid duplicates');
      return;
    }
    
    // Bulk insert all components
    const insertedCount = await BaseComponent.bulkInsert(initialBaseComponents);
    
    console.log(`✅ Successfully inserted ${insertedCount} base components`);
    
    // Get statistics
    const stats = await BaseComponent.getStats();
    console.log('\n📊 Base Components Statistics:');
    console.log(`   Total components: ${stats.totalComponents}`);
    console.log(`   Total categories: ${stats.totalCategories}`);
    console.log('\n📋 By Category:');
    stats.categoryBreakdown.forEach(cat => {
      console.log(`   • ${cat.category}: ${cat.count} items (avg: ${cat.avgFootprint} kg CO₂e)`);
    });
    
  } catch (error) {
    console.error('❌ Error populating base components:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  populateBaseComponents()
    .then(() => {
      console.log('\n🎉 Base components population completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Population failed:', error);
      process.exit(1);
    });
}

module.exports = { populateBaseComponents, initialBaseComponents };
