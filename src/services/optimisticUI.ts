import { UserFootprintEntry } from './userFootprintApi';
import logger from '../utils/logger';

// Types for optimistic updates
export interface OptimisticAction {
  id: string;
  type: 'ADD_ENTRY' | 'DELETE_ENTRY' | 'UPDATE_ENTRY';
  timestamp: number;
  data: any;
  originalData?: any;
  status: 'pending' | 'success' | 'failed';
  retryCount: number;
  maxRetries: number;
}

export interface OptimisticState {
  actions: OptimisticAction[];
  isOnline: boolean;
  syncInProgress: boolean;
}

// Optimistic UI Service
class OptimisticUIService {
  private state: OptimisticState = {
    actions: [],
    isOnline: navigator.onLine,
    syncInProgress: false
  };

  private listeners: Array<(state: OptimisticState) => void> = [];
  private syncQueue: OptimisticAction[] = [];

  constructor() {
    this.initializeNetworkListeners();
    this.loadPersistedActions();
    this.startPeriodicSync();
  }

  // Initialize network status listeners
  private initializeNetworkListeners() {
    window.addEventListener('online', () => {
      logger.log('[OptimisticUI] Back online');
      this.state.isOnline = true;
      this.notifyListeners();
      this.syncPendingActions();
    });

    window.addEventListener('offline', () => {
      logger.log('[OptimisticUI] Gone offline');
      this.state.isOnline = false;
      this.notifyListeners();
    });
  }

  // Load persisted actions from localStorage
  private loadPersistedActions() {
    try {
      const stored = localStorage.getItem('ectracc-optimistic-actions');
      if (stored) {
        const actions = JSON.parse(stored);
        this.state.actions = actions.filter((action: OptimisticAction) => 
          action.status === 'pending' && action.retryCount < action.maxRetries
        );
        this.notifyListeners();
      }
    } catch (error) {
      console.error('[OptimisticUI] Failed to load persisted actions:', error);
    }
  }

  // Persist actions to localStorage
  private persistActions() {
    try {
      localStorage.setItem('ectracc-optimistic-actions', JSON.stringify(this.state.actions));
    } catch (error) {
      console.error('[OptimisticUI] Failed to persist actions:', error);
    }
  }

  // Add optimistic action
  addOptimisticAction(
    type: OptimisticAction['type'],
    data: any,
    originalData?: any,
    maxRetries: number = 3
  ): string {
    const action: OptimisticAction = {
      id: this.generateId(),
      type,
      timestamp: Date.now(),
      data,
      originalData,
      status: 'pending',
      retryCount: 0,
      maxRetries
    };

    this.state.actions.push(action);
    this.persistActions();
    this.notifyListeners();

    // If online, try to sync immediately
    if (this.state.isOnline) {
      this.syncAction(action);
    }

    return action.id;
  }

  // Remove optimistic action
  removeOptimisticAction(id: string) {
    this.state.actions = this.state.actions.filter(action => action.id !== id);
    this.persistActions();
    this.notifyListeners();
  }

  // Update action status
  updateActionStatus(id: string, status: OptimisticAction['status']) {
    const action = this.state.actions.find(a => a.id === id);
    if (action) {
      action.status = status;
      if (status === 'success') {
        // Remove successful actions after a delay
        setTimeout(() => this.removeOptimisticAction(id), 1000);
      }
      this.persistActions();
      this.notifyListeners();
    }
  }

  // Get pending actions
  getPendingActions(): OptimisticAction[] {
    return this.state.actions.filter(action => action.status === 'pending');
  }

  // Get failed actions
  getFailedActions(): OptimisticAction[] {
    return this.state.actions.filter(action => action.status === 'failed');
  }

  // Apply optimistic updates to data
  applyOptimisticUpdates<T>(originalData: T[], type: string): T[] {
    let updatedData = [...originalData];

    // Apply pending actions
    this.getPendingActions().forEach(action => {
      switch (action.type) {
        case 'ADD_ENTRY':
          if (type === 'entries') {
            updatedData = [action.data, ...updatedData] as T[];
          }
          break;

        case 'DELETE_ENTRY':
          if (type === 'entries') {
            updatedData = updatedData.filter((item: any) => item.id !== action.data.id);
          }
          break;

        case 'UPDATE_ENTRY':
          if (type === 'entries') {
            updatedData = updatedData.map((item: any) =>
              item.id === action.data.id ? { ...item, ...action.data } : item
            ) as T[];
          }
          break;
      }
    });

    return updatedData;
  }

