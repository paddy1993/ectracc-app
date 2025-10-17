// Performance Metrics Middleware
const cacheService = require('../services/cacheService');

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byEndpoint: {},
        byMethod: {},
        byStatus: {}
      },
      responseTimes: {
        total: 0,
        count: 0,
        min: Infinity,
        max: 0,
        byEndpoint: {}
      },
      errors: {
        total: 0,
        byType: {},
        byEndpoint: {}
      },
      cache: {
        enabled: true
      }
    };
    
    this.startTime = Date.now();
  }

  /**
   * Record request metrics
   */
  recordRequest(method, endpoint) {
    this.metrics.requests.total++;
    
    // By method
    this.metrics.requests.byMethod[method] = 
      (this.metrics.requests.byMethod[method] || 0) + 1;
    
    // By endpoint
    this.metrics.requests.byEndpoint[endpoint] = 
      (this.metrics.requests.byEndpoint[endpoint] || 0) + 1;
  }

  /**
   * Record response metrics
   */
  recordResponse(endpoint, statusCode, responseTime) {
    // By status code
    const statusRange = `${Math.floor(statusCode / 100)}xx`;
    this.metrics.requests.byStatus[statusRange] = 
      (this.metrics.requests.byStatus[statusRange] || 0) + 1;

    // Response times
    this.metrics.responseTimes.total += responseTime;
    this.metrics.responseTimes.count++;
    this.metrics.responseTimes.min = Math.min(this.metrics.responseTimes.min, responseTime);
    this.metrics.responseTimes.max = Math.max(this.metrics.responseTimes.max, responseTime);

    // By endpoint
    if (!this.metrics.responseTimes.byEndpoint[endpoint]) {
      this.metrics.responseTimes.byEndpoint[endpoint] = {
        total: 0,
        count: 0,
        avg: 0
      };
    }
    
    const endpointMetrics = this.metrics.responseTimes.byEndpoint[endpoint];
    endpointMetrics.total += responseTime;
    endpointMetrics.count++;
    endpointMetrics.avg = Math.round(endpointMetrics.total / endpointMetrics.count);
  }

  /**
   * Record error
   */
  recordError(endpoint, errorType) {
    this.metrics.errors.total++;
    
    this.metrics.errors.byType[errorType] = 
      (this.metrics.errors.byType[errorType] || 0) + 1;
    
    this.metrics.errors.byEndpoint[endpoint] = 
      (this.metrics.errors.byEndpoint[endpoint] || 0) + 1;
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.metrics.responseTimes.count > 0
      ? Math.round(this.metrics.responseTimes.total / this.metrics.responseTimes.count)
      : 0;

    // Get cache stats
    const cacheStats = cacheService.getStats();

    // Calculate requests per minute
    const requestsPerMinute = Math.round(
      (this.metrics.requests.total / uptime) * 60000
    );

    // Get top endpoints by request count
    const topEndpoints = Object.entries(this.metrics.requests.byEndpoint)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([endpoint, count]) => ({ endpoint, count }));

    // Get slowest endpoints
    const slowestEndpoints = Object.entries(this.metrics.responseTimes.byEndpoint)
      .sort(([, a], [, b]) => b.avg - a.avg)
      .slice(0, 10)
      .map(([endpoint, stats]) => ({ 
        endpoint, 
        avgResponseTime: stats.avg,
        requests: stats.count
      }));

    return {
      uptime: {
        ms: uptime,
        formatted: this.formatUptime(uptime)
      },
      requests: {
        total: this.metrics.requests.total,
        perMinute: requestsPerMinute,
        byMethod: this.metrics.requests.byMethod,
        byStatus: this.metrics.requests.byStatus,
        topEndpoints
      },
      responseTimes: {
        avg: avgResponseTime,
        min: this.metrics.responseTimes.min === Infinity ? 0 : this.metrics.responseTimes.min,
        max: this.metrics.responseTimes.max,
        slowestEndpoints
      },
      errors: {
        total: this.metrics.errors.total,
        rate: this.metrics.requests.total > 0
          ? ((this.metrics.errors.total / this.metrics.requests.total) * 100).toFixed(2) + '%'
          : '0%',
        byType: this.metrics.errors.byType,
        byEndpoint: this.metrics.errors.byEndpoint
      },
      cache: cacheStats,
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
        external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
      }
    };
  }

  /**
   * Format uptime in human-readable format
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      requests: {
        total: 0,
        byEndpoint: {},
        byMethod: {},
        byStatus: {}
      },
      responseTimes: {
        total: 0,
        count: 0,
        min: Infinity,
        max: 0,
        byEndpoint: {}
      },
      errors: {
        total: 0,
        byType: {},
        byEndpoint: {}
      },
      cache: {
        enabled: true
      }
    };
    
    this.startTime = Date.now();
    cacheService.resetStats();
  }
}

// Create singleton instance
const metricsCollector = new MetricsCollector();

/**
 * Express middleware to collect metrics
 */
const metricsMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Normalize endpoint (remove IDs and params)
  const endpoint = req.route 
    ? req.baseUrl + req.route.path
    : req.path;
  
  // Record request
  metricsCollector.recordRequest(req.method, endpoint);

  // Intercept response
  const originalSend = res.send;
  res.send = function(data) {
    const responseTime = Date.now() - startTime;
    
    // Record response
    metricsCollector.recordResponse(endpoint, res.statusCode, responseTime);
    
    // Record errors (4xx and 5xx)
    if (res.statusCode >= 400) {
      const errorType = res.statusCode >= 500 ? 'server_error' : 'client_error';
      metricsCollector.recordError(endpoint, errorType);
    }
    
    // Add response time header
    res.set('X-Response-Time', `${responseTime}ms`);
    
    // Call original send
    originalSend.call(this, data);
  };

  next();
};

/**
 * Get metrics endpoint handler
 */
const getMetricsHandler = (req, res) => {
  try {
    const metrics = metricsCollector.getMetrics();
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Metrics] Error getting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve metrics'
    });
  }
};

/**
 * Reset metrics endpoint handler
 */
const resetMetricsHandler = (req, res) => {
  try {
    metricsCollector.reset();
    
    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    console.error('[Metrics] Error resetting metrics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset metrics'
    });
  }
};

module.exports = {
  metricsMiddleware,
  getMetricsHandler,
  resetMetricsHandler,
  metricsCollector
};

