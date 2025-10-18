/**
 * Product API Service
 * Shared across all platforms
 */

import type {
  Product,
  ProductSearchParams,
  ProductSearchResult,
  ProductStats,
} from '@ectracc/shared-types';
import { HttpClient } from './http';
import { formatCarbonFootprint, getEcoScoreColor, getEcoScoreLabel } from '@ectracc/shared-core';

class ProductApiService {
  private http: HttpClient;
  private searchCache = new Map<string, { data: ProductSearchResult; timestamp: number }>();
  private readonly CACHE_TTL = 3 * 60 * 1000; // 3 minutes
  private readonly MAX_CACHE_SIZE = 100;

  constructor() {
    this.http = new HttpClient();
  }

  // Helper method to build query string from params
  private buildQueryString(params: Record<string, any>): string {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach((v) => query.append(key, String(v)));
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

  // Clean expired cache entries
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

  // Transform backend product data to frontend format
  private transformProduct(product: any): Product {
    return {
      ...product,
      id: product.id || product._id,
      product_name: product.name || product.product_name || 'Unknown Product',
      brands: Array.isArray(product.brand)
        ? product.brand
        : Array.isArray(product.brands)
        ? product.brands
        : product.brand
        ? [product.brand]
        : product.brands
        ? [product.brands]
        : [],
      categories: Array.isArray(product.category)
        ? product.category
        : Array.isArray(product.categories)
        ? product.categories
        : product.category
        ? [product.category]
        : product.categories
        ? [product.categories]
        : [],
      carbon_footprint: product.carbonFootprint || product.carbon_footprint || 0,
      ecoscore_grade: product.ecoScore || product.ecoscore_grade || null,
      image_url: product.imageUrl || product.image_url || null,
      source_database: product.source_database || 'estimated',
    };
  }

  // Search products by text query with caching
  async searchProducts(params: ProductSearchParams): Promise<ProductSearchResult> {
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

    // Build query parameters for API call
    const queryString = this.buildQueryString({
      q: params.q,
      limit: params.limit || 20,
      page: params.page || 1,
      category: params.category,
      brand: params.brand,
      minCarbon: params.minCarbon,
      maxCarbon: params.maxCarbon,
      sortBy: params.sortBy || 'relevance',
    });

    console.log('🌐 Fetching fresh search results');

    const response = await this.http.get<any>(`/products/search?${queryString}`);

    // Transform backend response to match frontend expectations
    const transformedData = (response.data || []).map((product: any) =>
      this.transformProduct(product)
    );

    const result: ProductSearchResult = {
      data: transformedData,
      meta: {
        pagination: response.pagination || {
          page: parseInt(params.page?.toString() || '1'),
          limit: parseInt(params.limit?.toString() || '20'),
          total: response.pagination?.total || response.data?.length || 0,
          totalPages: Math.ceil(
            (response.pagination?.total || 0) / parseInt(params.limit?.toString() || '20')
          ),
          hasMore: response.pagination?.hasMore || false,
        },
        query: {
          q: params.q,
          category: params.category,
          brand: params.brand,
          minCarbon: params.minCarbon,
          maxCarbon: params.maxCarbon,
          sortBy: params.sortBy || 'relevance',
        },
      },
    };

    // Cache the result in memory
    this.searchCache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  }

  // Get product by barcode
  async getProductByBarcode(
    barcode: string
  ): Promise<{ success: boolean; data?: Product; error?: string }> {
    try {
      // Validate barcode format
      if (!barcode || !/^\d{8,13}$/.test(barcode)) {
        return {
          success: false,
          error: 'Invalid barcode format. Please scan a valid product barcode.',
        };
      }

      const response = await this.http.get<any>(`/products/barcode/${barcode}`);

      // Transform the product data
      const transformedProduct = response.data
        ? this.transformProduct(response.data)
        : null;

      return {
        success: true,
        data: transformedProduct,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to find product',
      };
    }
  }

  // Get all products (with pagination)
  async getProducts(params: {
    page?: number;
    limit?: number;
    category?: string;
  } = {}): Promise<ProductSearchResult> {
    try {
      // Use random products endpoint for general listing
      const response = await this.http.get<any>(
        `/products/random?count=${params.limit || 20}`
      );

      // Transform the products data
      const transformedData = (response.data || []).map((product: any) =>
        this.transformProduct(product)
      );

      return {
        data: transformedData,
        meta: {
          pagination: {
            page: params.page || 1,
            limit: params.limit || 20,
            total: response.data?.length || 0,
            hasMore: false,
            totalPages: Math.ceil((response.data?.length || 0) / (params.limit || 20)),
          },
          query: {
            category: params.category,
            sortBy: 'relevance',
          },
        },
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
            totalPages: 0,
          },
          query: {
            category: params.category,
            sortBy: 'relevance',
          },
        },
      };
    }
  }

  // Get product categories
  async getCategories(): Promise<string[]> {
    try {
      const response = await this.http.get<any>('/products/categories');

      const categories =
        response.data
          ?.map((item: any) => item.category || item)
          .filter(
            (category: any) =>
              category &&
              typeof category === 'string' &&
              category !== 'undefined' &&
              category.trim() !== ''
          ) || [];

      return categories;
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      return [];
    }
  }

  // Get product brands
  async getBrands(): Promise<string[]> {
    try {
      const response = await this.http.get<any>('/products/brands');

      const brands =
        response.data
          ?.map((item: any) => item.brand || item)
          .filter(
            (brand: any) => brand && typeof brand === 'string' && brand.trim() !== ''
          ) || [];

      return brands;
    } catch (error: any) {
      console.error('Error fetching brands:', error);
      return [];
    }
  }

  // Get products by category
  async getProductsByCategory(
    category: string,
    params: { page?: number; limit?: number } = {}
  ): Promise<ProductSearchResult> {
    const queryString = this.buildQueryString({
      page: params.page || 1,
      limit: params.limit || 20,
    });

    try {
      const response = await this.http.get<any>(
        `/products/category/${encodeURIComponent(category)}?${queryString}`
      );

      // Transform the products data
      const transformedData = (response.data || []).map((product: any) =>
        this.transformProduct(product)
      );

      return {
        data: transformedData,
        meta: {
          pagination: response.pagination || {
            page: params.page || 1,
            limit: params.limit || 20,
            total: response.data?.length || 0,
            hasMore: false,
            totalPages: Math.ceil((response.data?.length || 0) / (params.limit || 20)),
          },
          query: {
            category: category,
            sortBy: 'relevance',
          },
        },
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
            totalPages: 0,
          },
          query: {
            category: category,
            sortBy: 'relevance',
          },
        },
      };
    }
  }

  // Get random products for discovery
  async getRandomProducts(
    count: number = 10
  ): Promise<{ success: boolean; data: Product[] }> {
    try {
      const response = await this.http.get<any>(`/products/random?count=${count}`);

      // Transform the products data
      const transformedData = (response.data || []).map((product: any) =>
        this.transformProduct(product)
      );

      return {
        success: true,
        data: transformedData,
      };
    } catch (error: any) {
      console.error('Error fetching random products:', error);
      return {
        success: false,
        data: [],
      };
    }
  }

  // Get database statistics
  async getStats(): Promise<ProductStats> {
    try {
      const response = await this.http.get<any>('/products/stats');

      return {
        ...response.data,
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
          count: 0,
        },
      };
    }
  }

  // Health check for the product API
  async healthCheck(): Promise<{
    success: boolean;
    status: string;
    message?: string;
  }> {
    try {
      const response = await this.http.get<any>('/products/stats');

      return {
        success: true,
        status: 'connected',
        message: `Database has ${response.data?.totalProducts || 0} products`,
      };
    } catch (error: any) {
      return {
        success: false,
        status: 'disconnected',
        message: error.message || 'Unable to connect to product database',
      };
    }
  }

  // Utility methods for UI components
  static getEcoScoreColor = getEcoScoreColor;
  static getEcoScoreLabel = getEcoScoreLabel;
  static formatCarbonFootprint = formatCarbonFootprint;
}

// Export singleton instance and class
const productApi = new ProductApiService();
export default productApi;
export { ProductApiService };


