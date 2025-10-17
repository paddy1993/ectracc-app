// Footprint Repository - Data access for carbon footprint tracking
const { getMongoCollection } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

class FootprintRepository {
  constructor() {
    this.collection = null;
  }

  getCollection() {
    if (!this.collection) {
      this.collection = getMongoCollection('user_footprints');
    }
    return this.collection;
  }

  /**
   * Create footprint entry
   * @param {object} footprintData - Footprint data
   * @returns {Promise<object>} Created footprint
   */
  async create(footprintData) {
    try {
      const footprints = this.getCollection();
      
      const entry = {
        ...footprintData,
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await footprints.insertOne(entry);
      
      return {
        _id: result.insertedId,
        ...entry
      };
    } catch (error) {
      console.error('[FootprintRepository] Error creating footprint:', error);
      throw error;
    }
  }

  /**
   * Get user footprint entries with pagination
   * @param {string} userId - User ID
   * @param {object} options - Query options
   * @returns {Promise<object[]>} Footprint entries
   */
  async getUserEntries(userId, options = {}) {
    try {
      const footprints = this.getCollection();
      const {
        limit = 50,
        skip = 0,
        startDate = null,
        endDate = null,
        category = null
      } = options;

      const query = { user_id: userId };

      // Date range filter
      if (startDate || endDate) {
        query.date_added = {};
        if (startDate) query.date_added.$gte = new Date(startDate);
        if (endDate) query.date_added.$lte = new Date(endDate);
      }

      // Category filter
      if (category) {
        query.category = category;
      }

      const entries = await footprints
        .find(query)
        .sort({ date_added: -1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      return entries;
    } catch (error) {
      console.error('[FootprintRepository] Error getting user entries:', error);
      throw error;
    }
  }

  /**
   * Get aggregated summary for user
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date (optional)
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<object>} Aggregated summary
   */
  async getUserSummary(userId, startDate = null, endDate = null) {
    try {
      const footprints = this.getCollection();

      const matchStage = { user_id: userId };
      if (startDate || endDate) {
        matchStage.date_added = {};
        if (startDate) matchStage.date_added.$gte = startDate;
        if (endDate) matchStage.date_added.$lte = endDate;
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalFootprint: { $sum: { $multiply: ['$carbon_footprint', '$quantity'] } },
            totalEntries: { $sum: 1 },
            avgFootprint: { $avg: { $multiply: ['$carbon_footprint', '$quantity'] } },
            maxFootprint: { $max: { $multiply: ['$carbon_footprint', '$quantity'] } },
            minFootprint: { $min: { $multiply: ['$carbon_footprint', '$quantity'] } }
          }
        }
      ];

      const result = await footprints.aggregate(pipeline).toArray();

      if (result.length === 0) {
        return {
          totalFootprint: 0,
          totalEntries: 0,
          avgFootprint: 0,
          maxFootprint: 0,
          minFootprint: 0
        };
      }

      return result[0];
    } catch (error) {
      console.error('[FootprintRepository] Error getting user summary:', error);
      throw error;
    }
  }

  /**
   * Get footprint trends by day/week/month
   * @param {string} userId - User ID
   * @param {string} groupBy - Grouping period (day, week, month)
   * @param {Date} startDate - Start date
   * @param {Date} endDate - End date
   * @returns {Promise<object[]>} Trend data
   */
  async getTrends(userId, groupBy = 'day', startDate, endDate) {
    try {
      const footprints = this.getCollection();

      let dateFormat;
      switch (groupBy) {
        case 'week':
          dateFormat = '%Y-W%U';
          break;
        case 'month':
          dateFormat = '%Y-%m';
          break;
        case 'day':
        default:
          dateFormat = '%Y-%m-%d';
      }

      const pipeline = [
        {
          $match: {
            user_id: userId,
            date_added: {
              $gte: startDate,
              $lte: endDate
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: dateFormat, date: '$date_added' } },
            totalCarbon: { $sum: { $multiply: ['$carbon_footprint', '$quantity'] } },
            entryCount: { $sum: 1 },
            avgCarbon: { $avg: { $multiply: ['$carbon_footprint', '$quantity'] } }
          }
        },
        { $sort: { _id: 1 } }
      ];

      const results = await footprints.aggregate(pipeline).toArray();

      return results.map(r => ({
        period: r._id,
        totalCarbon: r.totalCarbon,
        entryCount: r.entryCount,
        avgCarbon: r.avgCarbon
      }));
    } catch (error) {
      console.error('[FootprintRepository] Error getting trends:', error);
      throw error;
    }
  }

  /**
   * Get category breakdown for user
   * @param {string} userId - User ID
   * @param {Date} startDate - Start date (optional)
   * @param {Date} endDate - End date (optional)
   * @returns {Promise<object[]>} Category breakdown
   */
  async getCategoryBreakdown(userId, startDate = null, endDate = null) {
    try {
      const footprints = this.getCollection();

      const matchStage = { user_id: userId };
      if (startDate || endDate) {
        matchStage.date_added = {};
        if (startDate) matchStage.date_added.$gte = startDate;
        if (endDate) matchStage.date_added.$lte = endDate;
      }

      const pipeline = [
        { $match: matchStage },
        {
          $group: {
            _id: '$category',
            totalCarbon: { $sum: { $multiply: ['$carbon_footprint', '$quantity'] } },
            count: { $sum: 1 }
          }
        },
        { $sort: { totalCarbon: -1 } }
      ];

      const results = await footprints.aggregate(pipeline).toArray();

      return results.map(r => ({
        category: r._id,
        totalCarbon: r.totalCarbon,
        count: r.count
      }));
    } catch (error) {
      console.error('[FootprintRepository] Error getting category breakdown:', error);
      throw error;
    }
  }

  /**
   * Count user entries
   * @param {string} userId - User ID
   * @param {object} filter - Optional filters
   * @returns {Promise<number>} Count
   */
  async countUserEntries(userId, filter = {}) {
    try {
      const footprints = this.getCollection();
      const query = { user_id: userId, ...filter };
      return await footprints.countDocuments(query);
    } catch (error) {
      console.error('[FootprintRepository] Error counting entries:', error);
      throw error;
    }
  }

  /**
   * Delete footprint entry
   * @param {string} footprintId - Footprint ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Promise<boolean>} Success status
   */
  async delete(footprintId, userId) {
    try {
      const footprints = this.getCollection();
      
      const result = await footprints.deleteOne({
        _id: new ObjectId(footprintId),
        user_id: userId
      });

      return result.deletedCount > 0;
    } catch (error) {
      console.error('[FootprintRepository] Error deleting footprint:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new FootprintRepository();

