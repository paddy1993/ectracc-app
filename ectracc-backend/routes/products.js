// Product API Routes - Real MongoDB Integration
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { mongoHealthCheck } = require('../config/mongodb');

// Middleware to check MongoDB connection
const checkMongoConnection = async (req, res, next) => {
  const health = await mongoHealthCheck();
  if (health.status !== 'connected') {
    return res.status(503).json({
      success: false,
      error: 'Database unavailable',
      message: 'Product database is currently unavailable. Please try again later.',
      fallback: 'Using mock data'
    });
  }
  next();
};

// GET /api/products/search - Search products by name
router.get('/search', checkMongoConnection, async (req, res) => {
  try {
    const { 
      q: query, 
      limit = 20, 
      page = 1, 
      category, 
      brand, 
      ecoscore,
      sort = 'relevance'
    } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: 'Query too short',
        message: 'Search query must be at least 2 characters long'
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const options = {
      limit: Math.min(parseInt(limit), 100), // Max 100 results
      skip: Math.max(skip, 0),
      category,
      brand,
      ecoScore: ecoscore,
      sortBy: sort
    };

    const products = await Product.search(query.trim(), options);

    res.json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: products.length,
        hasMore: products.length === parseInt(limit)
      },
      query: {
        search: query.trim(),
        filters: { category, brand, ecoscore },
        sort
      }
    });

  } catch (error) {
    console.error('Product search error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed',
      message: 'An error occurred while searching products'
    });
  }
});

// GET /api/products/barcode/:barcode - Get product by barcode
router.get('/barcode/:barcode', checkMongoConnection, async (req, res) => {
  try {
    const { barcode } = req.params;

    // Validate barcode format (basic validation)
    if (!barcode || !/^\d{8,13}$/.test(barcode)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid barcode',
        message: 'Barcode must be 8-13 digits'
      });
    }

    const product = await Product.findByBarcode(barcode);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found',
        message: `No product found with barcode ${barcode}`,
        suggestions: [
          'Check if the barcode is correct',
          'Try scanning again',
          'The product might not be in our database yet'
        ]
      });
    }

    res.json({
      success: true,
      data: product,
      barcode: barcode
    });

  } catch (error) {
    console.error('Barcode lookup error:', error);
    res.status(500).json({
      success: false,
      error: 'Lookup failed',
      message: 'An error occurred while looking up the product'
    });
  }
});

// GET /api/products/categories - Get popular categories
router.get('/categories', checkMongoConnection, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const categories = await Product.getCategories(parseInt(limit));

    res.json({
      success: true,
      data: categories,
      total: categories.length
    });

  } catch (error) {
    console.error('Categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load categories',
      message: 'An error occurred while loading categories'
    });
  }
});

// GET /api/products/brands - Get popular brands
router.get('/brands', checkMongoConnection, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const brands = await Product.getBrands(parseInt(limit));

    res.json({
      success: true,
      data: brands,
      total: brands.length
    });

  } catch (error) {
    console.error('Brands error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load brands',
      message: 'An error occurred while loading brands'
    });
  }
});

// GET /api/products/category/:category - Get products by category
router.get('/category/:category', checkMongoConnection, async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20, page = 1 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const options = {
      limit: Math.min(parseInt(limit), 100),
      skip: Math.max(skip, 0)
    };

    const products = await Product.getByCategory(category, options);

    res.json({
      success: true,
      data: products,
      category: category,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: products.length,
        hasMore: products.length === parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Category products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load products',
      message: 'An error occurred while loading products for this category'
    });
  }
});

// GET /api/products/random - Get random products for discovery
router.get('/random', checkMongoConnection, async (req, res) => {
  try {
    const { count = 10 } = req.query;
    
    const products = await Product.getRandom(Math.min(parseInt(count), 50));

    res.json({
      success: true,
      data: products,
      count: products.length
    });

  } catch (error) {
    console.error('Random products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load products',
      message: 'An error occurred while loading random products'
    });
  }
});

// GET /api/products/stats - Get database statistics
router.get('/stats', checkMongoConnection, async (req, res) => {
  try {
    const stats = await Product.getStats();
    const dbHealth = await mongoHealthCheck();

    res.json({
      success: true,
      data: {
        ...stats,
        database: dbHealth.database,
        lastUpdated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Product stats error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load statistics',
      message: 'An error occurred while loading database statistics'
    });
  }
});

// GET /api/products - General product listing (fallback)
router.get('/', checkMongoConnection, async (req, res) => {
  try {
    // If no specific query, return random products
    const products = await Product.getRandom(20);

    res.json({
      success: true,
      data: products,
      message: 'Random product selection. Use /search?q=query for specific searches.',
      endpoints: [
        'GET /api/products/search?q=query - Search products',
        'GET /api/products/barcode/:barcode - Get product by barcode',
        'GET /api/products/categories - Get categories',
        'GET /api/products/brands - Get brands',
        'GET /api/products/random - Get random products',
        'GET /api/products/stats - Get database statistics'
      ]
    });

  } catch (error) {
    console.error('Products listing error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load products',
      message: 'An error occurred while loading products'
    });
  }
});

module.exports = router;