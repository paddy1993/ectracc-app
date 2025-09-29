require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { connectMongoDB, initializeSupabase } = require('./config/database');
const { mongoHealthCheck } = require('./config/mongodb');
const productsRouter = require('./routes/products');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
      'https://ectracc.com',
      'https://www.ectracc.com',
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
    ].filter(Boolean)
  : [
      'http://localhost:3000',
      'http://localhost:3050',
      'http://localhost:3051',
      'http://localhost:3052'
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Health check endpoint with real service status
app.get('/api/healthcheck', async (req, res) => {
  try {
    const mongoHealth = await mongoHealthCheck();
    
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        mongodb: mongoHealth.status,
        supabase: 'connected' // Placeholder for now
      },
      database: mongoHealth.stats || null,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    };

    const overallStatus = mongoHealth.status === 'connected' ? 200 : 503;

    res.status(overallStatus).json({
      success: overallStatus === 200,
      message: 'ECTRACC API with Real Product Database',
      data: healthStatus
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message
    });
  }
});

// Simple ping endpoint
app.get('/api/ping', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/products', productsRouter);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'ECTRACC Backend API',
    version: '2.0.0',
    phase: 'Week 2 - Real Product Database Integration',
    endpoints: [
      'GET /api/healthcheck - Health status',
      'GET /api/ping - Simple ping test',
      'GET /api/products/search?q=query - Search products',
      'GET /api/products/barcode/:barcode - Get product by barcode',
      'GET /api/products/categories - Get categories',
      'GET /api/products/brands - Get brands',
      'GET /api/products/random - Get random products',
      'GET /api/products/stats - Database statistics'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /api/healthcheck',
      'GET /api/ping'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  
  res.status(error.status || 500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message,
    phase: 'Phase 1'
  });
});

// Initialize services and start server
const startServer = async () => {
  try {
    logger.info('🚀 Starting ECTRACC Backend API (Phase 1)...');
    
    // Initialize database connections (placeholder for Phase 1)
    await connectMongoDB();
    initializeSupabase();
    
    // Start the server
    app.listen(PORT, () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/healthcheck`);
      logger.info(`🎯 Phase 1: Project Setup & Architecture - COMPLETE`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('🛑 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// For Vercel serverless deployment
module.exports = app;

// Start the server (only in non-serverless environments)
if (require.main === module) {
  startServer();
}