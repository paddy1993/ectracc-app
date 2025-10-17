// Product Validation Middleware
const Joi = require('joi');

/**
 * Validate middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: error.details.map(detail => detail.message)
      });
    }

    // Replace req.query with validated/sanitized values
    req.query = value;
    next();
  };
};

/**
 * Search query validation schema
 */
const searchSchema = Joi.object({
  q: Joi.string().min(0).max(100).optional().allow(''),
  category: Joi.string().max(50).optional(),
  brand: Joi.string().max(100).optional(),
  ecoScore: Joi.string().valid('a', 'b', 'c', 'd', 'e', 'A', 'B', 'C', 'D', 'E').optional(),
  ecoscore: Joi.string().valid('a', 'b', 'c', 'd', 'e', 'A', 'B', 'C', 'D', 'E').optional(),
  minCarbon: Joi.number().min(0).max(1000).optional(),
  maxCarbon: Joi.number().min(0).max(1000).optional(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  sort: Joi.string().valid('relevance', 'name_asc', 'eco_best', 'carbon_asc', 'carbon_desc').optional(),
  sortBy: Joi.string().valid('relevance', 'name_asc', 'eco_best', 'carbon_asc', 'carbon_desc').optional()
});

/**
 * Barcode validation schema
 */
const barcodeSchema = Joi.object({
  barcode: Joi.string().pattern(/^\d{8,13}$/).required()
});

/**
 * Random products validation schema
 */
const randomSchema = Joi.object({
  count: Joi.number().integer().min(1).max(50).default(10)
});

/**
 * Middleware exports
 */
module.exports = {
  validateSearch: validate(searchSchema),
  validateBarcode: (req, res, next) => {
    const { error } = barcodeSchema.validate({ barcode: req.params.barcode });
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Invalid barcode format',
        message: 'Barcode must be 8-13 digits'
      });
    }
    next();
  },
  validateRandom: validate(randomSchema)
};

