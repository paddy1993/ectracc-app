/**
 * Advanced Offline Storage Service
 * Provides comprehensive offline data management using IndexedDB
 */

interface OfflineEntry {
  id: string;
  type: 'footprint' | 'product' | 'goal' | 'profile';
  data: any;
  timestamp: number;
  synced: boolean;
  lastModified: number;
}

interface SyncQueueItem {
  id: string;
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  headers?: Record<string, string>;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: number;
}

interface StorageUsage {
  used: number;
  quota: number;
  percentage: number;
}

class OfflineStorageService {
  private dbName = 'ectracc-offline';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor() {
    this.initDB();
  }

  /**
   * Public initialize method
   */
  async initialize(): Promise<boolean> {
    try {
      await this.initDB();
      return true;
    } catch (error) {
      console.error('Failed to initialize offline storage:', error);
      return false;
    }
  }

  /**
   * Initialize IndexedDB
   */
  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.error('Failed to open IndexedDB:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('IndexedDB initialized successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('offlineData')) {
          const offlineStore = db.createObjectStore('offlineData', { keyPath: 'id' });
          offlineStore.createIndex('type', 'type', { unique: false });
          offlineStore.createIndex('timestamp', 'timestamp', { unique: false });
          offlineStore.createIndex('synced', 'synced', { unique: false });
        }

        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('priority', 'priority', { unique: false });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
          syncStore.createIndex('retryCount', 'retryCount', { unique: false });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          cacheStore.createIndex('expiry', 'expiry', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }

