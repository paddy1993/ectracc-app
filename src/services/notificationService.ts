import logger from '../utils/logger';

// Push Notification Service for ECTRACC PWA
class NotificationService {
  private vapidPublicKey = process.env.REACT_APP_VAPID_PUBLIC_KEY || '';
  private subscription: PushSubscription | null = null;

  // Initialize push notifications
  async initialize(): Promise<boolean> {
    try {
      // Check if notifications are supported
      if (!('Notification' in window)) {
        logger.log('This browser does not support notifications');
        return false;
      }

      // Check if service worker is supported
      if (!('serviceWorker' in navigator)) {
        logger.log('This browser does not support service workers');
        return false;
      }

      // Check if push messaging is supported
      if (!('PushManager' in window)) {
        logger.log('This browser does not support push messaging');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<NotificationPermission> {
    try {
      const permission = await Notification.requestPermission();
      logger.log('Notification permission:', permission);
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // Subscribe to push notifications
  async subscribe(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      const existingSubscription = await registration.pushManager.getSubscription();
      if (existingSubscription) {
        this.subscription = existingSubscription;
        return existingSubscription;
      }

      // Create new subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
      });

      this.subscription = subscription;
      
      // Send subscription to server (mock for now)
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Error subscribing to push notifications:', error);
      return null;
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe(): Promise<boolean> {
    try {
      if (this.subscription) {
        await this.subscription.unsubscribe();
        this.subscription = null;
        
        // Remove subscription from server (mock for now)
        await this.removeSubscriptionFromServer();
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  // Check if user is subscribed
  async isSubscribed(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // Show local notification
  async showLocalNotification(title: string, options: NotificationOptions = {}): Promise<void> {
    try {
      const permission = await this.requestPermission();
      
      if (permission === 'granted') {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification(title, {
          body: options.body || '',
          icon: options.icon || '/logo192.png',
          badge: options.badge || '/logo192.png',
          tag: options.tag || 'ectracc-notification',
          data: options.data || {},
          actions: options.actions || [
            {
              action: 'open',
              title: 'Open App'
            },
            {
              action: 'dismiss',
              title: 'Dismiss'
            }
          ],
          ...options
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Schedule goal reminder notifications
  async scheduleGoalReminders(): Promise<void> {
    try {
      // Mock goal reminders - in production, this would be handled by the backend
      const reminders = [
        {
          title: '🌱 Daily Carbon Check-in',
          body: 'How\'s your carbon footprint today? Log your activities!',
          delay: 24 * 60 * 60 * 1000, // 24 hours
          tag: 'daily-checkin'
        },
        {
          title: '📊 Weekly Progress Update',
          body: 'Check your weekly carbon footprint progress and goals!',
          delay: 7 * 24 * 60 * 60 * 1000, // 7 days
          tag: 'weekly-progress'
        },
        {
          title: '🎯 Goal Achievement',
          body: 'You\'re close to achieving your carbon reduction goal!',
          delay: 3 * 24 * 60 * 60 * 1000, // 3 days
          tag: 'goal-achievement'
        }
      ];

      for (const reminder of reminders) {
        setTimeout(() => {
          this.showLocalNotification(reminder.title, {
            body: reminder.body,
            tag: reminder.tag,
            requireInteraction: true
          });
        }, reminder.delay);
      }
    } catch (error) {
      console.error('Error scheduling goal reminders:', error);
    }
  }

  // Send test notification
  async sendTestNotification(): Promise<void> {
    await this.showLocalNotification('🌍 ECTRACC Test', {
      body: 'Push notifications are working! You\'ll receive reminders about your carbon goals.',
      tag: 'test-notification',
      requireInteraction: true,
      actions: [
        {
          action: 'dashboard',
          title: 'View Dashboard'
        },
        {
          action: 'dismiss',
          title: 'Got it!'
        }
      ]
    });
  }

  // Utility: Convert VAPID key
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Mock: Send subscription to server
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // In production, send to your backend API
      logger.log('Sending subscription to server:', subscription);
      
      // Mock API call
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.toJSON(),
          userId: 'current-user-id' // Get from auth context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }
    } catch (error) {
      logger.log('Mock subscription sent (backend not implemented):', error);
    }
  }

  // Mock: Remove subscription from server
  private async removeSubscriptionFromServer(): Promise<void> {
    try {
      // In production, send to your backend API
      logger.log('Removing subscription from server');
      
      // Mock API call
      const response = await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: 'current-user-id' // Get from auth context
        })
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }
    } catch (error) {
      logger.log('Mock subscription removed (backend not implemented):', error);
    }
  }

  // Notification templates
  static templates = {
    dailyReminder: {
      title: '🌱 Daily Carbon Check-in',
      body: 'Don\'t forget to log your daily activities and track your carbon footprint!',
      tag: 'daily-reminder'
    },
    goalAchieved: {
      title: '🎉 Goal Achieved!',
      body: 'Congratulations! You\'ve reached your carbon reduction goal!',
      tag: 'goal-achieved'
    },
    weeklyReport: {
      title: '📊 Weekly Carbon Report',
      body: 'Your weekly carbon footprint report is ready. See how you\'re doing!',
      tag: 'weekly-report'
    },
    productScanned: {
      title: '✅ Product Scanned',
      body: 'Product added to your carbon footprint tracking!',
      tag: 'product-scanned'
    },
    offlineSync: {
      title: '🔄 Data Synced',
      body: 'Your offline data has been synced successfully!',
      tag: 'offline-sync'
    }
  };
}

// Export singleton instance
export const notificationService = new NotificationService();
export default notificationService;
