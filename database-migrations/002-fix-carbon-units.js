/**
 * Database Migration: Fix Carbon Footprint Units
 * 
 * This migration fixes the carbon footprint unit issue where manual entries
 * were stored in grams but displayed as kilograms, causing 1000x inflation.
 * 
 * The migration:
 * 1. Finds all user footprint entries from manual_entry source
 * 2. Identifies entries with suspiciously high values (> 100 kg for single items)
 * 3. Divides carbon_footprint by 1000 to convert from grams to kilograms
 * 4. Updates records in MongoDB
 * 
 * Run this script once after deploying the frontend/backend fixes.
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/ectracc';
const DB_NAME = 'ectracc';

async function migrateCarbonUnits() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('user_footprints');
    
    // Find all manual entry records with suspiciously high carbon values
    // Threshold: > 100 kg is likely stored in grams instead of kg
    const query = {
      source: 'manual_entry',
      carbon_footprint: { $gt: 100 }
    };
    
    const problematicEntries = await collection.find(query).toArray();
    
    console.log(`\nFound ${problematicEntries.length} entries with carbon_footprint > 100 kg`);
    
    if (problematicEntries.length === 0) {
      console.log('No entries need migration. All values are in correct range.');
      return;
    }
    
    // Show sample entries before migration
    console.log('\nSample entries before migration:');
    problematicEntries.slice(0, 3).forEach(entry => {
      console.log(`  - ${entry.product_name}: ${entry.carbon_footprint} kg CO₂e (${entry.quantity} ${entry.unit})`);
    });
    
    // Confirm migration
    console.log('\n⚠️  This will divide carbon_footprint by 1000 for these entries.');
    console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n');
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Perform bulk update
    const bulkOps = problematicEntries.map(entry => ({
      updateOne: {
        filter: { _id: entry._id },
        update: {
          $set: {
            carbon_footprint: entry.carbon_footprint / 1000,
            carbon_footprint_per_unit: entry.carbon_footprint_per_unit / 1000,
            migration_applied: '002-fix-carbon-units',
            migration_date: new Date()
          }
        }
      }
    }));
    
    if (bulkOps.length > 0) {
      console.log('Applying migration...');
      const result = await collection.bulkWrite(bulkOps);
      console.log(`\n✅ Migration complete!`);
      console.log(`   Modified: ${result.modifiedCount} entries`);
      console.log(`   Matched: ${result.matchedCount} entries`);
    }
    
    // Verify results
    console.log('\nSample entries after migration:');
    const updatedEntries = await collection.find({
      _id: { $in: problematicEntries.slice(0, 3).map(e => e._id) }
    }).toArray();
    
    updatedEntries.forEach(entry => {
      console.log(`  - ${entry.product_name}: ${entry.carbon_footprint} kg CO₂e (${entry.quantity} ${entry.unit})`);
    });
    
    // Summary statistics
    const stats = await collection.aggregate([
      { $match: { source: 'manual_entry' } },
      {
        $group: {
          _id: null,
          totalEntries: { $sum: 1 },
          avgCarbon: { $avg: '$carbon_footprint' },
          maxCarbon: { $max: '$carbon_footprint' },
          minCarbon: { $min: '$carbon_footprint' }
        }
      }
    ]).toArray();
    
    if (stats.length > 0) {
      console.log('\nFinal statistics for manual entries:');
      console.log(`  Total entries: ${stats[0].totalEntries}`);
      console.log(`  Average carbon: ${stats[0].avgCarbon.toFixed(3)} kg CO₂e`);
      console.log(`  Max carbon: ${stats[0].maxCarbon.toFixed(3)} kg CO₂e`);
      console.log(`  Min carbon: ${stats[0].minCarbon.toFixed(3)} kg CO₂e`);
    }
    
    // Check for any remaining high values
    const remainingHighValues = await collection.countDocuments({
      source: 'manual_entry',
      carbon_footprint: { $gt: 100 }
    });
    
    if (remainingHighValues > 0) {
      console.log(`\n⚠️  Warning: ${remainingHighValues} entries still have carbon_footprint > 100 kg`);
      console.log('   These may be legitimate high values or need manual review.');
    } else {
      console.log('\n✅ All manual entry values are now in reasonable range (< 100 kg)');
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  } finally {
    await client.close();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run migration if called directly
if (require.main === module) {
  migrateCarbonUnits()
    .then(() => {
      console.log('\n✅ Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateCarbonUnits };

