// Root server that starts the backend
require('dotenv').config({ path: './ectracc-backend/.env.development' });

// Set the working directory environment for the backend
process.env.NODE_PATH = __dirname;

console.log('🚀 Starting ECTRACC from root directory...');
console.log('📍 Current directory:', __dirname);
console.log('🔧 Environment variables:');
console.log('  - NODE_ENV:', process.env.NODE_ENV);
console.log('  - PORT:', process.env.PORT);
console.log('  - MONGODB_URI:', process.env.MONGODB_URI ? 'SET' : 'NOT SET');
console.log('  - MONGODB_DATABASE:', process.env.MONGODB_DATABASE);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

const startApp = async () => {
  try {
    // Import the backend module
    console.log('📦 Loading backend module...');
    const backendApp = require('./ectracc-backend/index.js');
    console.log('✅ Backend module loaded successfully');
    
    // Import database functions
    const { connectMongoDB, initializeSupabase } = require('./ectracc-backend/config/database');
    
    // Initialize database connections
    console.log('📦 Connecting to MongoDB...');
    await connectMongoDB();
    console.log('✅ MongoDB connected successfully');
    
    console.log('🔐 Initializing Supabase...');
    initializeSupabase();
    console.log('✅ Supabase initialized');
    
    // Start the server
    console.log('🚀 Starting server...');
    const PORT = process.env.PORT || 10000;
    
    const server = backendApp.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/healthcheck`);
      console.log(`🎯 Week 2: Real Product Database Integration - LIVE!`);
    });
    
    // Handle server errors
    server.on('error', (error) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });
    
  } catch (error) {
    console.error('❌ Failed to start app:', error);
    console.error('❌ Error details:', error.stack);
    process.exit(1);
  }
};

// Start the application
startApp();
