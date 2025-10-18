// Offline Sync Utilities for ECTRACC PWA
import { TrackFootprintForm } from '../types';
import logger from '../utils/logger';

export class OfflineSyncManager {
  private static instance: OfflineSyncManager;
  private isOnline: boolean = navigator.onLine;
  private listeners: Array<(isOnline: boolean) => void> = [];

  private constructor() {
    this.setupOnlineListeners();
    this.setupServiceWorkerListener();
  }

  static getInstance(): OfflineSyncManager {
    if (!OfflineSyncManager.instance) {
      OfflineSyncManager.instance = new OfflineSyncManager();
    }
    return OfflineSyncManager.instance;
  }

  private setupOnlineListeners() {
    window.addEventListener('online', () => {
      logger.log('App is back online');
      this.isOnline = true;
      this.notifyListeners();
      this.notifyServiceWorker();
    });

    window.addEventListener('offline', () => {
      logger.log('App is offline');
      this.isOnline = false;
      this.notifyListeners();
    });
  }

  private setupServiceWorkerListener() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'SYNC_SUCCESS') {
          logger.log('Background sync completed:', event.data);
          this.notifyListeners();
        }
      });
    }
  }

  private notifyServiceWorker() {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'ONLINE' });
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline));
  }

  // Add listener for online/offline status changes
  addOnlineListener(listener: (isOnline: boolean) => void) {
    this.listeners.push(listener);
    // Immediately notify with current status
    listener(this.isOnline);
  }

  removeOnlineListener(listener: (isOnline: boolean) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  // Check if app is currently online
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  // Queue footprint for offline sync
  async queueFootprint(footprint: TrackFootprintForm): Promise<boolean> {
    // Don't try to fetch - we already know we're offline
    // Instead, store directly to IndexedDB for service worker sync
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['footprint-queue'], 'readwrite');
      const store = transaction.objectStore('footprint-queue');
      
      const queueItem = {
        id: `offline-${Date.now()}`,
        data: footprint,
        timestamp: Date.now(),
        synced: false
      };
      
      await new Promise((resolve, reject) => {
        const request = store.add(queueItem);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      
      logger.log('[OfflineSync] Footprint queued for sync:', queueItem.id);
      
      // Register background sync if available
      await this.registerBackgroundSync();
      
      return true;
    } catch (error) {
      console.error('[OfflineSync] Failed to queue footprint:', error);
      return false;
    }
  }

  // Get pending queue count (approximation)
  async getPendingQueueCount(): Promise<number> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction(['footprint-queue'], 'readonly');
      const store = transaction.objectStore('footprint-queue');
      const countRequest = store.count();

      return new Promise((resolve) => {
        countRequest.onsuccess = () => resolve(countRequest.result);
        countRequest.onerror = () => resolve(0);
      });
    } catch (error) {
      console.error('Error getting queue count:', error);
      return 0;
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('ectracc-offline', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Register for background sync
  async registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('footprint-sync');
        logger.log('Background sync registered');
      } catch (error) {
        console.error('Background sync registration failed:', error);
      }
    }
  }

  // Show offline status to user
  showOfflineStatus(): void {
    if (!this.isOnline) {
      // You can integrate this with your app's notification system
      logger.log('App is in offline mode. Data will sync when connection is restored.');
    }
  }
}

// Utility function to check if app is running in standalone mode (PWA)
export function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true ||
    document.referrer.includes('android-app://') ||
    window.location.search.includes('utm_source=homescreen')
  );
}

// Utility function to check if app is running in native wrapper
export function isNativeWrapper(): boolean {
  return !!(window as any).ReactNativeWebView || !!(window as any).expo;
}

// Get app environment info
export function getAppEnvironment(): 'web' | 'pwa' | 'native' {
  if (isNativeWrapper()) return 'native';
  if (isStandalone()) return 'pwa';
  return 'web';
}

export default OfflineSyncManager;



