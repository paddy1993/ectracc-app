/**
 * Logger utility to handle console statements in development vs production
 * Only logs in development mode to keep production console clean
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  log: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  warn: (...args: any[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  
  // Always log errors, even in production
  error: (...args: any[]) => {
    console.error(...args);
  },
  
  // Always log info messages
  info: (...args: any[]) => {
    console.info(...args);
  }
};

export default logger;

