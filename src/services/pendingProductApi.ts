import { API_BASE_URL } from '../constants';
import { supabase } from './supabase';
import logger from '../utils/logger';

export interface PendingProductSubmission {
  product_name: string;
  barcode?: string;
  brands?: string[];
  categories?: string[];
  carbon_footprint: number;
  carbon_footprint_source: string;
  carbon_footprint_justification: string;
  user_footprint_entry_id?: string;
}

export interface PendingProduct {
  id: string;
  product_name: string;
  barcode?: string;
  brands: string[];
  categories: string[];
  carbon_footprint: number;
  carbon_footprint_source: string;
  carbon_footprint_justification: string;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_reason?: string;
  user_footprint_entry_id?: string;
  created_at: string;
  updated_at: string;
}

export interface PendingProductResponse {
  submissions: PendingProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

class PendingProductApi {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      throw new Error('No authentication token available');
    }

    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`
    };
  }

  /**
   * Submit a new product for admin review
   */
  async submitProduct(submission: PendingProductSubmission): Promise<PendingProduct> {
    try {
      logger.log('📝 [PENDING PRODUCT] Submitting product for review:', submission.product_name);

      const response = await fetch(`${API_BASE_URL}/pending-products`, {
        method: 'POST',
        headers: await this.getAuthHeaders(),
        body: JSON.stringify(submission)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to submit product: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to submit product for review');
      }

      logger.log('✅ [PENDING PRODUCT] Product submitted successfully:', result.data.submission.id);
      return result.data.submission;
    } catch (error) {
      console.error('❌ [PENDING PRODUCT] Error submitting product:', error);
      throw error;
    }
  }

  /**
   * Get user's product submissions
   */
  async getMySubmissions(options: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<PendingProductResponse> {
    try {
      const { page = 1, limit = 10, status } = options;
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });

      if (status) {
        params.append('status', status);
      }

      const response = await fetch(`${API_BASE_URL}/pending-products/my-submissions?${params}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get submissions: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get submissions');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting submissions:', error);
      throw error;
    }
  }

  /**
   * Get specific submission details
   */
  async getSubmissionDetails(submissionId: string): Promise<PendingProduct> {
    try {
      const response = await fetch(`${API_BASE_URL}/pending-products/${submissionId}`, {
        method: 'GET',
        headers: await this.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Failed to get submission details: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get submission details');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting submission details:', error);
      throw error;
    }
  }

  /**
   * Check if a product already exists by barcode or name
   */
  async checkProductExists(barcode?: string, productName?: string): Promise<{
    exists: boolean;
    existingProduct?: any;
    pendingSubmission?: PendingProduct;
  }> {
    try {
      // First check if product exists in main database
      if (barcode) {
        // This would typically call the products API to check by barcode
        // For now, we'll let the backend handle this check during submission
      }

      // Check if user has already submitted this product
      const submissions = await this.getMySubmissions({ status: 'pending' });
      const existingSubmission = submissions.submissions.find(sub => 
        (barcode && sub.barcode === barcode) ||
        (productName && sub.product_name.toLowerCase() === productName.toLowerCase())
      );

      return {
        exists: !!existingSubmission,
        pendingSubmission: existingSubmission
      };
    } catch (error) {
      console.error('Error checking product existence:', error);
      // Don't throw error here, let submission proceed and backend will handle validation
      return { exists: false };
    }
  }
}

export default new PendingProductApi();
