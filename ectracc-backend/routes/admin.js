// Admin API Routes - Handle admin-only operations
const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/adminAuth');
const PendingProduct = require('../models/PendingProduct');
const ProductApprovalService = require('../services/productApprovalService');

const router = express.Router();

// Rate limiting for admin operations
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many admin requests. Please try again later.'
  }
});

// Apply admin authentication to all routes
router.use(requireAuth);
router.use(requireAdmin);
router.use(adminLimiter);

// Validation schemas
const reviewSchema = Joi.object({
  review_reason: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
    .messages({
      'string.max': 'Review reason must not exceed 500 characters'
    })
});

const bulkActionSchema = Joi.object({
  product_ids: Joi.array()
    .items(Joi.string().required())
    .min(1)
    .max(50)
    .required()
    .messages({
      'array.min': 'At least one product ID is required',
      'array.max': 'Maximum 50 products can be processed at once'
    }),
  
  review_reason: Joi.string()
    .trim()
    .max(500)
    .optional()
    .allow('')
});

// GET /api/admin/stats - Get admin dashboard statistics
router.get('/stats', async (req, res) => {
  const startTime = Date.now();
  const adminId = req.user.id;

  console.log(`📊 [ADMIN STATS] Getting dashboard stats for admin: ${adminId}`);

  try {
    const stats = await ProductApprovalService.getApprovalStats();

    const duration = Date.now() - startTime;
    console.log(`✅ [ADMIN STATS] Retrieved stats in ${duration}ms`);

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [ADMIN STATS] Error getting stats after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get admin statistics'
    });
  }
});

// GET /api/admin/pending-products - Get pending products for review
router.get('/pending-products', async (req, res) => {
  const startTime = Date.now();
  const adminId = req.user.id;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const status = req.query.status || 'pending';
    const sortBy = req.query.sortBy || 'submitted_at';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    console.log(`📋 [ADMIN PENDING] Getting pending products for admin ${adminId}, page ${page}`);

    const result = await PendingProduct.getPendingProducts({
      page,
      limit,
      status,
      sortBy,
      sortOrder
    });

    const duration = Date.now() - startTime;
    console.log(`✅ [ADMIN PENDING] Retrieved ${result.products.length} products in ${duration}ms`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [ADMIN PENDING] Error getting pending products after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get pending products'
    });
  }
});

// GET /api/admin/pending-products/:id - Get specific pending product details
router.get('/pending-products/:id', async (req, res) => {
  const startTime = Date.now();
  const adminId = req.user.id;
  const productId = req.params.id;

  try {
    console.log(`🔍 [ADMIN PRODUCT] Getting product ${productId} for admin ${adminId}`);

    const product = await PendingProduct.getById(productId);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Pending product not found'
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [ADMIN PRODUCT] Retrieved product details in ${duration}ms`);

    res.json({
      success: true,
      data: product
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [ADMIN PRODUCT] Error getting product ${productId} after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get product details'
    });
  }
});

// POST /api/admin/products/:id/approve - Approve a pending product
router.post('/products/:id/approve', async (req, res) => {
  const startTime = Date.now();
  const adminId = req.user.id;
  const productId = req.params.id;

  console.log(`✅ [ADMIN APPROVE] Starting approval of product ${productId} by admin ${adminId}`);

  try {
    // Validate request body
    const { error: validationError, value: validatedData } = reviewSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (validationError) {
      const errorMessages = validationError.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
    }

    // Approve the product
    const result = await ProductApprovalService.approveProduct(
      productId,
      adminId,
      validatedData.review_reason
    );

    const duration = Date.now() - startTime;
    console.log(`✅ [ADMIN APPROVE] Successfully approved product ${productId} in ${duration}ms`);

    res.json({
      success: true,
      message: 'Product approved successfully',
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [ADMIN APPROVE] Error approving product ${productId} after ${duration}ms:`, error);
    
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('already') ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to approve product'
    });
  }
});

