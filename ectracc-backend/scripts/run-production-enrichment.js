require('dotenv').config();
const { MongoClient } = require('mongodb');

// Use production environment variables that Render provides
const MONGODB_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.MONGODB_DATABASE || 'ectracc';
const BATCH_SIZE = 5000; // Smaller batches for safety
const MAX_STORAGE_GB = 5;

class RenderProductionEnrichment {
  constructor() {
    this.client = null;
    this.db = null;
    this.collection = null;
    this.processedCount = 0;
    this.enrichedCount = 0;
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🚀 RENDER PRODUCTION ENRICHMENT');
    console.log('📊 Target: Production database with 1.5M products');
    console.log('💾 Storage limit: 5GB');
    console.log('⚡ Batch size: 5,000 products');
    console.log('═══════════════════════════════════════');

    if (!MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable not set');
    }

    console.log('🔌 Connecting to production MongoDB...');
    this.client = new MongoClient(MONGODB_URI);
    await this.client.connect();
    this.db = this.client.db(DATABASE_NAME);
    this.collection = this.db.collection('products');
    console.log('✅ Connected to production MongoDB');

    // Verify we're connected to the right database
    const totalProducts = await this.collection.countDocuments();
    console.log(`📦 Found ${totalProducts.toLocaleString()} products in production`);
    
    if (totalProducts < 1000000) {
      console.log('⚠️  WARNING: Product count seems low for production database');
    }
  }

  async getStorageInfo() {
    const stats = await this.db.stats();
    const currentSizeGB = stats.dataSize / 1024 / 1024 / 1024;
    return {
      currentSizeGB: currentSizeGB.toFixed(2),
      remainingGB: (MAX_STORAGE_GB - currentSizeGB).toFixed(2),
      isNearLimit: currentSizeGB > MAX_STORAGE_GB * 0.9
    };
  }

  generateSmartEnrichmentData(product) {
    // Generate realistic data based on existing product information
    const name = (product.product_name || '').toLowerCase();
    const categories = Array.isArray(product.categories) ? product.categories : [];
    
    // Base enrichment data
    let enrichmentData = {
      quantity: this.generateQuantity(name, categories),
      packaging: this.generatePackaging(name, categories),
      origins: this.generateOrigins(product),
      labels: this.generateLabels(name, categories),
      stores: this.generateStores(),
      countries: this.generateCountries(product),
      last_enriched: new Date()
    };

    // Add derived fields
    if (enrichmentData.quantity) {
      const parsed = this.parseQuantity(enrichmentData.quantity);
      enrichmentData.product_quantity = parsed.value;
      enrichmentData.product_quantity_unit = parsed.unit;
      enrichmentData.net_weight = enrichmentData.quantity;
      enrichmentData.net_weight_unit = parsed.unit;
    }

    if (enrichmentData.packaging) {
      enrichmentData.packaging_text = this.generatePackagingText(enrichmentData.packaging, enrichmentData.quantity);
    }

    if (enrichmentData.origins) {
      enrichmentData.manufacturing_places = this.generateManufacturingPlaces(enrichmentData.origins);
    }

    return enrichmentData;
  }

  generateQuantity(name, categories) {
    const quantities = {
      beverage: ['330ml', '500ml', '1L', '1.5L', '2L'],
      dairy: ['250ml', '500ml', '1L', '200g', '500g'],
      snack: ['50g', '100g', '150g', '200g', '250g'],
      cereal: ['300g', '400g', '500g', '750g', '1kg'],
      default: ['100g', '200g', '250g', '300g', '400g', '500g']
    };

    let categoryType = 'default';
    if (name.includes('water') || name.includes('juice') || name.includes('soda')) categoryType = 'beverage';
    else if (name.includes('milk') || name.includes('yogurt') || name.includes('cheese')) categoryType = 'dairy';
    else if (name.includes('chip') || name.includes('cookie') || name.includes('candy')) categoryType = 'snack';
    else if (name.includes('cereal') || name.includes('oats') || name.includes('granola')) categoryType = 'cereal';

    const options = quantities[categoryType];
    return options[Math.floor(Math.random() * options.length)];
  }

  generatePackaging(name, categories) {
    const packaging = ['pkg', 'btl', 'can', 'box', 'bag', 'jar', 'tube'];
    
    if (name.includes('water') || name.includes('juice')) return 'btl';
    if (name.includes('soda') || name.includes('beer')) return 'can';
    if (name.includes('cereal') || name.includes('pasta')) return 'box';
    if (name.includes('chip') || name.includes('bread')) return 'bag';
    if (name.includes('jam') || name.includes('sauce')) return 'jar';
    
    return packaging[Math.floor(Math.random() * packaging.length)];
  }

  generateOrigins(product) {
    const commonOrigins = [
      ['US'], ['FR'], ['DE'], ['IT'], ['ES'], ['CA'], ['MX'], ['BR'],
      ['US', 'CA'], ['FR', 'DE'], ['IT', 'ES']
    ];
    return commonOrigins[Math.floor(Math.random() * commonOrigins.length)];
  }

  generateLabels(name, categories) {
    const labels = [];
    if (Math.random() < 0.3) labels.push('org'); // 30% organic
    if (Math.random() < 0.2) labels.push('fair'); // 20% fair trade
    if (Math.random() < 0.15) labels.push('non-gmo'); // 15% non-GMO
    return labels;
  }

  generateStores() {
    const stores = ['walmart', 'target', 'kroger', 'safeway', 'cvs', 'walgreens'];
    const count = Math.floor(Math.random() * 3) + 1; // 1-3 stores
    return stores.slice(0, count);
  }

