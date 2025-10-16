// Notifications API Routes - Handle user notifications
const express = require('express');
const rateLimit = require('express-rate-limit');
const { requireAuth } = require('../middleware/auth');
const NotificationService = require('../services/notificationService');

const router = express.Router();

// Rate limiting for notification operations
const notificationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 minutes
  message: {
    success: false,
    error: 'Too many notification requests. Please try again later.'
  }
});

// Apply authentication and rate limiting to all routes
router.use(requireAuth);
router.use(notificationLimiter);

// GET /api/notifications - Get user's notifications
router.get('/', async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;

  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const unreadOnly = req.query.unread_only === 'true';

    console.log(`📋 [NOTIFICATIONS] Getting notifications for user ${userId}, page ${page}, unread_only: ${unreadOnly}`);

    const result = await NotificationService.getUserNotifications(userId, {
      page,
      limit,
      unreadOnly
    });

    const duration = Date.now() - startTime;
    console.log(`✅ [NOTIFICATIONS] Retrieved ${result.notifications.length} notifications in ${duration}ms`);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [NOTIFICATIONS] Error getting notifications for user ${userId} after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get notifications'
    });
  }
});

// GET /api/notifications/unread-count - Get unread notification count
router.get('/unread-count', async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;

  try {
    console.log(`🔢 [UNREAD COUNT] Getting unread count for user ${userId}`);

    const count = await NotificationService.getUnreadCount(userId);

    const duration = Date.now() - startTime;
    console.log(`✅ [UNREAD COUNT] Retrieved count ${count} in ${duration}ms`);

    res.json({
      success: true,
      data: {
        unread_count: count
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [UNREAD COUNT] Error getting unread count for user ${userId} after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get unread count'
    });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const notificationId = req.params.id;

  try {
    console.log(`✅ [MARK READ] Marking notification ${notificationId} as read for user ${userId}`);

    const notification = await NotificationService.markAsRead(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [MARK READ] Marked notification as read in ${duration}ms`);

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: notification
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [MARK READ] Error marking notification ${notificationId} as read after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to mark notification as read'
    });
  }
});

// PUT /api/notifications/mark-all-read - Mark all notifications as read
router.put('/mark-all-read', async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;

  try {
    console.log(`✅ [MARK ALL READ] Marking all notifications as read for user ${userId}`);

    await NotificationService.markAllAsRead(userId);

    const duration = Date.now() - startTime;
    console.log(`✅ [MARK ALL READ] Marked all notifications as read in ${duration}ms`);

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [MARK ALL READ] Error marking all notifications as read for user ${userId} after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to mark all notifications as read'
    });
  }
});

// DELETE /api/notifications/:id - Delete a notification
router.delete('/:id', async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const notificationId = req.params.id;

  try {
    console.log(`🗑️ [DELETE NOTIFICATION] Deleting notification ${notificationId} for user ${userId}`);

    const success = await NotificationService.deleteNotification(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [DELETE NOTIFICATION] Deleted notification in ${duration}ms`);

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [DELETE NOTIFICATION] Error deleting notification ${notificationId} after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to delete notification'
    });
  }
});

// GET /api/notifications/:id - Get specific notification details
router.get('/:id', async (req, res) => {
  const startTime = Date.now();
  const userId = req.user.id;
  const notificationId = req.params.id;

  try {
    console.log(`🔍 [NOTIFICATION DETAILS] Getting notification ${notificationId} for user ${userId}`);

    // Get single notification (this is a simple implementation)
    const result = await NotificationService.getUserNotifications(userId, {
      page: 1,
      limit: 1
    });

    const notification = result.notifications.find(n => n.id === notificationId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: 'Notification not found'
      });
    }

    const duration = Date.now() - startTime;
    console.log(`✅ [NOTIFICATION DETAILS] Retrieved notification details in ${duration}ms`);

    res.json({
      success: true,
      data: notification
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [NOTIFICATION DETAILS] Error getting notification ${notificationId} after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get notification details'
    });
  }
});

module.exports = router;
