/**
 * Security Configuration
 * Centralized security settings and validation rules
 */

const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Security headers configuration
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://*.supabase.co", "https://*.mongodb.net"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for OAuth
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

// Rate limiting configurations
const rateLimitConfigs = {
  // General API rate limit
  general: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
      success: false,
      error: 'Too many requests from this IP, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Authentication endpoints (stricter)
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 auth requests per windowMs
    message: {
      success: false,
      error: 'Too many authentication attempts, please try again later.',
      retryAfter: '15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Profile updates (moderate)
  profile: rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // Limit each IP to 10 profile updates per windowMs
    message: {
      success: false,
      error: 'Too many profile update attempts, please try again later.',
      retryAfter: '5 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
  }),

  // Data tracking endpoints
  tracking: rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // Limit each IP to 30 tracking requests per minute
    message: {
      success: false,
      error: 'Too many tracking requests, please slow down.',
      retryAfter: '1 minute'
    },
    standardHeaders: true,
    legacyHeaders: false,
  })
};

// Input sanitization helpers
const sanitizeInput = {
  // Remove potentially dangerous characters
  cleanString: (str) => {
    if (typeof str !== 'string') return str;
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim();
  },

  // Clean object recursively
  cleanObject: (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const cleaned = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        cleaned[key] = sanitizeInput.cleanString(value);
      } else if (typeof value === 'object' && value !== null) {
        cleaned[key] = sanitizeInput.cleanObject(value);
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
};

// Security middleware factory
const createSecurityMiddleware = (type = 'general') => {
  return [
    securityHeaders,
    rateLimitConfigs[type] || rateLimitConfigs.general,
    // Input sanitization middleware
    (req, res, next) => {
      if (req.body && typeof req.body === 'object') {
        req.body = sanitizeInput.cleanObject(req.body);
      }
      if (req.query && typeof req.query === 'object') {
        req.query = sanitizeInput.cleanObject(req.query);
      }
      next();
    }
  ];
};

// Environment validation
const validateEnvironment = () => {
  const requiredEnvVars = [
    'SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NODE_ENV'
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Validate Supabase URL format
  if (!process.env.SUPABASE_URL.startsWith('https://')) {
    throw new Error('SUPABASE_URL must be a valid HTTPS URL');
  }

  // Validate JWT key format (basic check)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY.length < 100) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY appears to be too short - please verify it\'s correct');
  }
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://ectracc.com',
      'https://www.ectracc.com',
      'https://ectracc-frontend-98lwkkrir-patricks-projects-4f53934e.vercel.app',
      ...(process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [])
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`🚫 CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400 // 24 hours
};

module.exports = {
  securityHeaders,
  rateLimitConfigs,
  sanitizeInput,
  createSecurityMiddleware,
  validateEnvironment,
  corsOptions
};
