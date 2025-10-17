// User Footprints API Routes - MongoDB version
const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const UserFootprint = require('../models/UserFootprint');
const Product = require('../models/Product');

const router = express.Router();

// Rate limiting for footprint tracking
const trackingLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 tracking requests per minute
  message: {
    success: false,
    error: 'Too many tracking requests, please try again later'
  }
});

// POST /api/user-footprints/add - Add product to user's footprint
router.post('/add', trackingLimiter, requireAuth, async (req, res) => {
  try {
    const {
      product_id,
      product_name,
      carbon_footprint,
      quantity = 1,
      unit = 'item',
      source,
      source_reference,
      categories = [],
      brands = []
    } = req.body;

    // Validate required fields
    if (!product_name || !carbon_footprint) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: product_name, carbon_footprint'
      });
    }

    // Validate carbon_footprint is in reasonable kg range
    const carbonKg = parseFloat(carbon_footprint);
    if (carbonKg < 0.001 || carbonKg > 100) {
      return res.status(400).json({
        success: false,
        message: 'Carbon footprint must be between 0.001 and 100 kg CO₂e'
      });
    }

    const userId = req.user.id;

    // If product_id is provided, fetch additional details from database
    let productDetails = null;
    if (product_id) {
      try {
        productDetails = await Product.findById(product_id);
      } catch (error) {
        console.log('Product not found, using provided data');
      }
    }

    // Prepare entry data
    // NOTE: carbon_footprint is expected in kg CO₂e
    const entryData = {
      product_id: product_id || null,
      product_name: productDetails?.product_name || product_name,
      carbon_footprint: carbonKg, // kg CO₂e
      carbon_footprint_per_unit: carbonKg, // kg CO₂e per unit
      quantity: parseFloat(quantity),
      unit: unit,
      source: productDetails?.carbon_footprint_source || source || 'manual_entry',
      source_reference: productDetails?.carbon_footprint_reference || source_reference || null,
      categories: productDetails?.categories || categories,
      brands: productDetails?.brands || brands
    };

    const entry = await UserFootprint.addEntry(userId, entryData);

    res.status(201).json({
      success: true,
      data: entry,
      message: 'Product added to footprint successfully'
    });
  } catch (error) {
    console.error('Error adding footprint entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add product to footprint'
    });
  }
});

// GET /api/user-footprints/entries - Get user's footprint entries
router.get('/entries', requireAuth, async (req, res) => {
  try {
    const {
      limit = 50,
      page = 1,
      start_date,
      end_date,
      sort_by = 'date_added',
      sort_order = 'desc'
    } = req.query;

    const userId = req.user.id;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const options = {
      limit: parseInt(limit),
      skip: skip,
      startDate: start_date ? new Date(start_date) : null,
      endDate: end_date ? new Date(end_date) : null,
      sortBy: sort_by,
      sortOrder: sort_order === 'desc' ? -1 : 1
    };

    const entries = await UserFootprint.getUserEntries(userId, options);

    res.json({
      success: true,
      data: entries,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: entries.length
      }
    });
  } catch (error) {
    console.error('Error getting footprint entries:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get footprint entries'
    });
  }
});

// GET /api/user-footprints/summary - Get user's footprint summary
router.get('/summary', requireAuth, async (req, res) => {
  try {
    const { timeframe = 'all' } = req.query;
    const userId = req.user.id;

    const summary = await UserFootprint.getUserSummary(userId, timeframe);

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error getting footprint summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get footprint summary'
    });
  }
});

// GET /api/user-footprints/history - Get user's footprint by time periods
router.get('/history', requireAuth, async (req, res) => {
  try {
    const { period = 'day', limit = 30 } = req.query;
    const userId = req.user.id;

    const history = await UserFootprint.getUserFootprintByPeriod(
      userId, 
      period, 
      parseInt(limit)
    );

    res.json({
      success: true,
      data: history,
      period,
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error('Error getting footprint history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get footprint history'
    });
  }
});

// GET /api/user-footprints/entry/:id - Get specific entry
router.get('/entry/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const entry = await UserFootprint.getEntryById(id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Footprint entry not found'
      });
    }

    // Check if entry belongs to user
    if (entry.user_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error('Error getting footprint entry:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get footprint entry'
    });
  }
});

