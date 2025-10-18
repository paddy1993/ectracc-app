// App Constants
export const APP_NAME = 'ECTRACC';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Carbon Footprint Tracking App';

// Brand Colors
export const COLORS = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#F44336',
  info: '#2196F3',
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121'
  }
};

// API configuration (platform will provide actual base URL)
export const API_CONFIG = {
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000
};

// Cache keys for offline functionality
export const CACHE_KEYS = {
  APP_SHELL: 'ectracc-app-shell-v1',
  API_CACHE: 'ectracc-api-cache-v1',
  STATIC_CACHE: 'ectracc-static-v1',
  USER_DATA: 'ectracc-user-data',
  FOOTPRINT_ENTRIES: 'ectracc-footprint-entries',
  PRODUCTS: 'ectracc-products'
};

// Offline sync configuration
export const SYNC_CONFIG = {
  MAX_RETRY_ATTEMPTS: 5,
  RETRY_DELAY: 2000,
  BATCH_SIZE: 50,
  SYNC_INTERVAL: 60000 // 1 minute
};

// Carbon footprint categories
export const FOOTPRINT_CATEGORIES = [
  { value: 'food', label: 'Food & Drink' },
  { value: 'transport', label: 'Transportation' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'shopping', label: 'Shopping & Goods' },
  { value: 'misc', label: 'Miscellaneous' }
] as const;

// Eco-score grades
export const ECO_SCORES = ['a', 'b', 'c', 'd', 'e'] as const;

// Goal timeframes
export const GOAL_TIMEFRAMES = ['weekly', 'monthly'] as const;

// Time period filters
export const TIME_PERIODS = ['week', 'month', 'year', 'all'] as const;

// Storage size limits (in bytes)
export const STORAGE_LIMITS = {
  MAX_OFFLINE_ENTRIES: 1000,
  MAX_CACHE_SIZE: 50 * 1024 * 1024, // 50 MB
  WARNING_THRESHOLD: 40 * 1024 * 1024 // 40 MB
};

// Feature flags (can be overridden per platform)
export const FEATURE_FLAGS = {
  OFFLINE_MODE: true,
  PUSH_NOTIFICATIONS: true,
  ANALYTICS: true,
  CRASH_REPORTING: true,
  BETA_FEATURES: false
};

