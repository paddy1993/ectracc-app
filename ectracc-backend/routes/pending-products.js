// Pending Products API Routes - Handle user product submissions
const express = require('express');
const rateLimit = require('express-rate-limit');
const Joi = require('joi');
const { requireAuth } = require('../middleware/auth');
const PendingProduct = require('../models/PendingProduct');
const UserFootprint = require('../models/UserFootprint');
const Product = require('../models/Product');

const router = express.Router();

// Rate limiting for product submissions
const submissionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 submissions per hour per user
  message: {
    success: false,
    error: 'Too many product submissions. Please try again later.'
  },
  keyGenerator: (req) => req.user?.id || req.ip
});

// Validation schemas
const productSubmissionSchema = Joi.object({
  product_name: Joi.string()
    .trim()
    .min(2)
    .max(200)
    .required()
    .messages({
      'string.empty': 'Product name is required',
      'string.min': 'Product name must be at least 2 characters',
      'string.max': 'Product name must not exceed 200 characters'
    }),
  
  barcode: Joi.string()
    .trim()
    .pattern(/^[0-9]{8,14}$/)
    .optional()
    .allow(null, '')
    .messages({
      'string.pattern.base': 'Barcode must be 8-14 digits'
    }),
  
  brands: Joi.array()
    .items(Joi.string().trim().max(100))
    .max(5)
    .default([])
    .messages({
      'array.max': 'Maximum 5 brands allowed'
    }),
  
  categories: Joi.array()
    .items(Joi.string().trim().max(100))
    .max(10)
    .default([])
    .messages({
      'array.max': 'Maximum 10 categories allowed'
    }),
  
  carbon_footprint: Joi.number()
    .positive()
    .max(1000)
    .required()
    .messages({
      'number.positive': 'Carbon footprint must be positive',
      'number.max': 'Carbon footprint seems too high (max 1000 kg CO2e)',
      'any.required': 'Carbon footprint is required'
    }),
  
  carbon_footprint_source: Joi.string()
    .trim()
    .min(5)
    .max(500)
    .required()
    .messages({
      'string.min': 'Please provide more details about your carbon footprint source',
      'string.max': 'Carbon footprint source description too long',
      'any.required': 'Carbon footprint source is required'
    }),
  
  carbon_footprint_justification: Joi.string()
    .trim()
    .min(10)
    .max(1000)
    .required()
    .messages({
      'string.min': 'Please provide more details about how you calculated this carbon footprint',
      'string.max': 'Justification too long (max 1000 characters)',
      'any.required': 'Carbon footprint justification is required'
    }),
  
  user_footprint_entry_id: Joi.string()
    .optional()
    .allow(null, '')
});

// POST /api/pending-products - Submit a new product for review
router.post('/', submissionLimiter, requireAuth, async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;

  console.log(`📝 [PRODUCT SUBMISSION] Starting submission for user: ${userId}`);

  try {
    // Validate request body
    const { error: validationError, value: validatedData } = productSubmissionSchema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (validationError) {
      const errorMessages = validationError.details.map(detail => detail.message);
      console.log(`❌ [PRODUCT SUBMISSION] Validation failed:`, errorMessages);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errorMessages
      });
    }

    // Check if product already exists (by barcode or name)
    if (validatedData.barcode) {
      const existingProduct = await Product.findByBarcode(validatedData.barcode);
      if (existingProduct) {
        console.log(`❌ [PRODUCT SUBMISSION] Product already exists with barcode: ${validatedData.barcode}`);
        return res.status(409).json({
          success: false,
          error: 'A product with this barcode already exists in our database',
          existing_product: {
            id: existingProduct.id,
            name: existingProduct.product_name
          }
        });
      }
    }

    // Check for duplicate pending submissions by this user
    const userSubmissions = await PendingProduct.getUserSubmissions(userId, { status: 'pending' });
    const duplicateSubmission = userSubmissions.submissions.find(submission => 
      submission.product_name.toLowerCase() === validatedData.product_name.toLowerCase() ||
      (validatedData.barcode && submission.barcode === validatedData.barcode)
    );

    if (duplicateSubmission) {
      console.log(`❌ [PRODUCT SUBMISSION] Duplicate submission detected`);
      return res.status(409).json({
        success: false,
        error: 'You have already submitted this product for review',
        existing_submission: duplicateSubmission
      });
    }

    // Prepare submission data
    const submissionData = {
      ...validatedData,
      user_id: userId,
      submission_ip: req.ip,
      user_agent: req.get('User-Agent')
    };

    console.log(`📊 [PRODUCT SUBMISSION] Prepared submission data:`, {
      product_name: submissionData.product_name,
      barcode: submissionData.barcode,
      carbon_footprint: submissionData.carbon_footprint
    });

    // Submit the product for review
    const submission = await PendingProduct.submitProduct(submissionData);

    // If this submission is linked to a user footprint entry, update it
    if (validatedData.user_footprint_entry_id) {
      try {
        const footprints = UserFootprint.getCollection();
        const { ObjectId } = require('mongodb');
        
        await footprints.updateOne(
          { _id: new ObjectId(validatedData.user_footprint_entry_id) },
          { 
            $set: { 
              pending_submission_id: submission.id,
              approval_status: 'pending',
              updated_at: new Date()
            } 
          }
        );
        
        console.log(`📊 [PRODUCT SUBMISSION] Updated footprint entry: ${validatedData.user_footprint_entry_id}`);
      } catch (error) {
        console.error('Error updating footprint entry:', error);
        // Don't fail the submission if footprint update fails
      }
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [PRODUCT SUBMISSION] Successfully submitted product for user ${userId} in ${duration}ms`);

    res.status(201).json({
      success: true,
      message: 'Product submitted for review successfully',
      data: {
        submission,
        estimated_review_time: '1-3 business days'
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [PRODUCT SUBMISSION] Error submitting product for user ${userId} after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to submit product for review',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// GET /api/pending-products/my-submissions - Get user's submissions
router.get('/my-submissions', requireAuth, async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const status = req.query.status || null;

    console.log(`📋 [MY SUBMISSIONS] Getting submissions for user ${userId}, page ${page}`);

    const result = await PendingProduct.getUserSubmissions(userId, {
      page,
      limit,
      status
    });

    const duration = Date.now() - startTime;
    console.log(`✅ [MY SUBMISSIONS] Retrieved ${result.submissions.length} submissions in ${duration}ms`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [MY SUBMISSIONS] Error getting submissions for user ${userId} after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get your submissions'
    });
  }
});

// GET /api/pending-products/:id - Get specific submission details
router.get('/:id', requireAuth, async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const submissionId = req.params.id;

  try {
    console.log(`🔍 [SUBMISSION DETAILS] Getting submission ${submissionId} for user ${userId}`);

    const submission = await PendingProduct.getById(submissionId);
    
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'Submission not found'
      });
    }

    // Check if user owns this submission
    if (submission.submitted_by !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [SUBMISSION DETAILS] Retrieved submission details in ${duration}ms`);

    res.json({
      success: true,
      data: submission
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [SUBMISSION DETAILS] Error getting submission ${submissionId} after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get submission details'
    });
  }
});

module.exports = router;
