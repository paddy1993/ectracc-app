/**
 * Structured Logger
 * Provides consistent, structured logging across the application
 */

class StructuredLogger {
  constructor() {
    this.serviceName = 'ectracc-backend';
    this.version = process.env.npm_package_version || '1.0.0';
    this.environment = process.env.NODE_ENV || 'development';
  }

  /**
   * Create a structured log entry
   */
  createLogEntry(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      service: this.serviceName,
      version: this.version,
      environment: this.environment,
      message,
      ...metadata
    };

    // Add request context if available
    if (metadata.req) {
      logEntry.request = {
        method: metadata.req.method,
        url: metadata.req.url,
        userAgent: metadata.req.get('User-Agent'),
        ip: metadata.req.ip || metadata.req.connection.remoteAddress,
        userId: metadata.req.user?.id
      };
      delete logEntry.req; // Remove the raw request object
    }

    // Add error details if available
    if (metadata.error && metadata.error instanceof Error) {
      logEntry.error = {
        name: metadata.error.name,
        message: metadata.error.message,
        stack: this.environment === 'development' ? metadata.error.stack : undefined
      };
      delete logEntry.error; // Remove the raw error object
    }

    return logEntry;
  }

  /**
   * Format log entry for output
   */
  formatLogEntry(logEntry) {
    if (this.environment === 'production') {
      // JSON format for production (easier for log aggregation)
      return JSON.stringify(logEntry);
    } else {
      // Human-readable format for development
      const { timestamp, level, message, ...metadata } = logEntry;
      let formatted = `[${level}] ${timestamp} - ${message}`;
      
      if (Object.keys(metadata).length > 0) {
        formatted += `\n  Metadata: ${JSON.stringify(metadata, null, 2)}`;
      }
      
      return formatted;
    }
  }

  /**
   * Log info level messages
   */
  info(message, metadata = {}) {
    const logEntry = this.createLogEntry('info', message, metadata);
    console.log(this.formatLogEntry(logEntry));
  }

  /**
   * Log error level messages
   */
  error(message, metadata = {}) {
    const logEntry = this.createLogEntry('error', message, metadata);
    console.error(this.formatLogEntry(logEntry));
  }

  /**
   * Log warning level messages
   */
  warn(message, metadata = {}) {
    const logEntry = this.createLogEntry('warn', message, metadata);
    console.warn(this.formatLogEntry(logEntry));
  }

  /**
   * Log debug level messages (development only)
   */
  debug(message, metadata = {}) {
    if (this.environment !== 'production') {
      const logEntry = this.createLogEntry('debug', message, metadata);
      console.log(this.formatLogEntry(logEntry));
    }
  }

  /**
   * Log HTTP requests
   */
  logRequest(req, res, responseTime) {
    const metadata = {
      req,
      responseTime: `${responseTime}ms`,
      statusCode: res.statusCode,
      contentLength: res.get('Content-Length')
    };

    const level = res.statusCode >= 400 ? 'warn' : 'info';
    const message = `${req.method} ${req.url} - ${res.statusCode} (${responseTime}ms)`;
    
    this[level](message, metadata);
  }

  /**
   * Log database operations
   */
  logDatabase(operation, collection, metadata = {}) {
    this.debug(`Database ${operation}`, {
      operation,
      collection,
      ...metadata
    });
  }

  /**
   * Log authentication events
   */
  logAuth(event, userId, metadata = {}) {
    this.info(`Authentication ${event}`, {
      event,
      userId,
      ...metadata
    });
  }

  /**
   * Log security events
   */
  logSecurity(event, metadata = {}) {
    this.warn(`Security event: ${event}`, {
      event,
      ...metadata
    });
  }

  /**
   * Log performance metrics
   */
  logPerformance(operation, duration, metadata = {}) {
    const level = duration > 1000 ? 'warn' : 'info'; // Warn if operation takes > 1s
    this[level](`Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      ...metadata
    });
  }
}

// Create and export singleton instance
const logger = new StructuredLogger();

// Add middleware for request logging
logger.middleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request start
  logger.debug('Request started', { req });
  
  // Override res.end to log when request completes
  const originalEnd = res.end;
  res.end = function(...args) {
    const responseTime = Date.now() - startTime;
    logger.logRequest(req, res, responseTime);
    originalEnd.apply(this, args);
  };
  
  next();
};

module.exports = logger;



