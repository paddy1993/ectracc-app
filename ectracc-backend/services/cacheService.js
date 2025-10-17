// In-Memory Cache Service with LRU eviction
// Redis-compatible interface for easy migration later

class CacheService {
  constructor(maxSize = 500, defaultTTL = 300) {
    this.cache = new Map();
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // seconds
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      errors: 0
    };
    
    // Start cleanup interval (every 60 seconds)
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Get value from cache
   * @param {string} key - Cache key
   * @returns {Promise<any>} Cached value or null
   */
  async get(key) {
    try {
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.stats.misses++;
        return null;
      }

      // Check if expired
      if (Date.now() > entry.expiresAt) {
        this.cache.delete(key);
        this.stats.misses++;
        return null;
      }

      // Update access time for LRU
      entry.lastAccessed = Date.now();
      this.stats.hits++;
      
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, entry);
      
      return entry.value;
    } catch (error) {
      console.error('[CacheService] Error getting key:', key, error);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set value in cache
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} ttl - Time to live in seconds
   * @returns {Promise<boolean>} Success status
   */
  async set(key, value, ttl = null) {
    try {
      const timeToLive = ttl || this.defaultTTL;
      
      // Evict oldest entry if at max size
      if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
        this.evictOldest();
      }

      const entry = {
        value,
        expiresAt: Date.now() + (timeToLive * 1000),
        lastAccessed: Date.now(),
        createdAt: Date.now()
      };

      this.cache.set(key, entry);
      this.stats.sets++;
      
      return true;
    } catch (error) {
      console.error('[CacheService] Error setting key:', key, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete key from cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} Success status
   */
  async del(key) {
    try {
      return this.cache.delete(key);
    } catch (error) {
      console.error('[CacheService] Error deleting key:', key, error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Delete keys matching pattern
   * @param {string} pattern - Pattern to match (supports * wildcard)
   * @returns {Promise<number>} Number of keys deleted
   */
  async delPattern(pattern) {
    try {
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      let deleted = 0;
      
      for (const key of this.cache.keys()) {
        if (regex.test(key)) {
          this.cache.delete(key);
          deleted++;
        }
      }
      
      return deleted;
    } catch (error) {
      console.error('[CacheService] Error deleting pattern:', pattern, error);
      this.stats.errors++;
      return 0;
    }
  }

  /**
   * Clear all cache entries
   * @returns {Promise<boolean>} Success status
   */
  async clear() {
    try {
      this.cache.clear();
      return true;
    } catch (error) {
      console.error('[CacheService] Error clearing cache:', error);
      this.stats.errors++;
      return false;
    }
  }

  /**
   * Check if key exists in cache
   * @param {string} key - Cache key
   * @returns {Promise<boolean>} True if exists and not expired
   */
  async has(key) {
    const value = await this.get(key);
    return value !== null;
  }

  /**
   * Get cache statistics
   * @returns {object} Cache stats
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: `${hitRate}%`,
      totalRequests,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Reset cache statistics
   */
  resetStats() {
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      evictions: 0,
      errors: 0
    };
  }

  /**
   * Evict oldest (least recently used) entry
   */
  evictOldest() {
    if (this.cache.size === 0) return;
    
    // First key is the oldest due to Map's insertion order
    const firstKey = this.cache.keys().next().value;
    this.cache.delete(firstKey);
    this.stats.evictions++;
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[CacheService] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Estimate memory usage (rough approximation)
   * @returns {string} Memory usage in MB
   */
  estimateMemoryUsage() {
    let totalSize = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      try {
        const keySize = key.length * 2; // chars are 2 bytes
        const valueSize = JSON.stringify(entry.value).length * 2;
        totalSize += keySize + valueSize + 100; // +100 for metadata
      } catch (error) {
        // Skip if can't serialize
      }
    }
    
    return (totalSize / 1024 / 1024).toFixed(2) + ' MB';
  }

  /**
   * Get all keys matching pattern
   * @param {string} pattern - Pattern to match (supports * wildcard)
   * @returns {Promise<string[]>} Matching keys
   */
  async keys(pattern = '*') {
    try {
      if (pattern === '*') {
        return Array.from(this.cache.keys());
      }
      
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
      return Array.from(this.cache.keys()).filter(key => regex.test(key));
    } catch (error) {
      console.error('[CacheService] Error getting keys:', error);
      return [];
    }
  }

  /**
   * Graceful shutdown - cleanup interval
   */
  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    console.log('[CacheService] Cache service shut down. Final stats:', this.getStats());
  }
}

// Create singleton instance
const cacheService = new CacheService(500, 300);

// Graceful shutdown handling
process.on('SIGTERM', () => cacheService.shutdown());
process.on('SIGINT', () => cacheService.shutdown());

module.exports = cacheService;

