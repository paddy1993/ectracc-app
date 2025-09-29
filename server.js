// Root server that starts the backend
require('dotenv').config();

// Set the working directory environment for the backend
process.env.NODE_PATH = __dirname;

// Import and start the backend
console.log('🚀 Starting ECTRACC from root directory...');
require('./ectracc-backend/index.js');
