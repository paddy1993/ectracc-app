// Notification Service - Handles sending notifications to users
const { createClient } = require('@supabase/supabase-js');

class NotificationService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  /**
   * Send a product approval/rejection notification to a user
   */
  async sendProductApprovalNotification(userId, productName, status, reason = null) {
    try {
      console.log(`🔔 [NOTIFICATION] Sending ${status} notification for "${productName}" to user ${userId}`);

      const isApproved = status === 'approved';
      
      const notification = {
        user_id: userId,
        title: isApproved ? 'Product Approved!' : 'Product Submission Update',
        message: isApproved 
          ? `Your submitted product "${productName}" has been approved and is now available to all users.`
          : `Your submitted product "${productName}" was not approved. ${reason ? `Reason: ${reason}` : ''}`,
        type: isApproved ? 'product_approved' : 'product_rejected',
        metadata: {
          product_name: productName,
          approval_status: status,
          review_reason: reason
        }
      };

      const { data, error } = await this.supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) {
        console.error('❌ [NOTIFICATION] Error creating notification:', error);
        throw error;
      }

      console.log(`✅ [NOTIFICATION] Created notification with ID: ${data.id}`);
      return data;

    } catch (error) {
      console.error('❌ [NOTIFICATION] Error sending product approval notification:', error);
      throw error;
    }
  }

  /**
   * Send a general notification to a user
   */
  async sendNotification(userId, title, message, type = 'info', metadata = {}) {
    try {
      const notification = {
        user_id: userId,
        title,
        message,
        type,
        metadata
      };

      const { data, error } = await this.supabase
        .from('notifications')
        .insert([notification])
        .select()
        .single();

      if (error) {
        console.error('Error creating notification:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error sending notification:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   */
  async getUserNotifications(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        unreadOnly = false
      } = options;

      const offset = (page - 1) * limit;

      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (unreadOnly) {
        query = query.eq('is_read', false);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error getting user notifications:', error);
        throw error;
      }

      return {
        notifications: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .eq('user_id', userId) // Ensure user can only update their own notifications
        .select()
        .single();

      if (error) {
        console.error('Error marking notification as read:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error marking all notifications as read:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId) {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        console.error('Error getting unread notification count:', error);
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error('Error getting unread notification count:', error);
      return 0;
    }
  }

  /**
   * Delete a notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', userId); // Ensure user can only delete their own notifications

      if (error) {
        console.error('Error deleting notification:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotifications(notifications) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (error) {
        console.error('Error sending bulk notifications:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Clean up old notifications (older than 30 days)
   */
  async cleanupOldNotifications() {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString());

      if (error) {
        console.error('Error cleaning up old notifications:', error);
        throw error;
      }

      console.log('✅ [NOTIFICATION] Cleaned up old notifications');
      return true;
    } catch (error) {
      console.error('Error cleaning up old notifications:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService();
