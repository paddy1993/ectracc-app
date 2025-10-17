// Product API Routes - Refactored with Controller/Service/Repository Pattern
const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
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

// GET /api/products/search - Search products by name (or get all with filters)
router.get('/search', checkMongoConnection, productController.search.bind(productController));

// GET /api/products/barcode/:barcode - Get product by barcode
router.get('/barcode/:barcode', checkMongoConnection, productController.getByBarcode.bind(productController));

// GET /api/products/categories - Get popular categories
router.get('/categories', checkMongoConnection, productController.getCategories.bind(productController));

// GET /api/products/brands - Get popular brands
router.get('/brands', checkMongoConnection, productController.getBrands.bind(productController));

// GET /api/products/random - Get random products for discovery
router.get('/random', checkMongoConnection, productController.getRandom.bind(productController));

// GET /api/products/stats - Get database statistics
router.get('/stats', checkMongoConnection, productController.getStats.bind(productController));

// GET /api/products/:id - Get product by ID
router.get('/:id', checkMongoConnection, productController.getById.bind(productController));

module.exports = router;