// POST /api/admin/products/:id/reject - Reject a pending product
router.post('/products/:id/reject', async (req, res) => {
  const startTime = Date.now();
  const adminId = req.user.id;
  const productId = req.params.id;

  console.log(`❌ [ADMIN REJECT] Starting rejection of product ${productId} by admin ${adminId}`);

  try {
    // Validate request body
    const { error: validationError, value: validatedData } = reviewSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (validationError) {
      const errorMessages = validationError.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
    }

    // Require reason for rejection
    if (!validatedData.review_reason || validatedData.review_reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required and must be at least 5 characters'
      });
    }

    // Reject the product
    const result = await ProductApprovalService.rejectProduct(
      productId,
      adminId,
      validatedData.review_reason
    );

    const duration = Date.now() - startTime;
    console.log(`❌ [ADMIN REJECT] Successfully rejected product ${productId} in ${duration}ms`);

    res.json({
      success: true,
      message: 'Product rejected successfully',
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [ADMIN REJECT] Error rejecting product ${productId} after ${duration}ms:`, error);
    
    const statusCode = error.message.includes('not found') ? 404 : 
                      error.message.includes('already') ? 409 : 500;
    
    res.status(statusCode).json({
      success: false,
      error: error.message || 'Failed to reject product'
    });
  }
});

// POST /api/admin/products/bulk-approve - Bulk approve multiple products
router.post('/products/bulk-approve', async (req, res) => {
  const startTime = Date.now();
  const adminId = req.user.id;

  console.log(`✅ [ADMIN BULK APPROVE] Starting bulk approval by admin ${adminId}`);

  try {
    // Validate request body
    const { error: validationError, value: validatedData } = bulkActionSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (validationError) {
      const errorMessages = validationError.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
    }

    // Bulk approve products
    const result = await ProductApprovalService.bulkApprove(
      validatedData.product_ids,
      adminId,
      validatedData.review_reason
    );

    const duration = Date.now() - startTime;
    console.log(`✅ [ADMIN BULK APPROVE] Processed ${validatedData.product_ids.length} products in ${duration}ms`);
    console.log(`✅ [ADMIN BULK APPROVE] Success: ${result.successful.length}, Failed: ${result.failed.length}`);

    res.json({
      success: true,
      message: `Bulk approval completed. ${result.successful.length} successful, ${result.failed.length} failed.`,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [ADMIN BULK APPROVE] Error in bulk approval after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to bulk approve products'
    });
  }
});

// POST /api/admin/products/bulk-reject - Bulk reject multiple products
router.post('/products/bulk-reject', async (req, res) => {
  const startTime = Date.now();
  const adminId = req.user.id;

  console.log(`❌ [ADMIN BULK REJECT] Starting bulk rejection by admin ${adminId}`);

  try {
    // Validate request body
    const { error: validationError, value: validatedData } = bulkActionSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (validationError) {
      const errorMessages = validationError.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
    }

    // Require reason for bulk rejection
    if (!validatedData.review_reason || validatedData.review_reason.trim().length < 5) {
      return res.status(400).json({
        success: false,
        error: 'Rejection reason is required for bulk rejection and must be at least 5 characters'
      });
    }

    // Bulk reject products
    const result = await ProductApprovalService.bulkReject(
      validatedData.product_ids,
      adminId,
      validatedData.review_reason
    );

    const duration = Date.now() - startTime;
    console.log(`❌ [ADMIN BULK REJECT] Processed ${validatedData.product_ids.length} products in ${duration}ms`);
    console.log(`❌ [ADMIN BULK REJECT] Success: ${result.successful.length}, Failed: ${result.failed.length}`);

    res.json({
      success: true,
      message: `Bulk rejection completed. ${result.successful.length} successful, ${result.failed.length} failed.`,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [ADMIN BULK REJECT] Error in bulk rejection after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to bulk reject products'
    });
  }
});

module.exports = router;
