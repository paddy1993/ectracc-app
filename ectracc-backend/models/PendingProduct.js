// Pending Product Model for user-submitted products awaiting admin approval
const { getMongoCollection } = require('../config/mongodb');

class PendingProduct {
  constructor() {
    this.collection = null;
  }

  getCollection() {
    if (!this.collection) {
      this.collection = getMongoCollection('pending_products');
    }
    return this.collection;
  }

  // Submit a new product for review
  async submitProduct(submissionData) {
    try {
      const pendingProducts = this.getCollection();
      
      const submission = {
        // Product information
        product_name: submissionData.product_name,
        barcode: submissionData.barcode || null,
        brands: submissionData.brands || [],
        categories: submissionData.categories || [],
        
        // Carbon footprint data
        carbon_footprint: submissionData.carbon_footprint,
        carbon_footprint_source: submissionData.carbon_footprint_source,
        carbon_footprint_justification: submissionData.carbon_footprint_justification,
        
        // Submission metadata
        submitted_by: submissionData.user_id,
        submitted_at: new Date(),
        status: 'pending', // 'pending', 'approved', 'rejected'
        
        // Admin review data (filled when reviewed)
        reviewed_by: null,
        reviewed_at: null,
        review_reason: null,
        
        // Link to user's footprint entry
        user_footprint_entry_id: submissionData.user_footprint_entry_id || null,
        
        // Additional metadata
        submission_ip: submissionData.submission_ip || null,
        user_agent: submissionData.user_agent || null,
        
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await pendingProducts.insertOne(submission);
      return this.formatSubmission({ ...submission, _id: result.insertedId });
    } catch (error) {
      console.error('Error submitting product for review:', error);
      throw error;
    }
  }

  // Get pending products for admin review
  async getPendingProducts(options = {}) {
    try {
      const pendingProducts = this.getCollection();
      const {
        page = 1,
        limit = 20,
        status = 'pending',
        sortBy = 'submitted_at',
        sortOrder = -1
      } = options;

      const skip = (page - 1) * limit;
      const sort = { [sortBy]: sortOrder };

      const query = status ? { status } : {};

      const [products, total] = await Promise.all([
        pendingProducts
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .toArray(),
        pendingProducts.countDocuments(query)
      ]);

      return {
        products: products.map(product => this.formatSubmission(product)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting pending products:', error);
      throw error;
    }
  }

  // Get a specific pending product by ID
  async getById(id) {
    try {
      const pendingProducts = this.getCollection();
      const { ObjectId } = require('mongodb');
      
      const product = await pendingProducts.findOne({ _id: new ObjectId(id) });
      return product ? this.formatSubmission(product) : null;
    } catch (error) {
      console.error('Error getting pending product by ID:', error);
      throw error;
    }
  }

  // Approve a pending product
  async approveProduct(id, adminUserId, reviewReason = null) {
    try {
      const pendingProducts = this.getCollection();
      const { ObjectId } = require('mongodb');

      const updateData = {
        status: 'approved',
        reviewed_by: adminUserId,
        reviewed_at: new Date(),
        review_reason: reviewReason,
        updated_at: new Date()
      };

      const result = await pendingProducts.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Pending product not found');
      }

      // Get the updated product
      const updatedProduct = await this.getById(id);
      return updatedProduct;
    } catch (error) {
      console.error('Error approving product:', error);
      throw error;
    }
  }

  // Reject a pending product
  async rejectProduct(id, adminUserId, reviewReason) {
    try {
      const pendingProducts = this.getCollection();
      const { ObjectId } = require('mongodb');

      const updateData = {
        status: 'rejected',
        reviewed_by: adminUserId,
        reviewed_at: new Date(),
        review_reason: reviewReason,
        updated_at: new Date()
      };

      const result = await pendingProducts.updateOne(
        { _id: new ObjectId(id) },
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        throw new Error('Pending product not found');
      }

      // Get the updated product
      const updatedProduct = await this.getById(id);
      return updatedProduct;
    } catch (error) {
      console.error('Error rejecting product:', error);
      throw error;
    }
  }

  // Get submission statistics for admin dashboard
  async getStats() {
    try {
      const pendingProducts = this.getCollection();

      const [
        totalSubmissions,
        pendingCount,
        approvedCount,
        rejectedCount,
        recentSubmissions
      ] = await Promise.all([
        pendingProducts.countDocuments(),
        pendingProducts.countDocuments({ status: 'pending' }),
        pendingProducts.countDocuments({ status: 'approved' }),
        pendingProducts.countDocuments({ status: 'rejected' }),
        pendingProducts.countDocuments({
          submitted_at: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      ]);

      // Get submissions by day for the last 30 days
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const submissionsByDay = await pendingProducts.aggregate([
        {
          $match: {
            submitted_at: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$submitted_at"
              }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { _id: 1 }
        }
      ]).toArray();

      return {
        totalSubmissions,
        pendingCount,
        approvedCount,
        rejectedCount,
        recentSubmissions,
        approvalRate: totalSubmissions > 0 ? Math.round((approvedCount / totalSubmissions) * 100) : 0,
        submissionsByDay: submissionsByDay.map(item => ({
          date: item._id,
          count: item.count
        }))
      };
    } catch (error) {
      console.error('Error getting pending product stats:', error);
      throw error;
    }
  }

  // Get user's submissions
  async getUserSubmissions(userId, options = {}) {
    try {
      const pendingProducts = this.getCollection();
      const {
        page = 1,
        limit = 10,
        status = null
      } = options;

      const skip = (page - 1) * limit;
      const query = { submitted_by: userId };
      
      if (status) {
        query.status = status;
      }

      const [submissions, total] = await Promise.all([
        pendingProducts
          .find(query)
          .sort({ submitted_at: -1 })
          .skip(skip)
          .limit(limit)
          .toArray(),
        pendingProducts.countDocuments(query)
      ]);

      return {
        submissions: submissions.map(submission => this.formatSubmission(submission)),
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user submissions:', error);
      throw error;
    }
  }

  // Format submission for API response
  formatSubmission(submission) {
    if (!submission) return null;

    return {
      id: submission._id,
      product_name: submission.product_name,
      barcode: submission.barcode,
      brands: submission.brands || [],
      categories: submission.categories || [],
      carbon_footprint: submission.carbon_footprint,
      carbon_footprint_source: submission.carbon_footprint_source,
      carbon_footprint_justification: submission.carbon_footprint_justification,
      submitted_by: submission.submitted_by,
      submitted_at: submission.submitted_at,
      status: submission.status,
      reviewed_by: submission.reviewed_by,
      reviewed_at: submission.reviewed_at,
      review_reason: submission.review_reason,
      user_footprint_entry_id: submission.user_footprint_entry_id,
      created_at: submission.created_at,
      updated_at: submission.updated_at
    };
  }
}

module.exports = new PendingProduct();
