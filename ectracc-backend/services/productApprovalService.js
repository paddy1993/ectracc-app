// Product Approval Service - Handles the workflow for approving/rejecting user-submitted products
const PendingProduct = require('../models/PendingProduct');
const Product = require('../models/Product');
const UserFootprint = require('../models/UserFootprint');
const NotificationService = require('./notificationService');

class ProductApprovalService {
  
  /**
   * Approve a pending product and move it to the main products database
   */
  async approveProduct(pendingProductId, adminUserId, reviewReason = null) {
    try {
      console.log(`🔍 [APPROVAL] Starting approval process for product ${pendingProductId} by admin ${adminUserId}`);
      
      // Get the pending product
      const pendingProduct = await PendingProduct.getById(pendingProductId);
      if (!pendingProduct) {
        throw new Error('Pending product not found');
      }

      if (pendingProduct.status !== 'pending') {
        throw new Error(`Product already ${pendingProduct.status}`);
      }

      console.log(`📋 [APPROVAL] Found pending product: ${pendingProduct.product_name}`);

      // Create the approved product in main database
      const productData = {
        code: pendingProduct.barcode || `user_${Date.now()}`, // Generate code if no barcode
        product_name: pendingProduct.product_name,
        brands: pendingProduct.brands,
        categories: pendingProduct.categories,
        carbon_footprint: pendingProduct.carbon_footprint,
        carbon_footprint_source: pendingProduct.carbon_footprint_source || 'User Submitted',
        carbon_footprint_reference: pendingProduct.carbon_footprint_justification,
        product_type: 'food', // Default to food, could be enhanced later
        source_database: 'user_submitted',
        has_barcode: !!pendingProduct.barcode,
        is_user_submitted: true,
        approved_by: adminUserId,
        approved_at: new Date(),
        last_modified_t: Math.floor(Date.now() / 1000),
        imported_at: new Date().toISOString()
      };

      // Insert into main products collection
      const products = Product.getCollection();
      const insertResult = await products.insertOne(productData);
      const newProductId = insertResult.insertedId;

      console.log(`✅ [APPROVAL] Created new product with ID: ${newProductId}`);

      // Update the pending product status
      await PendingProduct.approveProduct(pendingProductId, adminUserId, reviewReason);

      // Update user's footprint entry if it exists
      if (pendingProduct.user_footprint_entry_id) {
        try {
          await this.updateUserFootprintEntry(
            pendingProduct.user_footprint_entry_id,
            newProductId,
            'approved'
          );
          console.log(`📊 [APPROVAL] Updated user footprint entry: ${pendingProduct.user_footprint_entry_id}`);
        } catch (error) {
          console.error('Error updating user footprint entry:', error);
          // Don't fail the approval if footprint update fails
        }
      }

      // Send notification to the user
      await NotificationService.sendProductApprovalNotification(
        pendingProduct.submitted_by,
        pendingProduct.product_name,
        'approved',
        reviewReason
      );

      console.log(`🔔 [APPROVAL] Sent approval notification to user: ${pendingProduct.submitted_by}`);

      return {
        approvedProduct: {
          id: newProductId,
          ...productData
        },
        pendingProduct: await PendingProduct.getById(pendingProductId)
      };

    } catch (error) {
      console.error('❌ [APPROVAL] Error approving product:', error);
      throw error;
    }
  }

