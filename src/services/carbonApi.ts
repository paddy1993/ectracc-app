import { 
  FootprintEntry, 
  TrackFootprintForm, 
  FootprintHistory, 
  CategoryBreakdown, 
  Goal, 
  GoalForm, 
  DashboardStats 
} from '../types';
import { supabase } from './supabase';
import OfflineSyncManager from '../utils/offlineSync';
import logger from '../utils/logger';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ectracc-backend.onrender.com/api';

class CarbonApiService {
  // Helper method to get auth headers
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    return {
      'Content-Type': 'application/json',
      'Authorization': session?.access_token ? `Bearer ${session.access_token}` : ''
    };
  }

  // Helper method to make API requests
  private async makeRequest<T>(endpoint: string, options?: RequestInit): Promise<T> {
    // For demo purposes, return mock data for missing endpoints
    logger.log(`Mock Carbon API call: ${endpoint}`);
    
    // Mock different endpoints
    if (endpoint.includes('/footprints/history')) {
      return this.getMockFootprintHistory() as T;
    }
    
    if (endpoint.includes('/footprints/category-breakdown')) {
      return this.getMockCategoryBreakdown() as T;
    }
    
    if (endpoint.includes('/goals')) {
      return this.getMockGoals() as T;
    }
    
    if (endpoint.includes('/dashboard')) {
      return this.getMockDashboardData() as T;
    }
    
    // Fallback to real API call for other endpoints
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();
    
    try {
      const response = await fetch(url, {
        headers: {
          ...headers,
          ...options?.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }

      return data.data;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error: Unable to connect to the server');
      }
      throw error;
    }
  }

  // Track a carbon footprint entry with offline support
  async trackFootprint(footprint: TrackFootprintForm): Promise<FootprintEntry> {
    try {
      return await this.makeRequest<FootprintEntry>('/footprints/track', {
        method: 'POST',
        body: JSON.stringify(footprint)
      });
    } catch (error: any) {
      // Log the actual error for debugging
      console.error('[CarbonAPI] Track footprint failed:', error);
      console.error('[CarbonAPI] Footprint data:', footprint);
      console.error('[CarbonAPI] Online status:', navigator.onLine);
      
      // Only use offline fallback if actually offline (not for validation/auth errors)
      if (!navigator.onLine) {
        logger.log('[CarbonAPI] User is offline, queueing for sync');
        const offlineSync = OfflineSyncManager.getInstance();
        const queued = await offlineSync.queueFootprint(footprint);
        
        if (queued) {
          // Return a mock entry for offline queue
          return {
            id: `offline-${Date.now()}`,
            user_id: 'current_user',
            product_barcode: footprint.product_barcode,
            manual_item: footprint.manual_item,
            amount: footprint.amount,
            carbon_total: footprint.carbon_total,
            category: footprint.category,
            logged_at: footprint.logged_at || new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          } as FootprintEntry;
        }
      }
      
      // Re-throw error if online (show validation/API errors to user)
      throw error;
    }
  }

  // Get footprint history
  async getFootprintHistory(period: 'weekly' | 'monthly' = 'weekly'): Promise<FootprintHistory> {
    return this.makeRequest<FootprintHistory>(`/footprints/history?period=${period}`);
  }

  // Get category breakdown
  async getCategoryBreakdown(period: 'weekly' | 'monthly' = 'monthly'): Promise<CategoryBreakdown> {
    return this.makeRequest<CategoryBreakdown>(`/footprints/category-breakdown?period=${period}`);
  }

  // Get user goals
  async getGoals(): Promise<Goal[]> {
    return this.makeRequest<Goal[]>('/footprints/goals');
  }

  // Create or update goal
  async saveGoal(goal: GoalForm): Promise<Goal> {
    return this.makeRequest<Goal>('/footprints/goals', {
      method: 'POST',
      body: JSON.stringify(goal)
    });
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [history, goals] = await Promise.all([
        this.getFootprintHistory('weekly'),
        this.getGoals()
      ]);

      // Calculate current totals
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay()); // Start of current week
      
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1); // Start of current month

      // Calculate totals from raw data
      const currentWeekTotal = history.raw_data
        .filter(entry => new Date(entry.logged_at) >= weekStart)
        .reduce((sum, entry) => sum + entry.carbon_total, 0);

      const currentMonthTotal = history.raw_data
        .filter(entry => new Date(entry.logged_at) >= monthStart)
        .reduce((sum, entry) => sum + entry.carbon_total, 0);

      // Get recent entries (last 5)
      const recentEntries = history.raw_data
        .sort((a, b) => new Date(b.logged_at).getTime() - new Date(a.logged_at).getTime())
        .slice(0, 5);

      // Find goals
      const weeklyGoal = goals.find(goal => goal.timeframe === 'weekly');
      const monthlyGoal = goals.find(goal => goal.timeframe === 'monthly');

      return {
        currentTotal: currentWeekTotal,
        weeklyTotal: currentWeekTotal,
        monthlyTotal: currentMonthTotal,
        recentEntries,
        weeklyGoal,
        monthlyGoal
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      // Return empty stats on error
      return {
        currentTotal: 0,
        weeklyTotal: 0,
        monthlyTotal: 0,
        recentEntries: [],
        weeklyGoal: undefined,
        monthlyGoal: undefined
      };
    }
  }

  // Mock data methods for demo
  private getMockFootprintHistory(): FootprintHistory {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      period: 'weekly',
      start_date: weekAgo.toISOString(),
      end_date: now.toISOString(),
      aggregated: [
        { period: 'Mon', total_carbon: 2.3, count: 3, categories: { food: 1.8, transport: 0.5 } },
        { period: 'Tue', total_carbon: 1.9, count: 2, categories: { food: 1.2, energy: 0.7 } },
        { period: 'Wed', total_carbon: 3.1, count: 4, categories: { food: 2.1, transport: 0.8, shopping: 0.2 } },
        { period: 'Thu', total_carbon: 2.7, count: 3, categories: { food: 1.9, energy: 0.8 } },
        { period: 'Fri', total_carbon: 4.2, count: 5, categories: { food: 2.8, transport: 1.1, shopping: 0.3 } },
        { period: 'Sat', total_carbon: 3.5, count: 4, categories: { food: 2.2, transport: 0.9, misc: 0.4 } },
        { period: 'Sun', total_carbon: 2.8, count: 3, categories: { food: 2.0, energy: 0.8 } }
      ],
      raw_data: [
        { id: '1', user_id: 'user1', product_barcode: '1234567890123', amount: 1, carbon_total: 0.48, category: 'food', logged_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', user_id: 'user1', manual_item: 'Bus ride', amount: 1, carbon_total: 0.8, category: 'transport', logged_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', user_id: 'user1', product_barcode: '2345678901234', amount: 1, carbon_total: 0.7, category: 'food', logged_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ]
    };
  }

  private getMockCategoryBreakdown(): CategoryBreakdown {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    return {
      period: 'weekly',
      start_date: weekAgo.toISOString(),
      end_date: now.toISOString(),
      categories: [
        { category: 'food', value: 14.0, percentage: 68.3 },
        { category: 'transport', value: 3.3, percentage: 16.1 },
        { category: 'energy', value: 2.3, percentage: 11.2 },
        { category: 'shopping', value: 0.5, percentage: 2.4 },
        { category: 'misc', value: 0.4, percentage: 2.0 }
      ],
      total_carbon: 20.5
    };
  }

  private getMockGoals(): Goal[] {
    return [
      {
        id: 'goal1',
        user_id: 'user1',
        target_value: 25.0,
        timeframe: 'weekly',
        description: 'Weekly carbon footprint target',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'goal2',
        user_id: 'user1',
        target_value: 100.0,
        timeframe: 'monthly',
        description: 'Monthly carbon footprint target',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  }

  private getMockDashboardData(): DashboardStats {
    return {
      currentTotal: 20.5,
      weeklyTotal: 20.5,
      monthlyTotal: 78.3,
      recentEntries: [
        { id: '1', user_id: 'user1', product_barcode: '1234567890123', amount: 1, carbon_total: 0.48, category: 'food', logged_at: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '2', user_id: 'user1', manual_item: 'Coffee', amount: 1, carbon_total: 0.3, category: 'food', logged_at: new Date(Date.now() - 60000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
        { id: '3', user_id: 'user1', manual_item: 'Bus ride', amount: 1, carbon_total: 0.8, category: 'transport', logged_at: new Date(Date.now() - 120000).toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
      ],
      weeklyGoal: {
        id: 'goal1',
        user_id: 'user1',
        target_value: 25.0,
        timeframe: 'weekly',
        description: 'Weekly carbon footprint target',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      monthlyGoal: {
        id: 'goal2',
        user_id: 'user1',
        target_value: 100.0,
        timeframe: 'monthly',
        description: 'Monthly carbon footprint target',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  }

  // Utility method to format carbon footprint display
  static formatCarbonFootprint(value: number): string {
    if (value === 0) return '0g CO₂e';
    if (value < 1) return `${Math.round(value * 1000)}mg CO₂e`;
    if (value < 1000) return `${Math.round(value * 10) / 10}g CO₂e`;
    return `${Math.round(value / 100) / 10}kg CO₂e`;
  }

  // Utility method to get category color
  static getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      food: '#4CAF50',
      transport: '#2196F3',
      energy: '#FF9800',
      shopping: '#9C27B0',
      misc: '#607D8B'
    };
    return colors[category] || '#999999';
  }

  // Utility method to get category icon
  static getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      food: '🍎',
      transport: '🚗',
      energy: '⚡',
      shopping: '🛍️',
      misc: '📦'
    };
    return icons[category] || '📊';
  }

  // Utility method to get category display name
  static getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      food: 'Food & Drinks',
      transport: 'Transport',
      energy: 'Energy & Utilities',
      shopping: 'Shopping',
      misc: 'Miscellaneous'
    };
    return labels[category] || category;
  }

  // Calculate weekly/monthly progress percentage
  static calculateProgress(current: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  // Get progress color based on percentage
  static getProgressColor(percentage: number): string {
    if (percentage <= 50) return '#4CAF50'; // Green - good
    if (percentage <= 80) return '#FF9800'; // Orange - warning
    return '#F44336'; // Red - over target
  }
}

const carbonApiInstance = new CarbonApiService();

// TODO: Fix static method assignments
// carbonApiInstance.formatCarbonFootprint = CarbonApiService.formatCarbonFootprint;
// carbonApiInstance.getCategoryColor = CarbonApiService.getCategoryColor;
// carbonApiInstance.getCategoryIcon = CarbonApiService.getCategoryIcon;
// carbonApiInstance.getCategoryLabel = CarbonApiService.getCategoryLabel;
// carbonApiInstance.calculateProgress = CarbonApiService.calculateProgress;
// carbonApiInstance.getProgressColor = CarbonApiService.getProgressColor;
// carbonApiInstance.getGoalProgressColor = CarbonApiService.getGoalProgressColor;

export default carbonApiInstance;
