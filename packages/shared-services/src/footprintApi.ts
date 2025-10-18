/**
 * Footprint API Service
 * Shared across all platforms
 */

import type {
  FootprintEntry,
  TrackFootprintForm,
  FootprintHistory,
  CategoryBreakdown,
  Goal,
  GoalForm,
  DashboardStats,
} from '@ectracc/shared-types';
import { HttpClient } from './http';

export interface UserFootprintEntry {
  id: string;
  user_id: string;
  product_id?: string;
  product_name: string;
  carbon_footprint: number;
  carbon_footprint_per_unit: number;
  quantity: number;
  unit: string;
  total_footprint: number;
  source: string;
  source_reference?: string;
  categories: string[];
  brands: string[];
  date_added: string;
  created_at: string;
  updated_at?: string;
}

export interface AddFootprintRequest {
  product_id?: string;
  product_name: string;
  carbon_footprint: number;
  quantity?: number;
  unit?: string;
  source?: string;
  source_reference?: string;
  categories?: string[];
  brands?: string[];
}

export interface AddFromProductRequest {
  product_id: string;
  quantity?: number;
  unit?: string;
}

class FootprintApiService {
  private http: HttpClient;

  constructor() {
    this.http = new HttpClient();
  }

  // Add product to user's footprint
  async addEntry(data: AddFootprintRequest): Promise<UserFootprintEntry> {
    return this.http.post<UserFootprintEntry>('/user-footprints/add', data, {
      requiresAuth: true,
    });
  }

  // Add product from product database
  async addFromProduct(data: AddFromProductRequest): Promise<UserFootprintEntry> {
    return this.http.post<UserFootprintEntry>('/user-footprints/add-from-product', data, {
      requiresAuth: true,
    });
  }

  // Get user's footprint entries
  async getEntries(params?: {
    limit?: number;
    page?: number;
    start_date?: string;
    end_date?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  }): Promise<UserFootprintEntry[]> {
    const searchParams = new URLSearchParams();

    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);
    if (params?.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params?.sort_order) searchParams.append('sort_order', params.sort_order);

    try {
      return await this.http.get<UserFootprintEntry[]>(
        `/user-footprints/entries?${searchParams}`,
        { requiresAuth: true }
      );
    } catch (error: any) {
      if (error.message.includes('404')) {
        // User has no entries yet
        return [];
      }
      throw error;
    }
  }

  // Get user's footprint summary
  async getSummary(
    timeframe?: 'day' | 'week' | 'month' | 'ytd' | 'year' | 'all'
  ): Promise<{
    totalFootprint: number;
    totalEntries: number;
    avgFootprint: number;
    maxFootprint: number;
    minFootprint: number;
    timeframe: string;
  }> {
    const searchParams = new URLSearchParams();
    if (timeframe) searchParams.append('timeframe', timeframe);

    try {
      return await this.http.get<any>(`/user-footprints/summary?${searchParams}`, {
        requiresAuth: true,
      });
    } catch (error: any) {
      if (error.message.includes('404')) {
        // User has no footprint data yet
        return {
          totalFootprint: 0,
          totalEntries: 0,
          avgFootprint: 0,
          maxFootprint: 0,
          minFootprint: 0,
          timeframe: timeframe || 'week',
        };
      }
      throw error;
    }
  }

  // Get user's footprint history
  async getHistory(params?: {
    period?: 'day' | 'week' | 'month';
    limit?: number;
  }): Promise<any[]> {
    const searchParams = new URLSearchParams();

    if (params?.period) searchParams.append('period', params.period);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    try {
      return await this.http.get<any[]>(`/user-footprints/history?${searchParams}`, {
        requiresAuth: true,
      });
    } catch (error: any) {
      if (error.message.includes('404')) {
        // User has no history yet
        return [];
      }
      throw error;
    }
  }

  // Delete entry
  async deleteEntry(entryId: string): Promise<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`/user-footprints/entries/${entryId}`, {
      requiresAuth: true,
    });
  }

  // Update entry
  async updateEntry(
    entryId: string,
    data: Partial<AddFootprintRequest>
  ): Promise<UserFootprintEntry> {
    return this.http.put<UserFootprintEntry>(
      `/user-footprints/entries/${entryId}`,
      data,
      { requiresAuth: true }
    );
  }

  // Track a carbon footprint entry (legacy Phase 4 API)
  async trackFootprint(footprint: TrackFootprintForm): Promise<FootprintEntry> {
    return this.http.post<FootprintEntry>('/footprints/track', footprint, {
      requiresAuth: true,
    });
  }

  // Get footprint history (legacy Phase 4 API)
  async getFootprintHistory(
    period: 'weekly' | 'monthly' = 'weekly'
  ): Promise<FootprintHistory> {
    return this.http.get<FootprintHistory>(`/footprints/history?period=${period}`, {
      requiresAuth: true,
    });
  }

  // Get category breakdown (legacy Phase 4 API)
  async getCategoryBreakdown(
    period: 'weekly' | 'monthly' = 'monthly'
  ): Promise<CategoryBreakdown> {
    return this.http.get<CategoryBreakdown>(
      `/footprints/category-breakdown?period=${period}`,
      { requiresAuth: true }
    );
  }

  // Get user goals (legacy Phase 4 API)
  async getGoals(): Promise<Goal[]> {
    return this.http.get<Goal[]>('/footprints/goals', { requiresAuth: true });
  }

  // Create or update goal (legacy Phase 4 API)
  async saveGoal(goal: GoalForm): Promise<Goal> {
    return this.http.post<Goal>('/footprints/goals', goal, { requiresAuth: true });
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const [history, goals] = await Promise.all([
        this.getFootprintHistory('weekly'),
        this.getGoals(),
      ]);

      // Calculate current totals from history
      const currentTotal = history.aggregated.reduce(
        (sum, entry) => sum + entry.total_carbon,
        0
      );
      const weeklyTotal = currentTotal;
      const monthlyTotal = history.aggregated.reduce(
        (sum, entry) => sum + entry.total_carbon,
        0
      );

      // Get recent entries
      const recentEntries = history.raw_data.slice(0, 10);

      // Find active goals
      const weeklyGoal = goals.find((g) => g.timeframe === 'weekly');
      const monthlyGoal = goals.find((g) => g.timeframe === 'monthly');

      return {
        currentTotal,
        weeklyTotal,
        monthlyTotal,
        recentEntries,
        weeklyGoal,
        monthlyGoal,
      };
    } catch (error: any) {
      console.error('Error fetching dashboard stats:', error);
      // Return empty stats on error
      return {
        currentTotal: 0,
        weeklyTotal: 0,
        monthlyTotal: 0,
        recentEntries: [],
      };
    }
  }
}

// Export singleton instance and class
const footprintApi = new FootprintApiService();
export default footprintApi;
export { FootprintApiService };