  /**
   * Reject a pending product
   */
  async rejectProduct(pendingProductId, adminUserId, reviewReason) {
    try {
      console.log(`🔍 [REJECTION] Starting rejection process for product ${pendingProductId} by admin ${adminUserId}`);
      
      // Get the pending product
      const pendingProduct = await PendingProduct.getById(pendingProductId);
      if (!pendingProduct) {
        throw new Error('Pending product not found');
      }

      if (pendingProduct.status !== 'pending') {
        throw new Error(`Product already ${pendingProduct.status}`);
      }

      console.log(`📋 [REJECTION] Found pending product: ${pendingProduct.product_name}`);

      // Update the pending product status
      await PendingProduct.rejectProduct(pendingProductId, adminUserId, reviewReason);

      // Update user's footprint entry if it exists
      if (pendingProduct.user_footprint_entry_id) {
        try {
          await this.updateUserFootprintEntry(
            pendingProduct.user_footprint_entry_id,
            null,
            'rejected'
          );
          console.log(`📊 [REJECTION] Updated user footprint entry: ${pendingProduct.user_footprint_entry_id}`);
        } catch (error) {
          console.error('Error updating user footprint entry:', error);
          // Don't fail the rejection if footprint update fails
        }
      }

      // Send notification to the user
      await NotificationService.sendProductApprovalNotification(
        pendingProduct.submitted_by,
        pendingProduct.product_name,
        'rejected',
        reviewReason
      );

      console.log(`🔔 [REJECTION] Sent rejection notification to user: ${pendingProduct.submitted_by}`);

      return {
        rejectedProduct: await PendingProduct.getById(pendingProductId)
      };

    } catch (error) {
      console.error('❌ [REJECTION] Error rejecting product:', error);
      throw error;
    }
  }

  /**
   * Update user's footprint entry with approval status
   */
  async updateUserFootprintEntry(entryId, approvedProductId, status) {
    try {
      const footprints = UserFootprint.getCollection();
      const { ObjectId } = require('mongodb');

      const updateData = {
        approval_status: status,
        updated_at: new Date()
      };

      if (approvedProductId) {
        updateData.product_id = approvedProductId.toString();
        updateData.source = 'database'; // Change from 'user_submitted' to 'database'
      }

      await footprints.updateOne(
        { _id: new ObjectId(entryId) },
        { $set: updateData }
      );

    } catch (error) {
      console.error('Error updating user footprint entry:', error);
      throw error;
    }
  }

  /**
   * Get approval statistics for admin dashboard
   */
  async getApprovalStats() {
    try {
      const stats = await PendingProduct.getStats();
      
      // Add additional metrics
      const averageApprovalTime = await this.getAverageApprovalTime();
      
      return {
        ...stats,
        averageApprovalTime
      };
    } catch (error) {
      console.error('Error getting approval stats:', error);
      throw error;
    }
  }

  /**
   * Calculate average time between submission and approval/rejection
   */
  async getAverageApprovalTime() {
    try {
      const pendingProducts = PendingProduct.getCollection();
      
      const pipeline = [
        {
          $match: {
            status: { $in: ['approved', 'rejected'] },
            reviewed_at: { $exists: true },
            submitted_at: { $exists: true }
          }
        },
        {
          $addFields: {
            approvalTimeHours: {
              $divide: [
                { $subtract: ['$reviewed_at', '$submitted_at'] },
                1000 * 60 * 60 // Convert to hours
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            averageHours: { $avg: '$approvalTimeHours' },
            count: { $sum: 1 }
          }
        }
      ];

      const result = await pendingProducts.aggregate(pipeline).toArray();
      
      if (result.length > 0) {
        return {
          averageHours: Math.round(result[0].averageHours * 10) / 10,
          reviewedCount: result[0].count
        };
      }

      return {
        averageHours: 0,
        reviewedCount: 0
      };
    } catch (error) {
      console.error('Error calculating average approval time:', error);
      return {
        averageHours: 0,
        reviewedCount: 0
      };
    }
  }

  /**
   * Bulk approve multiple products
   */
  async bulkApprove(pendingProductIds, adminUserId, reviewReason = null) {
    const results = {
      successful: [],
      failed: []
    };

    for (const productId of pendingProductIds) {
      try {
        const result = await this.approveProduct(productId, adminUserId, reviewReason);
        results.successful.push({
          productId,
          result
        });
      } catch (error) {
        results.failed.push({
          productId,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Bulk reject multiple products
   */
  async bulkReject(pendingProductIds, adminUserId, reviewReason) {
    const results = {
      successful: [],
      failed: []
    };

    for (const productId of pendingProductIds) {
      try {
        const result = await this.rejectProduct(productId, adminUserId, reviewReason);
        results.successful.push({
          productId,
          result
        });
      } catch (error) {
        results.failed.push({
          productId,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new ProductApprovalService();
