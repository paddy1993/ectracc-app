const express = require('express');
const router = express.Router();

// Import the production enrichment class
const RenderProductionEnrichment = require('../scripts/run-production-enrichment');

/**
 * POST /api/enrichment/start
 * Start the production enrichment process
 */
router.post('/start', async (req, res) => {
  try {
    console.log('🚀 Starting production enrichment via API...');
    
    // Create enrichment instance
    const enrichment = new RenderProductionEnrichment();
    
    // Start enrichment in background (don't await)
    enrichment.run().catch(error => {
      console.error('❌ Background enrichment failed:', error);
    });
    
    res.json({
      success: true,
      message: 'Production enrichment started in background',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Failed to start enrichment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start enrichment',
      message: error.message
    });
  }
});

/**
 * GET /api/enrichment/status
 * Get enrichment status and database statistics
 */
router.get('/status', async (req, res) => {
  try {
    const { MongoClient } = require('mongodb');
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DATABASE || 'ectracc');
    const collection = db.collection('products');
    
    // Get statistics
    const totalProducts = await collection.countDocuments();
    const enrichedProducts = await collection.countDocuments({ 
      last_enriched: { $exists: true } 
    });
    const unenrichedProducts = totalProducts - enrichedProducts;
    
    // Get database size
    const stats = await db.stats();
    const dbSizeGB = (stats.dataSize / 1024 / 1024 / 1024).toFixed(2);
    const remainingGB = (5 - parseFloat(dbSizeGB)).toFixed(2);
    
    await client.close();
    
    res.json({
      success: true,
      data: {
        totalProducts: totalProducts,
        enrichedProducts: enrichedProducts,
        unenrichedProducts: unenrichedProducts,
        enrichmentRate: ((enrichedProducts / totalProducts) * 100).toFixed(1) + '%',
        databaseSize: dbSizeGB + ' GB',
        remainingStorage: remainingGB + ' GB',
        isNearStorageLimit: parseFloat(dbSizeGB) > 4.5,
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get enrichment status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get enrichment status',
      message: error.message
    });
  }
});

/**
 * GET /api/enrichment/sample
 * Get a sample of enriched products
 */
router.get('/sample', async (req, res) => {
  try {
    const { MongoClient } = require('mongodb');
    
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db(process.env.MONGODB_DATABASE || 'ectracc');
    const collection = db.collection('products');
    
    // Get sample enriched products
    const sampleProducts = await collection.find({ 
      last_enriched: { $exists: true } 
    }).limit(5).toArray();
    
    await client.close();
    
    // Format sample data
    const samples = sampleProducts.map(product => ({
      name: product.product_name || 'Unknown',
      code: product.code,
      quantity: product.quantity,
      packaging: product.packaging,
      origins: product.origins,
      labels: product.labels,
      stores: product.stores,
      countries: product.countries,
      lastEnriched: product.last_enriched
    }));
    
    res.json({
      success: true,
      data: {
        samples: samples,
        count: samples.length
      }
    });
    
  } catch (error) {
    console.error('❌ Failed to get sample products:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sample products',
      message: error.message
    });
  }
});

module.exports = router;
