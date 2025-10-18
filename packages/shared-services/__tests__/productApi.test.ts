import { ProductApiService } from '../src/productApi';
import type { ProductSearchParams } from '@ectracc/shared-types';

// Mock HttpClient
jest.mock('../src/http', () => ({
  HttpClient: jest.fn().mockImplementation(() => ({
    makeRequest: jest.fn(),
  })),
}));

describe('ProductApiService', () => {
  let productApi: ProductApiService;
  let mockMakeRequest: jest.Mock;

  beforeEach(() => {
    productApi = new ProductApiService();
    mockMakeRequest = (productApi as any).http.makeRequest;
    jest.clearAllMocks();
  });

  describe('searchProducts', () => {
    it('should search products with query parameters', async () => {
      const mockProducts = [
        { id: '1', name: 'Test Product', barcode: '123456' },
      ];
      mockMakeRequest.mockResolvedValue({
        success: true,
        data: { products: mockProducts, total: 1 },
      });

      const params: ProductSearchParams = {
        query: 'test',
        limit: 10,
        offset: 0,
      };

      const result = await productApi.searchProducts(params);

      expect(mockMakeRequest).toHaveBeenCalledWith(
        'GET',
        '/products/search',
        expect.objectContaining({
          query: 'test',
          limit: '10',
          offset: '0',
        })
      );
      expect(result.success).toBe(true);
      expect(result.data?.products).toEqual(mockProducts);
    });

    it('should handle search errors gracefully', async () => {
      mockMakeRequest.mockResolvedValue({
        success: false,
        error: 'Search failed',
      });

      const params: ProductSearchParams = { query: 'test' };
      const result = await productApi.searchProducts(params);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Search failed');
    });

    it('should filter out undefined parameters', async () => {
      mockMakeRequest.mockResolvedValue({
        success: true,
        data: { products: [], total: 0 },
      });

      const params: ProductSearchParams = {
        query: 'test',
        category: undefined,
        brand: undefined,
      };

      await productApi.searchProducts(params);

      const callParams = mockMakeRequest.mock.calls[0][2];
      expect(callParams).not.toHaveProperty('category');
      expect(callParams).not.toHaveProperty('brand');
    });
  });

  describe('getProductByBarcode', () => {
    it('should get product by barcode', async () => {
      const mockProduct = { id: '1', name: 'Test Product', barcode: '123456' };
      mockMakeRequest.mockResolvedValue({
        success: true,
        data: mockProduct,
      });

      const result = await productApi.getProductByBarcode('123456');

      expect(mockMakeRequest).toHaveBeenCalledWith(
        'GET',
        '/products/barcode/123456'
      );
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProduct);
    });

    it('should handle barcode not found', async () => {
      mockMakeRequest.mockResolvedValue({
        success: false,
        error: 'Product not found',
      });

      const result = await productApi.getProductByBarcode('999999');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Product not found');
    });
  });

  describe('getCategories', () => {
    it('should fetch all categories', async () => {
      const mockCategories = ['Beverages', 'Dairy', 'Snacks'];
      mockMakeRequest.mockResolvedValue({
        success: true,
        data: mockCategories,
      });

      const result = await productApi.getCategories();

      expect(mockMakeRequest).toHaveBeenCalledWith('GET', '/products/categories');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCategories);
    });
  });

  describe('getBrands', () => {
    it('should fetch all brands', async () => {
      const mockBrands = ['Brand A', 'Brand B', 'Brand C'];
      mockMakeRequest.mockResolvedValue({
        success: true,
        data: mockBrands,
      });

      const result = await productApi.getBrands();

      expect(mockMakeRequest).toHaveBeenCalledWith('GET', '/products/brands');
      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockBrands);
    });
  });

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      mockMakeRequest.mockResolvedValue({
        success: true,
        data: { status: 'healthy' },
      });

      const result = await productApi.healthCheck();

      expect(mockMakeRequest).toHaveBeenCalledWith('GET', '/health');
      expect(result.success).toBe(true);
    });
  });

  describe('Static utility methods', () => {
    describe('buildSearchQuery', () => {
      it('should build search query from params', () => {
        const params: ProductSearchParams = {
          query: 'test product',
          category: 'Beverages',
          brand: 'Brand A',
          limit: 20,
          offset: 10,
        };

        const query = ProductApiService.buildSearchQuery(params);

        expect(query).toContain('query=test%20product');
        expect(query).toContain('category=Beverages');
        expect(query).toContain('brand=Brand%20A');
        expect(query).toContain('limit=20');
        expect(query).toContain('offset=10');
      });

      it('should handle empty params', () => {
        const query = ProductApiService.buildSearchQuery({});
        expect(query).toBe('');
      });
    });

    describe('validateBarcode', () => {
      it('should validate correct barcodes', () => {
        expect(ProductApiService.validateBarcode('123456789012')).toBe(true);
        expect(ProductApiService.validateBarcode('1234567890123')).toBe(true);
      });

      it('should reject invalid barcodes', () => {
        expect(ProductApiService.validateBarcode('')).toBe(false);
        expect(ProductApiService.validateBarcode('123')).toBe(false);
        expect(ProductApiService.validateBarcode('abc123456789')).toBe(false);
      });
    });

    describe('sanitizeSearchQuery', () => {
      it('should sanitize search queries', () => {
        expect(ProductApiService.sanitizeSearchQuery('  test  ')).toBe('test');
        expect(ProductApiService.sanitizeSearchQuery('Test Product')).toBe(
          'test product'
        );
      });

      it('should handle empty queries', () => {
        expect(ProductApiService.sanitizeSearchQuery('')).toBe('');
        expect(ProductApiService.sanitizeSearchQuery('   ')).toBe('');
      });
    });
  });
});

