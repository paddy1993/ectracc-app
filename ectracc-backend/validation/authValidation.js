const Joi = require('joi');

// Modern password validation following NIST and OWASP 2024 guidelines
const passwordValidation = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).*$/)
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
  });

// Common weak passwords to reject
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'welcome123', 'admin123', '12345678', 'password12',
  'iloveyou', 'princess', 'rockyou', '1234567', '12345'
];

// Enhanced password validation with common password check
const strongPasswordValidation = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]).*$/)
  .custom((value, helpers) => {
    if (COMMON_PASSWORDS.includes(value.toLowerCase())) {
      return helpers.error('password.common');
    }
    return value;
  })
  .messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.max': 'Password must not exceed 128 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'password.common': 'Password is too common, please choose a more unique password'
  });

// Email validation
const emailValidation = Joi.string()
  .email({ tlds: { allow: false } })
  .max(254)
  .required()
  .messages({
    'string.email': 'Please enter a valid email address',
    'string.max': 'Email address is too long',
    'any.required': 'Email address is required'
  });

// User registration validation schema
const registerValidation = Joi.object({
  email: emailValidation,
  password: strongPasswordValidation.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    }),
  firstName: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .optional()
    .messages({
      'string.min': 'First name is required',
      'string.max': 'First name is too long',
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  lastName: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .optional()
    .messages({
      'string.min': 'Last name is required',
      'string.max': 'Last name is too long',
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  acceptTerms: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must accept the terms of service',
      'any.required': 'Terms acceptance is required'
    })
});

// User login validation schema
const loginValidation = Joi.object({
  email: emailValidation,
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Password is required',
      'any.required': 'Password is required'
    })
});

// Password reset request validation
const passwordResetRequestValidation = Joi.object({
  email: emailValidation
});

// Password reset validation
const passwordResetValidation = Joi.object({
  token: Joi.string()
    .required()
    .messages({
      'any.required': 'Reset token is required'
    }),
  password: strongPasswordValidation.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});

// Profile update validation
const profileUpdateValidation = Joi.object({
  firstName: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .optional()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name is too long',
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  lastName: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .optional()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name is too long',
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  displayName: Joi.string()
    .min(1)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Display name cannot be empty',
      'string.max': 'Display name is too long'
    }),
  bio: Joi.string()
    .max(500)
    .optional()
    .messages({
      'string.max': 'Bio is too long (maximum 500 characters)'
    })
});

// Change password validation (for authenticated users)
const changePasswordValidation = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: strongPasswordValidation.required(),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});

/**
 * Validate password strength (for API responses)
 */
function validatePasswordStrength(password) {
  const result = strongPasswordValidation.validate(password);
  
  if (result.error) {
    return {
      isValid: false,
      errors: result.error.details.map(detail => detail.message)
    };
  }
  
  return {
    isValid: true,
    errors: []
  };
}

/**
 * Check if password is in common passwords list
 */
function isCommonPassword(password) {
  return COMMON_PASSWORDS.includes(password.toLowerCase());
}

module.exports = {
  passwordValidation,
  strongPasswordValidation,
  emailValidation,
  registerValidation,
  loginValidation,
  passwordResetRequestValidation,
  passwordResetValidation,
  profileUpdateValidation,
  changePasswordValidation,
  validatePasswordStrength,
  isCommonPassword,
  COMMON_PASSWORDS
};