        console.log('IndexedDB schema updated');
      };
    });
  }

  /**
   * Ensure database is ready
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initDB();
    }
    return this.db!;
  }

  /**
   * Store data offline
   */
  async storeData(type: OfflineEntry['type'], data: any, id?: string): Promise<string> {
    const db = await this.ensureDB();
    const entryId = id || this.generateId();
    
    const entry: OfflineEntry = {
      id: entryId,
      type,
      data,
      timestamp: Date.now(),
      synced: false,
      lastModified: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const request = store.put(entry);

      request.onsuccess = () => {
        console.log(`Stored offline ${type} data:`, entryId);
        resolve(entryId);
      };

      request.onerror = () => {
        console.error('Failed to store offline data:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get all offline data
   */
  async getData(type?: OfflineEntry['type']): Promise<OfflineEntry[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      
      let request: IDBRequest;
      if (type) {
        const index = store.index('type');
        request = index.getAll(type);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        const data = request.result.sort((a: any, b: any) => b.timestamp - a.timestamp);
        resolve(data);
      };

      request.onerror = () => {
        console.error('Failed to get offline data:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get specific offline entry
   */
  async getDataById(id: string): Promise<OfflineEntry | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readonly');
      const store = transaction.objectStore('offlineData');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        console.error('Failed to get offline entry:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update offline entry
   */
  async updateData(id: string, data: any): Promise<void> {
    const db = await this.ensureDB();
    const existing = await this.getDataById(id);
    
    if (!existing) {
      throw new Error(`Offline entry ${id} not found`);
    }

    const updated: OfflineEntry = {
      ...existing,
      data: { ...existing.data, ...data },
      lastModified: Date.now(),
      synced: false
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const request = store.put(updated);

      request.onsuccess = () => {
        console.log('Updated offline entry:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to update offline entry:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Mark entry as synced
   */
  async markAsSynced(id: string): Promise<void> {
    const db = await this.ensureDB();
    const existing = await this.getDataById(id);
    
    if (!existing) {
      return;
    }

    const updated: OfflineEntry = {
      ...existing,
      synced: true,
      lastModified: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const request = store.put(updated);

      request.onsuccess = () => {
        console.log('Marked as synced:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to mark as synced:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete offline entry
   */
  async deleteData(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData'], 'readwrite');
      const store = transaction.objectStore('offlineData');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Deleted offline entry:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to delete offline entry:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Add item to sync queue
   */
  async addToSyncQueue(
    url: string,
    method: SyncQueueItem['method'],
    data?: any,
    headers?: Record<string, string>,
    priority: number = 1
  ): Promise<string> {
    const db = await this.ensureDB();
    const id = this.generateId();

    const item: SyncQueueItem = {
      id,
      url,
      method,
      data,
      headers,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
      priority
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.put(item);

      request.onsuccess = () => {
        console.log('Added to sync queue:', id);
        resolve(id);
      };

      request.onerror = () => {
        console.error('Failed to add to sync queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get sync queue
   */
  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readonly');
      const store = transaction.objectStore('syncQueue');
      const request = store.getAll();

      request.onsuccess = () => {
        const items = request.result.sort((a, b) => {
          // Sort by priority (higher first), then by timestamp (older first)
          if (a.priority !== b.priority) {
            return b.priority - a.priority;
          }
          return a.timestamp - b.timestamp;
        });
        resolve(items);
      };

      request.onerror = () => {
        console.error('Failed to get sync queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Remove item from sync queue
   */
  async removeFromSyncQueue(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('Removed from sync queue:', id);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to remove from sync queue:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Update retry count for sync item
   */
  async updateRetryCount(id: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['syncQueue'], 'readwrite');
      const store = transaction.objectStore('syncQueue');
      const getRequest = store.get(id);

      getRequest.onsuccess = () => {
        const item = getRequest.result;
        if (!item) {
          resolve();
          return;
        }

        item.retryCount += 1;

        // Remove if max retries exceeded
        if (item.retryCount >= item.maxRetries) {
          const deleteRequest = store.delete(id);
          deleteRequest.onsuccess = () => {
            console.log('Removed failed sync item:', id);
            resolve();
          };
          deleteRequest.onerror = () => reject(deleteRequest.error);
        } else {
          const putRequest = store.put(item);
          putRequest.onsuccess = () => {
            console.log('Updated retry count:', id, item.retryCount);
            resolve();
          };
          putRequest.onerror = () => reject(putRequest.error);
        }
      };

      getRequest.onerror = () => {
        console.error('Failed to update retry count:', getRequest.error);
        reject(getRequest.error);
      };
    });
  }

  /**
   * Cache API response
   */
  async cacheResponse(key: string, data: any, ttl: number = 3600000): Promise<void> {
    const db = await this.ensureDB();
    
    const cacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttl
    };

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.put(cacheEntry);

      request.onsuccess = () => {
        console.log('Cached response:', key);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to cache response:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get cached response
   */
  async getCachedResponse(key: string): Promise<any | null> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result;
        
        if (!entry) {
          resolve(null);
          return;
        }

        // Check if expired
        if (Date.now() > entry.expiry) {
          // Clean up expired entry
          this.deleteCachedResponse(key);
          resolve(null);
          return;
        }

        resolve(entry.data);
      };

      request.onerror = () => {
        console.error('Failed to get cached response:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Delete cached response
   */
  async deleteCachedResponse(key: string): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get storage usage
   */
  async getStorageUsage(): Promise<StorageUsage> {
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const used = estimate.usage || 0;
        const quota = estimate.quota || 0;
        const percentage = quota > 0 ? (used / quota) * 100 : 0;

        return { used, quota, percentage };
      } catch (error) {
        console.error('Failed to get storage estimate:', error);
      }
    }

    // Fallback for browsers that don't support storage estimate
    return { used: 0, quota: 0, percentage: 0 };
  }

  /**
   * Clear all offline data
   */
  async clearAllData(): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['offlineData', 'syncQueue', 'cache'], 'readwrite');
      
      const clearPromises = [
        new Promise<void>((res, rej) => {
          const request = transaction.objectStore('offlineData').clear();
          request.onsuccess = () => res();
          request.onerror = () => rej(request.error);
        }),
        new Promise<void>((res, rej) => {
          const request = transaction.objectStore('syncQueue').clear();
          request.onsuccess = () => res();
          request.onerror = () => rej(request.error);
        }),
        new Promise<void>((res, rej) => {
          const request = transaction.objectStore('cache').clear();
          request.onsuccess = () => res();
          request.onerror = () => rej(request.error);
        })
      ];

      Promise.all(clearPromises)
        .then(() => {
          console.log('All offline data cleared');
          resolve();
        })
        .catch(reject);
    });
  }

  /**
   * Clean up expired cache entries
   */
  async cleanupExpiredCache(): Promise<void> {
    const db = await this.ensureDB();
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('expiry');
      const request = index.openCursor(IDBKeyRange.upperBound(now));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log('Expired cache entries cleaned up');
          resolve();
        }
      };

      request.onerror = () => {
        console.error('Failed to cleanup expired cache:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Get/set settings
   */
  async getSetting(key: string): Promise<any> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };

      request.onerror = () => {
        console.error('Failed to get setting:', request.error);
        reject(request.error);
      };
    });
  }

  async setSetting(key: string, value: any): Promise<void> {
    const db = await this.ensureDB();

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });

      request.onsuccess = () => {
        console.log('Setting saved:', key);
        resolve();
      };

      request.onerror = () => {
        console.error('Failed to save setting:', request.error);
        reject(request.error);
      };
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  /**
   * Initialize periodic cleanup
   */
  initPeriodicCleanup(): void {
    // Clean up expired cache every hour
    setInterval(() => {
      this.cleanupExpiredCache().catch(console.error);
    }, 3600000);
  }
}

// Create singleton instance
const offlineStorage = new OfflineStorageService();

// Initialize periodic cleanup
offlineStorage.initPeriodicCleanup();

export default offlineStorage;