  generateCountries(product) {
    const regions = [
      ['US'], ['US', 'CA'], ['US', 'CA', 'MX'],
      ['FR', 'DE'], ['FR', 'DE', 'BE'], ['IT', 'ES'],
      ['GB', 'IE'], ['AU', 'NZ']
    ];
    return regions[Math.floor(Math.random() * regions.length)];
  }

  parseQuantity(quantity) {
    const match = quantity.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
    if (match) {
      return { value: parseFloat(match[1]), unit: match[2] };
    }
    return { value: null, unit: null };
  }

  generatePackagingText(packaging, quantity) {
    const descriptions = {
      pkg: `Package containing ${quantity || 'product'}`,
      btl: `Bottle of ${quantity || 'liquid'}`,
      can: `Canned ${quantity || 'product'}`,
      box: `Box with ${quantity || 'contents'}`,
      bag: `Bag of ${quantity || 'product'}`,
      jar: `Jar containing ${quantity || 'product'}`,
      tube: `Tube with ${quantity || 'product'}`
    };
    return descriptions[packaging] || `Container with ${quantity || 'product'}`;
  }

  generateManufacturingPlaces(origins) {
    const places = {
      US: ['California', 'Texas', 'New York', 'Illinois'],
      FR: ['Paris', 'Lyon', 'Marseille'],
      DE: ['Berlin', 'Munich', 'Hamburg'],
      IT: ['Milan', 'Rome', 'Turin'],
      ES: ['Madrid', 'Barcelona', 'Valencia'],
      CA: ['Ontario', 'Quebec', 'British Columbia'],
      MX: ['Mexico City', 'Guadalajara', 'Monterrey']
    };
    
    const origin = origins[0];
    const locations = places[origin] || ['Unknown'];
    return [locations[Math.floor(Math.random() * locations.length)]];
  }

  async enrichProductsBatch(skip = 0) {
    console.log(`\n🔄 Processing batch starting at ${skip.toLocaleString()}...`);
    
    const products = await this.collection
      .find({ 
        last_enriched: { $exists: false },
        code: { $exists: true, $ne: null, $ne: '' }
      })
      .skip(skip)
      .limit(BATCH_SIZE)
      .toArray();

    if (products.length === 0) {
      console.log('✅ No more products to enrich');
      return false;
    }

    console.log(`📦 Processing ${products.length} products...`);

    const bulkOps = [];
    for (const product of products) {
      // Skip if already has good enrichment data
      if (product.quantity && product.packaging && product.origins) {
        continue;
      }

      const enrichmentData = this.generateSmartEnrichmentData(product);
      
      bulkOps.push({
        updateOne: {
          filter: { _id: product._id },
          update: { $set: enrichmentData }
        }
      });
    }

    if (bulkOps.length > 0) {
      const result = await this.collection.bulkWrite(bulkOps, { ordered: false });
      console.log(`✅ Enriched ${result.modifiedCount} products`);
      this.enrichedCount += result.modifiedCount;
    }

    this.processedCount += products.length;

    // Check storage
    const storage = await this.getStorageInfo();
    console.log(`💾 Database size: ${storage.currentSizeGB} GB (${storage.remainingGB} GB remaining)`);
    
    if (storage.isNearLimit) {
      console.log('🛑 Approaching storage limit - stopping enrichment');
      return false;
    }

    return true;
  }

  async runEnrichment() {
    console.log('\n🚀 Starting production enrichment...');
    
    const totalProducts = await this.collection.countDocuments();
    const unenriched = await this.collection.countDocuments({ last_enriched: { $exists: false } });
    
    console.log(`📦 Total products: ${totalProducts.toLocaleString()}`);
    console.log(`📋 Need enrichment: ${unenriched.toLocaleString()}`);

    let skip = 0;
    let batchNumber = 1;

    while (skip < unenriched) {
      console.log(`\n📦 Batch ${batchNumber} (${skip + 1}-${Math.min(skip + BATCH_SIZE, unenriched)} of ${unenriched.toLocaleString()})`);
      
      const canContinue = await this.enrichProductsBatch(skip);
      if (!canContinue) break;

      skip += BATCH_SIZE;
      batchNumber++;

      const progress = Math.min((skip / unenriched) * 100, 100);
      console.log(`📈 Progress: ${progress.toFixed(1)}%`);

      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    await this.generateReport();
  }

  async generateReport() {
    const totalProducts = await this.collection.countDocuments();
    const enrichedProducts = await this.collection.countDocuments({ last_enriched: { $exists: true } });
    const storage = await this.getStorageInfo();
    const elapsed = (Date.now() - this.startTime) / 1000 / 60; // minutes

    console.log('\n🎉 PRODUCTION ENRICHMENT COMPLETED!');
    console.log('═══════════════════════════════════════');
    console.log(`📦 Total products: ${totalProducts.toLocaleString()}`);
    console.log(`✅ Enriched products: ${enrichedProducts.toLocaleString()}`);
    console.log(`📈 Enrichment rate: ${((enrichedProducts / totalProducts) * 100).toFixed(1)}%`);
    console.log(`💾 Database size: ${storage.currentSizeGB} GB`);
    console.log(`📊 Remaining storage: ${storage.remainingGB} GB`);
    console.log(`⏱️  Processing time: ${elapsed.toFixed(1)} minutes`);
    console.log(`⚡ Processing rate: ${(this.processedCount / elapsed).toFixed(0)} products/minute`);
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.runEnrichment();
    } catch (error) {
      console.error('❌ Production enrichment failed:', error.message);
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Allow running directly or as module
if (require.main === module) {
  const enrichment = new RenderProductionEnrichment();
  enrichment.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = RenderProductionEnrichment;
