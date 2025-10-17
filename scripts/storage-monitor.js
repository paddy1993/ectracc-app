#!/usr/bin/env node

/**
 * MongoDB Storage Monitor
 * Real-time monitoring of MongoDB storage usage during enrichment
 */

require('dotenv').config({ path: require('path').join(__dirname, '..', 'ectracc-backend', '.env') });
const { MongoClient } = require('mongodb');

// Configuration
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'ectracc';
const STORAGE_LIMIT_GB = 5;
const STORAGE_WARNING_GB = 4.5;

class StorageMonitor {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async initialize() {
    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not set');
    }

    this.client = new MongoClient(MONGODB_URI);
    await this.client.connect();
    this.db = this.client.db(DATABASE_NAME);
    
    console.log('✅ Connected to MongoDB for storage monitoring');
  }

  async getDetailedStorageStats() {
    try {
      const dbStats = await this.db.stats();
      const productsStats = await this.db.collection('products').stats();
      const footprintsStats = await this.db.collection('footprints').stats();
      
      return {
        database: {
          dataSize: dbStats.dataSize,
          storageSize: dbStats.storageSize,
          indexSize: dbStats.indexSize,
          totalSize: dbStats.dataSize + dbStats.indexSize,
          collections: dbStats.collections,
          objects: dbStats.objects
        },
        products: {
          count: productsStats.count,
          size: productsStats.size,
          avgObjSize: productsStats.avgObjSize,
          storageSize: productsStats.storageSize,
          indexSize: productsStats.totalIndexSize || 0
        },
        footprints: {
          count: footprintsStats.count || 0,
          size: footprintsStats.size || 0,
          avgObjSize: footprintsStats.avgObjSize || 0,
          storageSize: footprintsStats.storageSize || 0,
          indexSize: footprintsStats.totalIndexSize || 0
        }
      };
    } catch (error) {
      console.error('Error getting detailed storage stats:', error.message);
      return null;
    }
  }

  async getEnrichmentFieldStats() {
    try {
      const collection = this.db.collection('products');
      
      // Count products with enrichment fields
      const enrichmentFields = [
        'quantity',
        'product_quantity', 
        'product_quantity_unit',
        'net_weight',
        'net_weight_unit',
        'packaging',
        'packaging_text',
        'origins',
        'manufacturing_places',
        'labels',
        'stores',
        'countries',
        'last_enriched'
      ];

      const fieldStats = {};
      
      for (const field of enrichmentFields) {
        const count = await collection.countDocuments({
          [field]: { $exists: true, $ne: null }
        });
        fieldStats[field] = count;
      }

      // Count products that have been enriched
      const enrichedCount = await collection.countDocuments({
        last_enriched: { $exists: true }
      });

      return {
        enrichedProducts: enrichedCount,
        fieldCoverage: fieldStats
      };
    } catch (error) {
      console.error('Error getting enrichment field stats:', error.message);
      return null;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatPercentage(value, total) {
    return ((value / total) * 100).toFixed(1) + '%';
  }

  async displayCurrentStatus() {
    console.log('\n📊 MongoDB Storage Status');
    console.log('=' .repeat(60));
    
    const stats = await this.getDetailedStorageStats();
    const enrichmentStats = await this.getEnrichmentFieldStats();
    
    if (!stats) {
      console.error('❌ Could not retrieve storage statistics');
      return;
    }

    // Overall database stats
    const totalSizeGB = stats.database.totalSize / (1024 * 1024 * 1024);
    const usagePercentage = (totalSizeGB / STORAGE_LIMIT_GB) * 100;
    
    console.log(`\n💾 Database Overview:`);
    console.log(`Total size: ${this.formatBytes(stats.database.totalSize)} (${totalSizeGB.toFixed(2)} GB)`);
    console.log(`Data size: ${this.formatBytes(stats.database.dataSize)}`);
    console.log(`Index size: ${this.formatBytes(stats.database.indexSize)}`);
    console.log(`Storage usage: ${usagePercentage.toFixed(1)}% of ${STORAGE_LIMIT_GB} GB limit`);
    console.log(`Collections: ${stats.database.collections}`);
    console.log(`Total documents: ${stats.database.objects.toLocaleString()}`);

    // Status indicator
    if (totalSizeGB > STORAGE_LIMIT_GB) {
      console.log(`🚨 STATUS: OVER LIMIT (${totalSizeGB.toFixed(2)} GB > ${STORAGE_LIMIT_GB} GB)`);
    } else if (totalSizeGB > STORAGE_WARNING_GB) {
      console.log(`⚠️  STATUS: WARNING (${totalSizeGB.toFixed(2)} GB > ${STORAGE_WARNING_GB} GB)`);
    } else {
      console.log(`✅ STATUS: OK (${(STORAGE_LIMIT_GB - totalSizeGB).toFixed(2)} GB remaining)`);
    }

    // Products collection details
    console.log(`\n📦 Products Collection:`);
    console.log(`Documents: ${stats.products.count.toLocaleString()}`);
    console.log(`Data size: ${this.formatBytes(stats.products.size)}`);
    console.log(`Storage size: ${this.formatBytes(stats.products.storageSize)}`);
    console.log(`Index size: ${this.formatBytes(stats.products.indexSize)}`);
    console.log(`Average document size: ${this.formatBytes(stats.products.avgObjSize)}`);

    // Footprints collection details
    if (stats.footprints.count > 0) {
      console.log(`\n👣 Footprints Collection:`);
      console.log(`Documents: ${stats.footprints.count.toLocaleString()}`);
      console.log(`Data size: ${this.formatBytes(stats.footprints.size)}`);
      console.log(`Storage size: ${this.formatBytes(stats.footprints.storageSize)}`);
      console.log(`Index size: ${this.formatBytes(stats.footprints.indexSize)}`);
      console.log(`Average document size: ${this.formatBytes(stats.footprints.avgObjSize)}`);
    }

    // Enrichment statistics
    if (enrichmentStats) {
      console.log(`\n🎯 Enrichment Status:`);
      console.log(`Products enriched: ${enrichmentStats.enrichedProducts.toLocaleString()}`);
      console.log(`Enrichment rate: ${this.formatPercentage(enrichmentStats.enrichedProducts, stats.products.count)}`);
      
      console.log(`\n📈 Field Coverage:`);
      Object.entries(enrichmentStats.fieldCoverage)
        .sort(([,a], [,b]) => b - a)
        .forEach(([field, count]) => {
          const percentage = this.formatPercentage(count, stats.products.count);
          console.log(`${field.padEnd(25)}: ${count.toLocaleString().padStart(8)} (${percentage})`);
        });
    }

    // Storage recommendations
    console.log(`\n💡 Recommendations:`);
    if (totalSizeGB > STORAGE_WARNING_GB) {
      console.log(`⚠️  Consider stopping enrichment - approaching storage limit`);
      console.log(`⚠️  Current usage: ${usagePercentage.toFixed(1)}% of limit`);
    } else {
      const remainingGB = STORAGE_LIMIT_GB - totalSizeGB;
      const avgDocSize = stats.products.avgObjSize;
      const estimatedRemainingProducts = (remainingGB * 1024 * 1024 * 1024) / avgDocSize;
      console.log(`✅ Safe to continue enrichment`);
      console.log(`📊 Estimated capacity for ~${Math.floor(estimatedRemainingProducts).toLocaleString()} more products`);
    }
  }

  async monitorContinuously(intervalSeconds = 30) {
    console.log(`🔄 Starting continuous monitoring (updates every ${intervalSeconds}s)`);
    console.log('Press Ctrl+C to stop monitoring\n');

    const monitor = async () => {
      try {
        console.clear();
        console.log(`🕐 Last updated: ${new Date().toLocaleString()}`);
        await this.displayCurrentStatus();
      } catch (error) {
        console.error('❌ Monitoring error:', error.message);
      }
    };

    // Initial display
    await monitor();

    // Set up interval
    const intervalId = setInterval(monitor, intervalSeconds * 1000);

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n\n👋 Stopping storage monitor...');
      clearInterval(intervalId);
      this.cleanup().then(() => process.exit(0));
    });
  }

  async cleanup() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  async run(options = {}) {
    try {
      await this.initialize();
      
      if (options.continuous) {
        await this.monitorContinuously(options.interval || 30);
      } else {
        await this.displayCurrentStatus();
        await this.cleanup();
      }
      
    } catch (error) {
      console.error('❌ Storage monitor failed:', error.message);
      process.exit(1);
    }
  }
}

// Command line interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    continuous: args.includes('--continuous') || args.includes('-c'),
    interval: 30
  };

  // Parse interval option
  const intervalIndex = args.findIndex(arg => arg.startsWith('--interval='));
  if (intervalIndex !== -1) {
    options.interval = parseInt(args[intervalIndex].split('=')[1]) || 30;
  }

  console.log('📊 MongoDB Storage Monitor');
  console.log('Usage: node storage-monitor.js [--continuous] [--interval=30]');
  console.log('');

  const monitor = new StorageMonitor();
  monitor.run(options);
}

module.exports = StorageMonitor;