// PUT /api/user-footprints/entry/:id - Update entry
router.put('/entry/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    // Convert numeric fields
    if (updateData.carbon_footprint) {
      updateData.carbon_footprint = parseFloat(updateData.carbon_footprint);
    }
    if (updateData.quantity) {
      updateData.quantity = parseFloat(updateData.quantity);
    }

    const entry = await UserFootprint.updateEntry(id, userId, updateData);

    res.json({
      success: true,
      data: entry,
      message: 'Footprint entry updated successfully'
    });
  } catch (error) {
    console.error('Error updating footprint entry:', error);
    
    if (error.message === 'Footprint entry not found or access denied') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update footprint entry'
    });
  }
});

// DELETE /api/user-footprints/entry/:id - Delete entry
router.delete('/entry/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await UserFootprint.deleteEntry(id, userId);

    res.json({
      success: true,
      message: 'Footprint entry deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting footprint entry:', error);
    
    if (error.message === 'Footprint entry not found or access denied') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to delete footprint entry'
    });
  }
});

// POST /api/user-footprints/add-from-product - Add product from product database
router.post('/add-from-product', trackingLimiter, requireAuth, async (req, res) => {
  try {
    const { product_id, quantity = 1, unit = 'item' } = req.body;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Product ID is required'
      });
    }

    const userId = req.user.id;

    // Fetch product details
    console.log('Looking for product with ID:', product_id, 'type:', typeof product_id);
    const product = await Product.findById(product_id);
    console.log('Raw product from DB:', product);
    console.log('Product found:', {
      id: product?.id,
      _id: product?._id,
      product_name: product?.product_name,
      carbon_footprint: product?.carbon_footprint,
      carbon_footprint_type: typeof product?.carbon_footprint,
      carbon_footprint_source: product?.carbon_footprint_source
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Prepare entry data from product
    const entryData = {
      product_id: product.id,
      product_name: product.product_name,
      carbon_footprint: product.carbon_footprint,
      carbon_footprint_per_unit: product.carbon_footprint,
      quantity: parseFloat(quantity),
      unit: unit,
      source: product.carbon_footprint_source,
      source_reference: product.carbon_footprint_reference,
      categories: product.categories,
      brands: product.brands
    };

    const entry = await UserFootprint.addEntry(userId, entryData);

    res.status(201).json({
      success: true,
      data: entry,
      message: 'Product added to footprint successfully'
    });
  } catch (error) {
    console.error('Error adding product to footprint:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      productId: req.body.product_id,
      userId: 'test-user-123'
    });
    res.status(500).json({
      success: false,
      message: 'Failed to add product to footprint',
      error: error.message // TEMPORARY: Include error details for debugging
    });
  }
});

// GET /api/user-footprints/debug - Debug endpoint to check raw data
router.get('/debug', requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userFootprint = new UserFootprint();
    const footprints = userFootprint.getCollection();
    
    // Get all user's footprint entries
    const entries = await footprints.find({ user_id: userId }).toArray();
    
    console.log(`Found ${entries.length} entries for user ${userId}`);
    entries.forEach((entry, index) => {
      console.log(`Entry ${index + 1}:`, {
        product_name: entry.product_name,
        carbon_footprint: entry.carbon_footprint,
        carbon_footprint_type: typeof entry.carbon_footprint,
        quantity: entry.quantity,
        quantity_type: typeof entry.quantity,
        calculated: entry.carbon_footprint * entry.quantity
      });
    });
    
    res.json({
      success: true,
      data: {
        totalEntries: entries.length,
        entries: entries.map(entry => ({
          product_name: entry.product_name,
          carbon_footprint: entry.carbon_footprint,
          carbon_footprint_type: typeof entry.carbon_footprint,
          quantity: entry.quantity,
          quantity_type: typeof entry.quantity,
          calculated: entry.carbon_footprint * entry.quantity
        }))
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

// GET /api/user-footprints/stats - Get global statistics (for admin)
router.get('/stats', async (req, res) => {
  try {
    const stats = await UserFootprint.getGlobalStats();

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error getting footprint stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get footprint statistics'
    });
  }
});

module.exports = router;
