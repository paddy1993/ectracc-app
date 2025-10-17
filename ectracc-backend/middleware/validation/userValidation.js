// User Validation Middleware
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
 * Profile update validation schema
 */
const profileUpdateSchema = Joi.object({
  full_name: Joi.string().min(1).max(100).pattern(/^[a-zA-Z\s'-]+$/).optional(),
  avatar_url: Joi.string().uri().optional(),
  bio: Joi.string().max(500).optional(),
  location: Joi.string().max(100).optional(),
  carbon_goal: Joi.number().min(0).max(10000).optional()
});

/**
 * Middleware exports
 */
module.exports = {
  validateProfileUpdate: validate(profileUpdateSchema)
};

