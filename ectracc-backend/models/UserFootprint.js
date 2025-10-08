// User Footprint Model for tracking user's carbon footprint entries
const { getMongoCollection } = require('../config/mongodb');

class UserFootprint {
  constructor() {
    this.collection = null;
  }

  getCollection() {
    if (!this.collection) {
      this.collection = getMongoCollection('user_footprints');
    }
    return this.collection;
  }

  // Add product to user's footprint
  async addEntry(userId, entryData) {
    try {
      const footprints = this.getCollection();
      const entry = {
        user_id: userId,
        product_id: entryData.product_id,
        product_name: entryData.product_name,
        carbon_footprint: entryData.carbon_footprint,
        carbon_footprint_per_unit: entryData.carbon_footprint_per_unit || entryData.carbon_footprint,
        quantity: entryData.quantity || 1,
        unit: entryData.unit || 'item',
        source: entryData.source || 'database',
        source_reference: entryData.source_reference || null,
        categories: entryData.categories || [],
        brands: entryData.brands || [],
        date_added: new Date(),
        created_at: new Date()
      };
      
      const result = await footprints.insertOne(entry);
      return this.formatEntry({ ...entry, _id: result.insertedId });
    } catch (error) {
      console.error('Error adding footprint entry:', error);
      throw error;
    }
  }

  // Get user's footprint entries
  async getUserEntries(userId, options = {}) {
    try {
      const footprints = this.getCollection();
      const {
        limit = 50,
        skip = 0,
        startDate = null,
        endDate = null,
        sortBy = 'date_added',
        sortOrder = -1
      } = options;

      // Build date filter
      const filter = { user_id: userId };
      if (startDate || endDate) {
        filter.date_added = {};
        if (startDate) filter.date_added.$gte = new Date(startDate);
        if (endDate) filter.date_added.$lte = new Date(endDate);
      }

      const results = await footprints
        .find(filter)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(limit)
        .toArray();

      return results.map(entry => this.formatEntry(entry));
    } catch (error) {
      console.error('Error getting user footprint entries:', error);
      throw error;
    }
  }

  // Get user's footprint summary
  async getUserSummary(userId, timeframe = 'all') {
    try {
      const footprints = this.getCollection();
      
      // Calculate date range based on timeframe
      let startDate = null;
      const now = new Date();
      
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
        case 'ytd':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
          break;
        default:
          startDate = null;
      }

      const filter = { user_id: userId };
      if (startDate) {
        filter.date_added = { $gte: startDate };
      }

      const pipeline = [
        { $match: filter },
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
          minFootprint: 0,
          timeframe
        };
      }

