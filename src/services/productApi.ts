import { Product, ProductSearchParams, ProductSearchResult, ProductStats } from '../types';
import offlineStorage from './offlineStorage';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://ectracc-backend.onrender.com/api';

class ProductApiService {
  private searchCache = new Map<string, { data: ProductSearchResult; timestamp: number }>();
  private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutes for search results (faster updates)
  private readonly STATIC_CACHE_TTL = 30 * 60 * 1000; // 30 minutes for categories/brands (faster updates)
  private readonly MAX_CACHE_SIZE = 100; // Increased cache size for better performance
  private pendingRequests = new Map<string, Promise<ProductSearchResult>>(); // Prevent duplicate requests
  private currentSearchController: AbortController | null = null; // Cancel previous searches

  // Helper method to build query string from params
  private buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => query.append(key, String(v)));
        } else {
          query.append(key, String(value));
        }
      }
    });
    
    return query.toString();
  }

  // Create cache key for search parameters
  private createCacheKey(params: ProductSearchParams): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result, key) => {
        const value = params[key as keyof ProductSearchParams];
        if (value !== undefined) {
          result[key] = Array.isArray(value) ? [...value].sort() : value;
        }
        return result;
      }, {} as Record<string, any>);
    
    return JSON.stringify(sortedParams);
  }

  // Check if cached data is still valid
  private isCacheValid(timestamp: number, ttl: number): boolean {
    return Date.now() - timestamp < ttl;
  }

  // Clean expired cache entries and manage cache size
  private cleanExpiredCache(): void {
    const now = Date.now();
    
    // Remove expired entries
    for (const [key, entry] of Array.from(this.searchCache.entries())) {
      if (!this.isCacheValid(entry.timestamp, this.CACHE_TTL)) {
        this.searchCache.delete(key);
      }
    }
    
    // If cache is still too large, remove oldest entries
    if (this.searchCache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.searchCache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const entriesToRemove = entries.slice(0, entries.length - this.MAX_CACHE_SIZE);
      entriesToRemove.forEach(([key]) => this.searchCache.delete(key));
    }
  }

  // Helper method to make API requests to real MongoDB backend with timeout
  private async makeRequest<T>(endpoint: string, options?: RequestInit, timeout: number = 8000, externalSignal?: AbortSignal): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`🌐 Real API call: ${url}`);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      // If external signal is provided, abort when it's aborted
      if (externalSignal) {
        externalSignal.addEventListener('abort', () => controller.abort());
      }
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
        signal: controller.signal,
        ...options,
      });

      clearTimeout(timeoutId);
      const data = await response.json();

      if (!response.ok) {
        // Handle specific HTTP errors with user-friendly messages
        if (response.status === 404) {
          throw new Error(data.message || 'Product not found');
        } else if (response.status === 503) {
          throw new Error('Database temporarily unavailable. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(data.message || `Error: ${response.status}`);
        }
      }

      // Check API response success flag
      if (data.success === false) {
        throw new Error(data.message || data.error || 'Request failed');
      }

      return data;
    } catch (error: any) {
      console.error('🚨 API request failed:', error);
      
      // Handle AbortError (request was cancelled)
      if (error.name === 'AbortError') {
        throw new Error('Request was cancelled');
      }
      
      // Provide user-friendly error messages for network issues
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Unable to connect to server. Please check your internet connection.');
      }
      
      // Re-throw the error for the component to handle
      throw error;
    }
  }

  // Search products by text query with caching
  async searchProducts(params: ProductSearchParams): Promise<ProductSearchResult> {
    // Cancel any previous search request
    if (this.currentSearchController) {
      this.currentSearchController.abort();
    }
    
    // Create new controller for this request
    this.currentSearchController = new AbortController();
    
    // Clean expired cache entries periodically
    this.cleanExpiredCache();

    // Create cache key
    const cacheKey = this.createCacheKey(params);
    
    // Check in-memory cache first
    const cachedEntry = this.searchCache.get(cacheKey);
    if (cachedEntry && this.isCacheValid(cachedEntry.timestamp, this.CACHE_TTL)) {
      console.log('🚀 Using cached search results');
      return cachedEntry.data;
    }

    // Check if there's already a pending request for this search
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      console.log('⏳ Using pending request (deduplication)');
      return pendingRequest;
    }

    // Build query parameters for API call
    const queryString = this.buildQueryString({
      q: params.q,
      limit: params.limit || 20,
      page: params.page || 1,
      category: params.category,
      brand: params.brand,
      minCarbon: params.minCarbon,
      maxCarbon: params.maxCarbon,
      sortBy: params.sortBy || 'relevance'
    });

    console.log('🌐 Fetching fresh search results');
    
    // Create the request promise (increased timeout for search)
    const requestPromise = this.makeRequest<any>(`/products/search?${queryString}`, {}, 15000, this.currentSearchController.signal)
      .then(response => {
        // Transform backend response to match frontend expectations
        const transformedData = (response.data || []).map((product: any) => ({
          ...product,
          // Map backend field names to frontend expectations
          product_name: product.name || product.product_name || 'Unknown Product',
          brands: Array.isArray(product.brand) ? product.brand : 
                  Array.isArray(product.brands) ? product.brands : 
                  product.brand ? [product.brand] : 
                  product.brands ? [product.brands] : [],
          categories: Array.isArray(product.category) ? product.category : 
                     Array.isArray(product.categories) ? product.categories : 
                     product.category ? [product.category] : 
                     product.categories ? [product.categories] : [],
          carbon_footprint: product.carbonFootprint || product.carbon_footprint || 0,
          ecoscore_grade: product.ecoScore || product.ecoscore_grade || null,
          image_url: product.imageUrl || product.image_url || null,
          source_database: product.source_database || 'estimated'
        }));

        const result: ProductSearchResult = {
          data: transformedData,
          meta: {
            pagination: response.pagination || {
              page: parseInt(params.page?.toString() || '1'),
              limit: parseInt(params.limit?.toString() || '20'),
              total: response.pagination?.total || response.data?.length || 0,
              totalPages: Math.ceil((response.pagination?.total || 0) / parseInt(params.limit?.toString() || '20')),
              hasMore: response.pagination?.hasMore || false
            },
            query: {
              q: params.q,
              category: params.category,
              brand: params.brand,
              minCarbon: params.minCarbon,
              maxCarbon: params.maxCarbon,
              sortBy: params.sortBy || 'relevance'
            }
          }
        };

        // Cache the result in memory
        this.searchCache.set(cacheKey, {
          data: result,
          timestamp: Date.now()
        });

        return result;
      })
      .finally(() => {
        // Remove from pending requests when done
        this.pendingRequests.delete(cacheKey);
        
        // Clear current controller if this was the active request
        if (this.currentSearchController && !this.currentSearchController.signal.aborted) {
          this.currentSearchController = null;
        }
      });

    // Store the pending request
    this.pendingRequests.set(cacheKey, requestPromise);
    
    return requestPromise;
  }

  // Get product by barcode
  async getProductByBarcode(barcode: string): Promise<{ success: boolean; data?: Product; error?: string }> {
    try {
      // Validate barcode format
      if (!barcode || !/^\d{8,13}$/.test(barcode)) {
        return {
          success: false,
          error: 'Invalid barcode format. Please scan a valid product barcode.'
        };
      }

      const response = await this.makeRequest<any>(`/products/barcode/${barcode}`);
      
      // Transform the product data to match frontend expectations
      const transformedProduct = response.data ? {
        ...response.data,
        product_name: response.data.name || response.data.product_name || 'Unknown Product',
        brands: Array.isArray(response.data.brand) ? response.data.brand : 
                Array.isArray(response.data.brands) ? response.data.brands : 
                response.data.brand ? [response.data.brand] : 
                response.data.brands ? [response.data.brands] : [],
        categories: Array.isArray(response.data.category) ? response.data.category : 
                   Array.isArray(response.data.categories) ? response.data.categories : 
                   response.data.category ? [response.data.category] : 
                   response.data.categories ? [response.data.categories] : [],
        carbon_footprint: response.data.carbonFootprint || response.data.carbon_footprint || 0,
        ecoscore_grade: response.data.ecoScore || response.data.ecoscore_grade || null,
        image_url: response.data.imageUrl || response.data.image_url || null,
        source_database: response.data.source_database || 'estimated'
      } : null;
      
      return {
        success: true,
        data: transformedProduct
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to find product'
      };
    }
  }

  // Get all products (with pagination)
  async getProducts(params: { page?: number; limit?: number; category?: string } = {}): Promise<ProductSearchResult> {
    const queryString = this.buildQueryString({
      page: params.page || 1,
      limit: params.limit || 20,
      category: params.category
    });

    try {
      // Use random products endpoint for general listing
      const response = await this.makeRequest<any>(`/products/random?count=${params.limit || 20}`);
      
      // Transform the products data to match frontend expectations
      const transformedData = (response.data || []).map((product: any) => ({
        ...product,
        product_name: product.name || product.product_name || 'Unknown Product',
        brands: Array.isArray(product.brand) ? product.brand : 
                Array.isArray(product.brands) ? product.brands : 
                product.brand ? [product.brand] : 
                product.brands ? [product.brands] : [],
        categories: Array.isArray(product.category) ? product.category : 
                   Array.isArray(product.categories) ? product.categories : 
                   product.category ? [product.category] : 
                   product.categories ? [product.categories] : [],
        carbon_footprint: product.carbonFootprint || product.carbon_footprint || 0,
        ecoscore_grade: product.ecoScore || product.ecoscore_grade || null,
        image_url: product.imageUrl || product.image_url || null,
        source_database: product.source_database || 'estimated'
      }));
      
      return {
        data: transformedData,
        meta: {
          pagination: {
            page: params.page || 1,
            limit: params.limit || 20,
            total: response.data?.length || 0,
            hasMore: false,
            totalPages: Math.ceil((response.data?.length || 0) / (params.limit || 20))
          },
          query: {
            category: params.category,
            sortBy: 'relevance'
          }
        }
      };
    } catch (error: any) {
      console.error('Error fetching products:', error);
      return {
        data: [],
        meta: {
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            hasMore: false,
            totalPages: 0
          },
          query: {
            category: params.category,
            sortBy: 'relevance'
          }
        }
      };
    }
  }

  // Get product categories with caching
  async getCategories(): Promise<string[]> {
    console.log('🌐 Fetching categories');
    
    try {
      const response = await this.makeRequest<any>('/products/categories');
      console.log('📦 Raw categories response:', response);
      
      const categories = response.data
        ?.map((item: any) => item.category || item)
        .filter((category: any) => 
          category && 
          typeof category === 'string' && 
          category !== 'undefined' && 
          category.trim() !== ''
        ) || [];
      
      console.log('✅ Processed categories:', categories.slice(0, 10), `(${categories.length} total)`);
      
      return categories;
    } catch (error: any) {
      console.error('❌ Error fetching categories:', error);
      return [];
    }
  }

  // Get product brands with caching
  async getBrands(): Promise<string[]> {
    console.log('🌐 Fetching brands');

    try {
      const response = await this.makeRequest<any>('/products/brands');
      console.log('📦 Raw brands response:', response);
      
      const brands = response.data
        ?.map((item: any) => item.brand || item)
        .filter((brand: any) => 
          brand && 
          typeof brand === 'string' && 
          brand.trim() !== ''
        ) || [];
      
      console.log('✅ Processed brands:', brands.slice(0, 10), `(${brands.length} total)`);
      
      return brands;
    } catch (error: any) {
      console.error('❌ Error fetching brands:', error);
      return [];
    }
  }

  // Get products by category
  async getProductsByCategory(category: string, params: { page?: number; limit?: number } = {}): Promise<ProductSearchResult> {
    const queryString = this.buildQueryString({
      page: params.page || 1,
      limit: params.limit || 20
    });

    try {
      const response = await this.makeRequest<any>(`/products/category/${encodeURIComponent(category)}?${queryString}`);
      
      // Transform the products data to match frontend expectations
      const transformedData = (response.data || []).map((product: any) => ({
        ...product,
        product_name: product.name || product.product_name || 'Unknown Product',
        brands: Array.isArray(product.brand) ? product.brand : 
                Array.isArray(product.brands) ? product.brands : 
                product.brand ? [product.brand] : 
                product.brands ? [product.brands] : [],
        categories: Array.isArray(product.category) ? product.category : 
                   Array.isArray(product.categories) ? product.categories : 
                   product.category ? [product.category] : 
                   product.categories ? [product.categories] : [],
        carbon_footprint: product.carbonFootprint || product.carbon_footprint || 0,
        ecoscore_grade: product.ecoScore || product.ecoscore_grade || null,
        image_url: product.imageUrl || product.image_url || null,
        source_database: product.source_database || 'estimated'
      }));
      
      return {
        data: transformedData,
        meta: {
          pagination: response.pagination || {
            page: params.page || 1,
            limit: params.limit || 20,
            total: response.data?.length || 0,
            hasMore: false,
            totalPages: Math.ceil((response.data?.length || 0) / (params.limit || 20))
          },
          query: {
            category: category,
            sortBy: 'relevance'
          }
        }
      };
    } catch (error: any) {
      console.error('Error fetching products by category:', error);
      return {
        data: [],
        meta: {
          pagination: {
            page: 1,
            limit: 20,
            total: 0,
            hasMore: false,
            totalPages: 0
          },
          query: {
            category: category,
            sortBy: 'relevance'
          }
        }
      };
    }
  }

  // Get random products for discovery
  async getRandomProducts(count: number = 10): Promise<{ success: boolean; data: Product[] }> {
    try {
      const response = await this.makeRequest<any>(`/products/random?count=${count}`);
      
      // Transform the products data to match frontend expectations
      const transformedData = (response.data || []).map((product: any) => ({
        ...product,
        product_name: product.name || product.product_name || 'Unknown Product',
        brands: Array.isArray(product.brand) ? product.brand : 
                Array.isArray(product.brands) ? product.brands : 
                product.brand ? [product.brand] : 
                product.brands ? [product.brands] : [],
        categories: Array.isArray(product.category) ? product.category : 
                   Array.isArray(product.categories) ? product.categories : 
                   product.category ? [product.category] : 
                   product.categories ? [product.categories] : [],
        carbon_footprint: product.carbonFootprint || product.carbon_footprint || 0,
        ecoscore_grade: product.ecoScore || product.ecoscore_grade || null,
        image_url: product.imageUrl || product.image_url || null,
        source_database: product.source_database || 'estimated'
      }));
      
      return {
        success: true,
        data: transformedData
      };
    } catch (error: any) {
      console.error('Error fetching random products:', error);
      return {
        success: false,
        data: []
      };
    }
  }

  // Get database statistics
  async getStats(): Promise<ProductStats> {
    try {
      const response = await this.makeRequest<any>('/products/stats');
      
      return {
        ...response.data
      };
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      return {
        totalProducts: 0,
        ecoScoreDistribution: [],
        topCategories: [],
        carbonFootprintStats: {
          avg: 0,
          min: 0,
          max: 0,
          count: 0
        }
      };
    }
  }

  // Health check for the product API
  async healthCheck(): Promise<{ success: boolean; status: string; message?: string }> {
    try {
      const response = await this.makeRequest<any>('/products/stats');
      
      return {
        success: true,
        status: 'connected',
        message: `Database has ${response.data?.totalProducts || 0} products`
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'disconnected',
        message: error.message || 'Unable to connect to product database'
      };
    }
  }

  // Utility methods for UI components
  static getEcoScoreColor(score?: string): string {
    if (!score) return '#gray';
    switch (score.toLowerCase()) {
      case 'a': return '#4CAF50'; // Green
      case 'b': return '#8BC34A'; // Light Green
      case 'c': return '#FFC107'; // Amber
      case 'd': return '#FF9800'; // Orange
      case 'e': return '#F44336'; // Red
      default: return '#9E9E9E'; // Gray
    }
  }

  static getEcoScoreLabel(score?: string): string {
    if (!score) return 'Unknown';
    switch (score.toLowerCase()) {
      case 'a': return 'Excellent';
      case 'b': return 'Good';
      case 'c': return 'Fair';
      case 'd': return 'Poor';
      case 'e': return 'Very Poor';
      default: return 'Unknown';
    }
  }

  static formatCarbonFootprint(footprint?: number): string {
    if (!footprint) return '0 kg CO₂e';
    return `${footprint.toFixed(2)} kg CO₂e`;
  }
}

// Export singleton instance and class
const productApi = new ProductApiService();
export default productApi;
export { ProductApiService };