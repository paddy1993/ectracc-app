// User Footprint API Service
import { API_BASE_URL } from '../constants';
import { supabase } from './supabase';

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

export interface UserFootprintSummary {
  totalFootprint: number;
  totalEntries: number;
  avgFootprint: number;
  maxFootprint: number;
  minFootprint: number;
  timeframe: string;
}

export interface UserFootprintHistory {
  period: any;
  totalFootprint: number;
  entryCount: number;
  date: string;
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

class UserFootprintApiService {
  private baseUrl = `${API_BASE_URL}/user-footprints`;

  // Get auth token from Supabase session
  private async getAuthToken(): Promise<string | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session?.access_token || null;
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Get auth headers
  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  // Add product to user's footprint
  async addEntry(data: AddFootprintRequest): Promise<UserFootprintEntry> {
    const response = await fetch(`${this.baseUrl}/add`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add product to footprint');
    }

    const result = await response.json();
    return result.data;
  }

  // Add product from product database
  async addFromProduct(data: AddFromProductRequest): Promise<UserFootprintEntry> {
    const response = await fetch(`${this.baseUrl}/add-from-product`, {
      method: 'POST',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to add product to footprint');
    }

    const result = await response.json();
    return result.data;
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

    const response = await fetch(`${this.baseUrl}/entries?${searchParams}`, {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 404) {
        // User has no entries yet - return empty result
        return [];
      }
      throw new Error(`Failed to fetch footprint entries (${response.status})`);
    }

    const result = await response.json();
    return result.data;
  }

  // Get user's footprint summary
  async getSummary(timeframe?: 'day' | 'week' | 'month' | 'ytd' | 'year' | 'all'): Promise<UserFootprintSummary> {
    const searchParams = new URLSearchParams();
    if (timeframe) searchParams.append('timeframe', timeframe);

    const response = await fetch(`${this.baseUrl}/summary?${searchParams}`, {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 404) {
        // User has no footprint data yet - return empty summary
        return {
          totalFootprint: 0,
          totalEntries: 0,
          avgFootprint: 0,
          timeframe: timeframe || 'week'
        };
      }
      throw new Error(`Failed to fetch footprint summary (${response.status})`);
    }

    const result = await response.json();
    return result.data;
  }

  // Get user's footprint history
  async getHistory(params?: {
    period?: 'day' | 'week' | 'month';
    limit?: number;
  }): Promise<UserFootprintHistory[]> {
    const searchParams = new URLSearchParams();
    
    if (params?.period) searchParams.append('period', params.period);
    if (params?.limit) searchParams.append('limit', params.limit.toString());

    const response = await fetch(`${this.baseUrl}/history?${searchParams}`, {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      if (response.status === 404) {
        // User has no history yet - return empty array
        return [];
      }
      throw new Error(`Failed to fetch footprint history (${response.status})`);
    }

    const result = await response.json();
    return result.data;
  }

  // Get specific entry
  async getEntry(id: string): Promise<UserFootprintEntry> {
    const response = await fetch(`${this.baseUrl}/entry/${id}`, {
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error('Failed to fetch footprint entry');
    }

    const result = await response.json();
    return result.data;
  }

  // Update entry
  async updateEntry(id: string, data: Partial<AddFootprintRequest>): Promise<UserFootprintEntry> {
    const response = await fetch(`${this.baseUrl}/entry/${id}`, {
      method: 'PUT',
      headers: await this.getAuthHeaders(),
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to update footprint entry');
    }

    const result = await response.json();
    return result.data;
  }

  // Delete entry
  async deleteEntry(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/entry/${id}`, {
      method: 'DELETE',
      headers: await this.getAuthHeaders()
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to delete footprint entry');
    }
  }

  // Get global statistics
  async getGlobalStats(): Promise<{
    totalEntries: number;
    uniqueUsers: number;
    totalFootprint: number;
    avgFootprint: number;
  }> {
    const response = await fetch(`${this.baseUrl}/stats`);

    if (!response.ok) {
      throw new Error('Failed to fetch footprint statistics');
    }

    const result = await response.json();
    return result.data;
  }

  // Format carbon footprint for display
  formatCarbonFootprint(footprint: number): string {
    if (footprint < 0.01) return '<0.01 kg CO₂e';
    if (footprint < 1) return `${footprint.toFixed(2)} kg CO₂e`;
    if (footprint < 10) return `${footprint.toFixed(1)} kg CO₂e`;
    return `${Math.round(footprint)} kg CO₂e`;
  }

  // Format total footprint with units
  formatTotalFootprint(footprint: number): string {
    if (footprint < 1) return `${(footprint * 1000).toFixed(0)} g CO₂e`;
    if (footprint < 1000) return `${footprint.toFixed(1)} kg CO₂e`;
    return `${(footprint / 1000).toFixed(2)} t CO₂e`;
  }
}

export default new UserFootprintApiService();
