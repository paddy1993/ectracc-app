// App Constants
export const APP_NAME = 'ECTRACC';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Carbon Footprint Tracking PWA';

// Colors for theming
export const COLORS = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3'
};

// API endpoints
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ectracc-backend.onrender.com/api';

// PWA configuration
export const PWA_CONFIG = {
  THEME_COLOR: '#4CAF50',
  BACKGROUND_COLOR: '#ffffff',
  START_URL: '/',
  SCOPE: '/',
  DISPLAY: 'standalone'
};

// Cache keys for offline functionality
export const CACHE_KEYS = {
  APP_SHELL: 'ectracc-app-shell-v1',
  API_CACHE: 'ectracc-api-cache-v1',
  STATIC_CACHE: 'ectracc-static-v1'
};



