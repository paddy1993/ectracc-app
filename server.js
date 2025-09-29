// Root server that imports the backend directly
require('dotenv').config();
const backendApp = require('./ectracc-backend/index.js');

// The backend app is already configured and exported
// This file just ensures it runs from the root directory