  // Sync single action
  private async syncAction(action: OptimisticAction) {
    if (this.syncQueue.includes(action)) {
      return; // Already in sync queue
    }

    this.syncQueue.push(action);

    try {
      let success = false;

      switch (action.type) {
        case 'ADD_ENTRY':
          success = await this.syncAddEntry(action);
          break;
        case 'DELETE_ENTRY':
          success = await this.syncDeleteEntry(action);
          break;
        case 'UPDATE_ENTRY':
          success = await this.syncUpdateEntry(action);
          break;
      }

      if (success) {
        this.updateActionStatus(action.id, 'success');
        this.showSuccessNotification(action);
      } else {
        throw new Error('Sync failed');
      }
    } catch (error) {
      console.error('[OptimisticUI] Sync failed for action:', action, error);
      action.retryCount++;

      if (action.retryCount >= action.maxRetries) {
        this.updateActionStatus(action.id, 'failed');
        this.showFailureNotification(action);
      } else {
        // Retry with exponential backoff
        setTimeout(() => {
          this.syncAction(action);
        }, Math.pow(2, action.retryCount) * 1000);
      }
    } finally {
      this.syncQueue = this.syncQueue.filter(a => a.id !== action.id);
    }
  }

  // Sync all pending actions
  private async syncPendingActions() {
    if (this.state.syncInProgress || !this.state.isOnline) {
      return;
    }

    this.state.syncInProgress = true;
    this.notifyListeners();

    const pendingActions = this.getPendingActions();
    logger.log(`[OptimisticUI] Syncing ${pendingActions.length} pending actions`);

    for (const action of pendingActions) {
      await this.syncAction(action);
    }

    this.state.syncInProgress = false;
    this.notifyListeners();
  }

  // Sync implementations for different action types
  private async syncAddEntry(action: OptimisticAction): Promise<boolean> {
    try {
      const response = await fetch('/api/user-footprints/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(action.data)
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async syncDeleteEntry(action: OptimisticAction): Promise<boolean> {
    try {
      const response = await fetch(`/api/user-footprints/entry/${action.data.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async syncUpdateEntry(action: OptimisticAction): Promise<boolean> {
    try {
      const response = await fetch(`/api/user-footprints/entry/${action.data.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(action.data)
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Show notifications
  private showSuccessNotification(action: OptimisticAction) {
    const messages = {
      'ADD_ENTRY': 'Entry synced successfully',
      'DELETE_ENTRY': 'Entry deleted successfully',
      'UPDATE_ENTRY': 'Entry updated successfully'
    };

    this.showNotification(messages[action.type], 'success');
  }

  private showFailureNotification(action: OptimisticAction) {
    const messages = {
      'ADD_ENTRY': 'Failed to sync new entry',
      'DELETE_ENTRY': 'Failed to delete entry',
      'UPDATE_ENTRY': 'Failed to update entry'
    };

    this.showNotification(messages[action.type], 'error');
  }

  private showNotification(message: string, type: 'success' | 'error') {
    // Dispatch custom event for notification
    window.dispatchEvent(new CustomEvent('optimistic-notification', {
      detail: { message, type }
    }));
  }

  // Retry failed actions
  retryFailedActions() {
    const failedActions = this.getFailedActions();
    failedActions.forEach(action => {
      action.status = 'pending';
      action.retryCount = 0;
      this.syncAction(action);
    });
    this.persistActions();
    this.notifyListeners();
  }

  // Clear all actions
  clearAllActions() {
    this.state.actions = [];
    this.persistActions();
    this.notifyListeners();
  }

  // Subscribe to state changes
  subscribe(listener: (state: OptimisticState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Get current state
  getState(): OptimisticState {
    return { ...this.state };
  }

  // Notify listeners
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.getState()));
  }

  // Generate unique ID
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Start periodic sync
  private startPeriodicSync() {
    setInterval(() => {
      if (this.state.isOnline && this.getPendingActions().length > 0) {
        this.syncPendingActions();
      }
    }, 30000); // Sync every 30 seconds
  }

  // Register service worker for background sync
  registerBackgroundSync() {
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      navigator.serviceWorker.ready.then(registration => {
        return (registration as any).sync.register('background-sync-footprint');
      }).catch(error => {
        console.error('[OptimisticUI] Background sync registration failed:', error);
      });
    }
  }
}

// Create singleton instance
const optimisticUI = new OptimisticUIService();

export default optimisticUI;
