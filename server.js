// Root server that starts the backend
require('dotenv').config();

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

try {
  // Import and start the backend
  console.log('📦 Loading backend module...');
  require('./ectracc-backend/index.js');
  console.log('✅ Backend module loaded successfully');
} catch (error) {
  console.error('❌ Failed to load backend:', error);
  process.exit(1);
}
