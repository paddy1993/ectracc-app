#!/usr/bin/env node
// MongoDB Index Creation Script
// Run: node scripts/add-indexes.js

require('dotenv').config();
const { MongoClient } = require('mongodb');

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DATABASE = process.env.MONGODB_DATABASE || 'ectracc';

async function createIndexes() {
  console.log('🚀 Starting MongoDB index creation...\n');
  
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable not set');
    process.exit(1);
  }

  const client = new MongoClient(MONGODB_URI);

  try {
    // Connect to MongoDB
    await client.connect();
    console.log('✅ Connected to MongoDB\n');

    const db = client.db(MONGODB_DATABASE);

    // ===== PRODUCTS COLLECTION =====
    console.log('📦 Creating indexes for products collection...');
    const products = db.collection('products');

    const productIndexes = [
      {
        key: { code: 1 },
        name: 'code_1',
        description: 'Barcode lookup - Primary query pattern'
      },
      {
        key: { product_name: 'text', brands: 'text' },
        name: 'text_search',
        description: 'Full-text search on product name and brands'
      },
      {
        key: { categories_tags: 1 },
        name: 'categories_1',
        description: 'Category filtering'
      },
      {
        key: { brands: 1 },
        name: 'brands_1',
        description: 'Brand filtering'
      },
      {
        key: { ecoscore_grade: 1 },
        name: 'ecoscore_1',
        description: 'Eco-score filtering and sorting'
      },
      {
        key: { product_type: 1 },
        name: 'product_type_1',
        description: 'Product type filtering'
      },
      {
        key: { co2_total: 1 },
        name: 'co2_total_1',
        description: 'Carbon footprint sorting'
      }
    ];

    for (const index of productIndexes) {
      try {
        await products.createIndex(index.key, { 
          name: index.name,
          background: true 
        });
        console.log(`  ✓ ${index.name}: ${index.description}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`  ⚠ ${index.name}: Already exists (skipped)`);
        } else {
          console.error(`  ✗ ${index.name}: Failed -`, error.message);
        }
      }
    }

    // ===== USER FOOTPRINTS COLLECTION =====
    console.log('\n👣 Creating indexes for user_footprints collection...');
    const footprints = db.collection('user_footprints');

    const footprintIndexes = [
      {
        key: { user_id: 1, date_added: -1 },
        name: 'user_date_1',
        description: 'User history queries (most common)'
      },
      {
        key: { user_id: 1, category: 1 },
        name: 'user_category_1',
        description: 'Category breakdown queries'
      },
      {
        key: { user_id: 1, created_at: -1 },
        name: 'user_created_1',
        description: 'User entries by creation date'
      },
      {
        key: { date_added: 1 },
        name: 'date_added_1',
        description: 'Time-based aggregations'
      },
      {
        key: { category: 1, date_added: -1 },
        name: 'category_date_1',
        description: 'Category-based time queries'
      }
    ];

    for (const index of footprintIndexes) {
      try {
        await footprints.createIndex(index.key, { 
          name: index.name,
          background: true 
        });
        console.log(`  ✓ ${index.name}: ${index.description}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`  ⚠ ${index.name}: Already exists (skipped)`);
        } else {
          console.error(`  ✗ ${index.name}: Failed -`, error.message);
        }
      }
    }

    // ===== PENDING PRODUCTS COLLECTION =====
    console.log('\n⏳ Creating indexes for pending_products collection...');
    const pendingProducts = db.collection('pending_products');

    const pendingIndexes = [
      {
        key: { status: 1, submitted_at: -1 },
        name: 'status_submitted_1',
        description: 'Admin review queue'
      },
      {
        key: { submitted_by: 1, submitted_at: -1 },
        name: 'submitter_date_1',
        description: 'User submission history'
      },
      {
        key: { barcode: 1 },
        name: 'barcode_1',
        description: 'Duplicate detection'
      }
    ];

    for (const index of pendingIndexes) {
      try {
        await pendingProducts.createIndex(index.key, { 
          name: index.name,
          background: true 
        });
        console.log(`  ✓ ${index.name}: ${index.description}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`  ⚠ ${index.name}: Already exists (skipped)`);
        } else {
          console.error(`  ✗ ${index.name}: Failed -`, error.message);
        }
      }
    }

    // ===== BASE COMPONENTS COLLECTION =====
    console.log('\n🧱 Creating indexes for base_components collection...');
    const baseComponents = db.collection('base_components');

    const baseComponentIndexes = [
      {
        key: { category: 1 },
        name: 'category_1',
        description: 'Category-based lookups'
      },
      {
        key: { name: 1 },
        name: 'name_1',
        description: 'Name-based lookups'
      }
    ];

    for (const index of baseComponentIndexes) {
      try {
        await baseComponents.createIndex(index.key, { 
          name: index.name,
          background: true 
        });
        console.log(`  ✓ ${index.name}: ${index.description}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`  ⚠ ${index.name}: Already exists (skipped)`);
        } else {
          console.error(`  ✗ ${index.name}: Failed -`, error.message);
        }
      }
    }

    // ===== VERIFY INDEXES =====
    console.log('\n📊 Index Summary:');
    
    const collections = [
      { name: 'products', collection: products },
      { name: 'user_footprints', collection: footprints },
      { name: 'pending_products', collection: pendingProducts },
      { name: 'base_components', collection: baseComponents }
    ];

    for (const { name, collection } of collections) {
      const indexes = await collection.listIndexes().toArray();
      console.log(`\n  ${name}: ${indexes.length} indexes`);
      indexes.forEach(index => {
        const keys = Object.keys(index.key).join(', ');
        console.log(`    - ${index.name}: ${keys}`);
      });
    }

    console.log('\n✅ Index creation complete!');
    console.log('\n💡 Performance Tips:');
    console.log('  - Indexes are created in background mode');
    console.log('  - Monitor query performance with explain()');
    console.log('  - Update indexes as query patterns evolve');
    console.log('  - Consider compound indexes for common query combinations\n');

  } catch (error) {
    console.error('\n❌ Error creating indexes:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  createIndexes()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createIndexes };

