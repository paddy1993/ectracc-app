// Footprint Validation Middleware
const Joi = require('joi');

/**
 * Validate middleware factory
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
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

    // Replace req.body with validated/sanitized values
    req.body = value;
    next();
  };
};

/**
 * Query validation for history
 */
const validateQuery = (schema) => {
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

    req.query = value;
    next();
  };
};

/**
 * Track footprint validation schema
 */
const trackFootprintSchema = Joi.object({
  manual_item: Joi.string().max(200).optional(),
  product_barcode: Joi.string().pattern(/^\d{8,13}$/).optional(),
  carbon_footprint: Joi.number().min(0).max(1000).required(),
  quantity: Joi.number().min(0.01).max(10000).default(1),
  unit: Joi.string().valid('g', 'kg', 'ml', 'l', 'oz', 'lb', 'unit').default('g'),
  category: Joi.string().max(50).required(),
  logged_at: Joi.date().iso().optional()
}).or('manual_item', 'product_barcode'); // At least one required

/**
 * History query validation schema
 */
const historyQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),
  startDate: Joi.date().iso().optional(),
  endDate: Joi.date().iso().optional(),
  category: Joi.string().max(50).optional()
});

/**
 * Summary query validation schema
 */
const summaryQuerySchema = Joi.object({
  timeframe: Joi.string().valid('day', 'week', 'month', 'year', 'all').default('all')
});

/**
 * Trends query validation schema
 */
const trendsQuerySchema = Joi.object({
  period: Joi.string().valid('daily', 'weekly', 'monthly').default('daily'),
  startDate: Joi.date().iso().required(),
  endDate: Joi.date().iso().required()
});

/**
 * Middleware exports
 */
module.exports = {
  validateTrackFootprint: validate(trackFootprintSchema),
  validateHistoryQuery: validateQuery(historyQuerySchema),
  validateSummaryQuery: validateQuery(summaryQuerySchema),
  validateTrendsQuery: validateQuery(trendsQuerySchema)
};

