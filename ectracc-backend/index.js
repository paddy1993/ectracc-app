require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const { createSecurityMiddleware, corsOptions, validateEnvironment } = require('./config/security');

const { connectMongoDB, initializeSupabase, supabaseHealthCheck } = require('./config/database');
const { mongoHealthCheck } = require('./config/mongodb');
const productsRouter = require('./routes/products');
const betaRouter = require('./routes/beta');
const analyticsRouter = require('./routes/analytics');
const feedbackRouter = require('./routes/feedback');
const baseComponentsRouter = require('./routes/base-components');
const footprintsRouter = require('./routes/footprints');
const userFootprintsRouter = require('./routes/user-footprints');
const pendingProductsRouter = require('./routes/pending-products');
const adminRouter = require('./routes/admin');
const notificationsRouter = require('./routes/notifications');
const logger = require('./utils/logger');
const { metricsMiddleware, getMetricsHandler, resetMetricsHandler } = require('./middleware/metrics');
const { requireAdmin } = require('./middleware/adminAuth');

const app = express();
const PORT = process.env.PORT || 10000;

// Validate environment variables on startup
try {
  validateEnvironment();
  logger.info('✅ Environment validation passed');
} catch (error) {
  logger.error('❌ Environment validation failed:', error.message);
  process.exit(1);
}

// Apply security middleware (includes helmet, rate limiting, input sanitization)
app.use(createSecurityMiddleware('general'));

// CORS configuration
app.use(cors(corsOptions));

// Body parsing middleware
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('combined'));

// Metrics collection middleware
app.use(metricsMiddleware);

// Health check endpoint with comprehensive service status
app.get('/api/healthcheck', async (req, res) => {
  const startTime = Date.now();
  
  try {
    console.log('🔍 [HEALTH CHECK] Starting comprehensive health check...');
    
    // Check MongoDB health
    const mongoHealth = await mongoHealthCheck();
    console.log('📊 [HEALTH CHECK] MongoDB status:', mongoHealth.status);
    
    // Check Supabase health
    const supabaseHealth = await supabaseHealthCheck();
    console.log('📊 [HEALTH CHECK] Supabase status:', supabaseHealth.status);
    
    const healthStatus = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '2.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        mongodb: {
          status: mongoHealth.status,
          details: mongoHealth.stats || mongoHealth.error || null
        },
        supabase: {
          status: supabaseHealth.status,
          details: supabaseHealth.profilesTable || supabaseHealth.error || null
        }
      },
      database: {
        mongodb: mongoHealth.stats || null,
        supabase: supabaseHealth.profilesTable ? 'profiles table accessible' : 'profiles table not accessible'
      },
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      responseTime: Date.now() - startTime + 'ms'
    };

    // Determine overall status based on both services
    const mongoOk = mongoHealth.status === 'connected';
    const supabaseOk = supabaseHealth.status === 'connected';
    const overallStatus = mongoOk && supabaseOk ? 200 : 503;
    
    console.log(`📊 [HEALTH CHECK] Overall status: ${overallStatus} (MongoDB: ${mongoOk}, Supabase: ${supabaseOk})`);

    res.status(overallStatus).json({
      success: overallStatus === 200,
      message: 'ECTRACC API with MongoDB and Supabase',
      data: healthStatus
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [HEALTH CHECK] Health check failed after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: error.message,
      responseTime: duration + 'ms'
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

// Render health check endpoint (expected at /healthz)
app.get('/healthz', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Metrics endpoints (admin only)
app.get('/api/metrics', requireAdmin, getMetricsHandler);
app.post('/api/metrics/reset', requireAdmin, resetMetricsHandler);

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/beta', betaRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/base-components', baseComponentsRouter);
app.use('/api/footprints', footprintsRouter);
app.use('/api/user-footprints', userFootprintsRouter);
app.use('/api/pending-products', pendingProductsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/notifications', notificationsRouter);

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
    logger.info('🚀 Starting ECTRACC Backend API v2.0.0...');
    logger.info('🔧 MongoDB URI configured:', process.env.MONGODB_URI ? 'YES' : 'NO');
    logger.info('🔧 MongoDB Database:', process.env.MONGODB_DATABASE);
    
    // Initialize database connections
    logger.info('📦 Connecting to MongoDB...');
    await connectMongoDB();
    logger.info('✅ MongoDB connected successfully');
    
    logger.info('🔐 Initializing Supabase...');
    const supabaseConnected = await initializeSupabase();
    if (supabaseConnected) {
      logger.info('✅ Supabase connected successfully');
    } else {
      logger.warn('⚠️ Supabase connection failed - some features may not work');
    }
    
    // Start the server
    logger.info(`🚀 Starting server on port ${PORT}...`);
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/api/healthcheck`);
      logger.info(`🎯 Week 2: Real Product Database Integration with Carbon Data - COMPLETE`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      logger.error('❌ Server error:', error);
      process.exit(1);
    });
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    logger.error('❌ Error details:', error.stack);
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