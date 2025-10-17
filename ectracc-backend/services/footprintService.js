// Footprint Service - Business logic for carbon footprint tracking
const footprintRepository = require('../repositories/footprintRepository');
const cacheService = require('./cacheService');

class FootprintService {
  /**
   * Track new footprint entry
   * @param {string} userId - User ID
   * @param {object} footprintData - Footprint data
   * @returns {Promise<object>} Created footprint
   */
  async trackFootprint(userId, footprintData) {
    try {
      const entry = {
        user_id: userId,
        manual_item: footprintData.manual_item || null,
        product_barcode: footprintData.product_barcode || null,
        carbon_footprint: parseFloat(footprintData.carbon_footprint),
        quantity: parseFloat(footprintData.quantity) || 1,
        unit: footprintData.unit || 'g',
        category: footprintData.category,
        date_added: footprintData.logged_at ? new Date(footprintData.logged_at) : new Date()
      };

      const result = await footprintRepository.create(entry);

      // Invalidate user's footprint caches
      await this.clearUserCache(userId);

      return this.formatFootprint(result);
    } catch (error) {
      console.error('[FootprintService] Error tracking footprint:', error);
      throw error;
    }
  }

  /**
   * Get user footprint history
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<object>} Paginated history
   */
  async getHistory(userId, options = {}) {
    try {
      const cacheKey = `footprints:history:${userId}:${JSON.stringify(options)}`;
      
      // Check cache (2 minute TTL for history)
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        console.log(`[FootprintService] Cache HIT for history: ${userId}`);
        return cached;
      }

      console.log(`[FootprintService] Cache MISS for history: ${userId}`);

      const {
        page = 1,
        limit = 50,
        startDate,
        endDate,
        category
      } = options;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const entries = await footprintRepository.getUserEntries(userId, {
        limit: parseInt(limit),
        skip,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        category
      });

      const total = await footprintRepository.countUserEntries(userId, {
        ...(startDate && { date_added: { $gte: new Date(startDate) } }),
        ...(endDate && { date_added: { $lte: new Date(endDate) } }),
        ...(category && { category })
      });

      const result = {
        entries: entries.map(e => this.formatFootprint(e)),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit)),
          hasMore: skip + entries.length < total
        }
      };

      // Cache for 2 minutes
      await cacheService.set(cacheKey, result, 120);

      return result;
    } catch (error) {
      console.error('[FootprintService] Error getting history:', error);
      throw error;
    }
  }

  /**
   * Get user footprint summary
   * @param {string} userId - User ID
   * @param {string} timeframe - Timeframe (day, week, month, year, all)
   * @returns {Promise<object>} Summary statistics
   */
  async getSummary(userId, timeframe = 'all') {
    try {
      const cacheKey = `footprints:summary:${userId}:${timeframe}`;
      
      // Check cache (5 minute TTL)
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Calculate date range
      const { startDate, endDate } = this.calculateDateRange(timeframe);

      // Get aggregated data
      const summary = await footprintRepository.getUserSummary(userId, startDate, endDate);

      const result = {
        timeframe,
        totalFootprint: Math.round(summary.totalFootprint * 100) / 100,
        totalEntries: summary.totalEntries,
        avgFootprint: Math.round(summary.avgFootprint * 100) / 100,
        maxFootprint: Math.round(summary.maxFootprint * 100) / 100,
        minFootprint: Math.round(summary.minFootprint * 100) / 100,
        startDate: startDate ? startDate.toISOString() : null,
        endDate: endDate ? endDate.toISOString() : null
      };

      // Cache for 5 minutes
      await cacheService.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      console.error('[FootprintService] Error getting summary:', error);
      throw error;
    }
  }

  /**
   * Get footprint trends
   * @param {string} userId - User ID
   * @param {string} period - Period (daily, weekly, monthly)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<object[]>} Trend data
   */
  async getTrends(userId, period = 'daily', startDate, endDate) {
    try {
      const cacheKey = `footprints:trends:${userId}:${period}:${startDate}:${endDate}`;
      
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const groupBy = period === 'monthly' ? 'month' : period === 'weekly' ? 'week' : 'day';
      
      const trends = await footprintRepository.getTrends(
        userId,
        groupBy,
        new Date(startDate),
        new Date(endDate)
      );

      // Cache for 5 minutes
      await cacheService.set(cacheKey, trends, 300);

      return trends;
    } catch (error) {
      console.error('[FootprintService] Error getting trends:', error);
      throw error;
    }
  }

  /**
   * Get category breakdown
   * @param {string} userId - User ID
   * @param {string} timeframe - Timeframe
   * @returns {Promise<object[]>} Category breakdown
   */
  async getCategoryBreakdown(userId, timeframe = 'all') {
    try {
      const cacheKey = `footprints:categories:${userId}:${timeframe}`;
      
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const { startDate, endDate } = this.calculateDateRange(timeframe);

      const breakdown = await footprintRepository.getCategoryBreakdown(userId, startDate, endDate);

      // Cache for 5 minutes
      await cacheService.set(cacheKey, breakdown, 300);

      return breakdown;
    } catch (error) {
      console.error('[FootprintService] Error getting category breakdown:', error);
      throw error;
    }
  }

  /**
   * Delete footprint entry
   * @param {string} footprintId - Footprint ID
   * @param {string} userId - User ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteFootprint(footprintId, userId) {
    try {
      const deleted = await footprintRepository.delete(footprintId, userId);
      
      if (deleted) {
        // Invalidate caches
        await this.clearUserCache(userId);
      }

      return deleted;
    } catch (error) {
      console.error('[FootprintService] Error deleting footprint:', error);
      throw error;
    }
  }

  /**
   * Format footprint for API response
   * @param {object} footprint - Raw footprint data
   * @returns {object} Formatted footprint
   */
  formatFootprint(footprint) {
    if (!footprint) return null;

    return {
      id: footprint._id?.toString(),
      userId: footprint.user_id,
      item: footprint.manual_item || footprint.product_barcode,
      barcode: footprint.product_barcode,
      carbonFootprint: footprint.carbon_footprint,
      quantity: footprint.quantity,
      unit: footprint.unit,
      category: footprint.category,
      totalCarbon: Math.round(footprint.carbon_footprint * footprint.quantity * 100) / 100,
      dateAdded: footprint.date_added,
      createdAt: footprint.created_at
    };
  }

  /**
   * Calculate date range for timeframe
   * @param {string} timeframe - Timeframe string
   * @returns {object} Start and end dates
   */
  calculateDateRange(timeframe) {
    const now = new Date();
    let startDate = null;
    const endDate = now;

    switch (timeframe) {
      case 'day':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'all':
      default:
        startDate = null;
    }

    return { startDate, endDate };
  }

  /**
   * Validate footprint data
   * @param {object} footprintData - Footprint data to validate
   * @returns {object} Validation result
   */
  validateFootprintData(footprintData) {
    const errors = [];

    // Either manual_item or product_barcode required
    if (!footprintData.manual_item && !footprintData.product_barcode) {
      errors.push('Either manual_item or product_barcode is required');
    }

    // Carbon footprint validation
    if (!footprintData.carbon_footprint) {
      errors.push('carbon_footprint is required');
    } else {
      const carbon = parseFloat(footprintData.carbon_footprint);
      if (isNaN(carbon) || carbon < 0) {
        errors.push('carbon_footprint must be a positive number');
      }
    }

    // Quantity validation
    if (footprintData.quantity) {
      const quantity = parseFloat(footprintData.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        errors.push('quantity must be a positive number');
      }
    }

    // Category validation
    if (!footprintData.category) {
      errors.push('category is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Clear user footprint cache
   * @param {string} userId - User ID
   */
  async clearUserCache(userId) {
    try {
      await cacheService.delPattern(`footprints:*:${userId}:*`);
      console.log(`[FootprintService] Cleared cache for user: ${userId}`);
    } catch (error) {
      console.error('[FootprintService] Error clearing user cache:', error);
    }
  }
}

// Export singleton instance
module.exports = new FootprintService();

