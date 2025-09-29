#!/usr/bin/env node
// Database Reset Script - Clears all data and indexes

require('dotenv').config();
const { connectMongoDB, getMongoDB } = require('../config/mongodb');

async function resetDatabase() {
  console.log('🗑️ Resetting database...');
  
  try {
    await connectMongoDB();
    const db = getMongoDB();
    
    // Drop the entire products collection (this removes data and indexes)
    await db.collection('products').drop();
    console.log('✅ Dropped products collection');
    
    console.log('🎉 Database reset completed!');
    console.log('💡 Run "npm run seed-data" to add sample products');
    
  } catch (error) {
    if (error.message.includes('ns not found')) {
      console.log('✅ Collection already empty or doesn\'t exist');
    } else {
      console.error('❌ Reset failed:', error);
      process.exit(1);
    }
  }
}

if (require.main === module) {
  resetDatabase().then(() => process.exit(0));
}

module.exports = resetDatabase;