      const summary = result[0];
      return {
        totalFootprint: Math.round(summary.totalFootprint * 100) / 100,
        totalEntries: summary.totalEntries,
        avgFootprint: Math.round(summary.avgFootprint * 100) / 100,
        maxFootprint: Math.round(summary.maxFootprint * 100) / 100,
        minFootprint: Math.round(summary.minFootprint * 100) / 100,
        timeframe
      };
    } catch (error) {
      console.error('Error getting user footprint summary:', error);
      throw error;
    }
  }

  // Get user's footprint by time periods (for charts)
  async getUserFootprintByPeriod(userId, period = 'day', limit = 30) {
    try {
      const footprints = this.getCollection();
      
      let groupBy;
      switch (period) {
        case 'day':
          groupBy = {
            year: { $year: '$date_added' },
            month: { $month: '$date_added' },
            day: { $dayOfMonth: '$date_added' }
          };
          break;
        case 'week':
          groupBy = {
            year: { $year: '$date_added' },
            week: { $week: '$date_added' }
          };
          break;
        case 'month':
          groupBy = {
            year: { $year: '$date_added' },
            month: { $month: '$date_added' }
          };
          break;
        default:
          groupBy = {
            year: { $year: '$date_added' },
            month: { $month: '$date_added' },
            day: { $dayOfMonth: '$date_added' }
          };
      }

      const pipeline = [
        { $match: { user_id: userId } },
        {
          $group: {
            _id: groupBy,
            totalFootprint: { $sum: { $multiply: ['$carbon_footprint', '$quantity'] } },
            entryCount: { $sum: 1 },
            date: { $first: '$date_added' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.week': -1 } },
        { $limit: limit }
      ];

      const results = await footprints.aggregate(pipeline).toArray();
      
      return results.map(result => ({
        period: result._id,
        totalFootprint: Math.round(result.totalFootprint * 100) / 100,
        entryCount: result.entryCount,
        date: result.date
      }));
    } catch (error) {
      console.error('Error getting user footprint by period:', error);
      throw error;
    }
  }

  // Get entry by ID
  async getEntryById(entryId) {
    try {
      const footprints = this.getCollection();
      const entry = await footprints.findOne({ _id: entryId });
      
      if (entry) {
        return this.formatEntry(entry);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting footprint entry by ID:', error);
      throw error;
    }
  }

  // Update entry
  async updateEntry(entryId, userId, updateData) {
    try {
      const footprints = this.getCollection();
      const result = await footprints.updateOne(
        { _id: entryId, user_id: userId },
        { 
          $set: {
            ...updateData,
            updated_at: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Footprint entry not found or access denied');
      }
      
      return await this.getEntryById(entryId);
    } catch (error) {
      console.error('Error updating footprint entry:', error);
      throw error;
    }
  }

  // Delete entry
  async deleteEntry(entryId, userId) {
    try {
      const footprints = this.getCollection();
      const result = await footprints.deleteOne({ _id: entryId, user_id: userId });
      
      if (result.deletedCount === 0) {
        throw new Error('Footprint entry not found or access denied');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting footprint entry:', error);
      throw error;
    }
  }

  // Format entry for API response
  formatEntry(entry) {
    if (!entry) return null;

    return {
      id: entry._id,
      user_id: entry.user_id,
      product_id: entry.product_id,
      product_name: entry.product_name,
      carbon_footprint: entry.carbon_footprint,
      carbon_footprint_per_unit: entry.carbon_footprint_per_unit,
      quantity: entry.quantity,
      unit: entry.unit,
      total_footprint: Math.round(entry.carbon_footprint * entry.quantity * 100) / 100,
      source: entry.source,
      source_reference: entry.source_reference,
      categories: entry.categories || [],
      brands: entry.brands || [],
      date_added: entry.date_added,
      created_at: entry.created_at,
      updated_at: entry.updated_at
    };
  }

  // Create indexes for the collection
  async createIndexes() {
    try {
      const footprints = this.getCollection();
      
      // Create indexes for efficient querying
      await footprints.createIndex({ user_id: 1, date_added: -1 });
      await footprints.createIndex({ user_id: 1, product_id: 1 });
      await footprints.createIndex({ date_added: -1 });
      
      console.log('✅ User footprints indexes created');
    } catch (error) {
      console.error('Error creating user footprints indexes:', error);
      throw error;
    }
  }

  // Get global statistics
  async getGlobalStats() {
    try {
      const footprints = this.getCollection();
      
      const totalEntries = await footprints.countDocuments();
      const uniqueUsers = await footprints.distinct('user_id');
      
      const pipeline = [
        {
          $group: {
            _id: null,
            totalFootprint: { $sum: { $multiply: ['$carbon_footprint', '$quantity'] } },
            avgFootprint: { $avg: { $multiply: ['$carbon_footprint', '$quantity'] } }
          }
        }
      ];

      const result = await footprints.aggregate(pipeline).toArray();
      const stats = result[0] || { totalFootprint: 0, avgFootprint: 0 };
      
      return {
        totalEntries,
        uniqueUsers: uniqueUsers.length,
        totalFootprint: Math.round(stats.totalFootprint * 100) / 100,
        avgFootprint: Math.round(stats.avgFootprint * 100) / 100
      };
    } catch (error) {
      console.error('Error getting global footprint stats:', error);
      throw error;
    }
  }
}

module.exports = new UserFootprint();
