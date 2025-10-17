// Product Controller - Thin route handlers
const productService = require('../services/productService');

class ProductController {
  /**
   * Search products
   * GET /api/products/search
   */
  async search(req, res) {
    try {
      const { 
        q: query, 
        limit, 
        page, 
        category, 
        brand, 
        ecoscore,
        ecoScore,
        minCarbon,
        maxCarbon,
        sort,
        sortBy
      } = req.query;

      const filters = {
        limit,
        page,
        category,
        brand,
        ecoScore: ecoscore || ecoScore,
        minCarbon,
        maxCarbon,
        sortBy: sortBy || sort || 'relevance'
      };

      const products = await productService.searchProducts(query, filters);

      res.json({
        success: true,
        data: products,
        pagination: {
          page: parseInt(page) || 1,
          limit: parseInt(limit) || 20,
          total: products.length,
          hasMore: products.length === (parseInt(limit) || 20)
        },
        query: {
          search: query || null,
          filters: { category, brand, ecoscore: filters.ecoScore },
          sort: filters.sortBy
        }
      });
    } catch (error) {
      console.error('[ProductController] Search error:', error);
      res.status(500).json({
        success: false,
        error: 'Search failed',
        message: 'An error occurred while searching products'
      });
    }
  }

  /**
   * Get product by barcode
   * GET /api/products/barcode/:barcode
   */
  async getByBarcode(req, res) {
    try {
      const { barcode } = req.params;

      // Validate barcode format
      if (!barcode || !/^\d{8,13}$/.test(barcode)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid barcode format',
          message: 'Barcode must be 8-13 digits'
        });
      }

      const product = await productService.getProductByBarcode(barcode);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          message: `No product found with barcode: ${barcode}`
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('[ProductController] Get by barcode error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product',
        message: 'An error occurred while fetching the product'
      });
    }
  }

  /**
   * Get product by ID
   * GET /api/products/:id
   */
  async getById(req, res) {
    try {
      const { id } = req.params;

      const product = await productService.getProductById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          error: 'Product not found',
          message: `No product found with ID: ${id}`
        });
      }

      res.json({
        success: true,
        data: product
      });
    } catch (error) {
      console.error('[ProductController] Get by ID error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch product',
        message: 'An error occurred while fetching the product'
      });
    }
  }

  /**
   * Get random products
   * GET /api/products/random
   */
  async getRandom(req, res) {
    try {
      const { count = 10 } = req.query;
      const limit = Math.min(parseInt(count), 50);

      const products = await productService.getRandomProducts(limit);

      res.json({
        success: true,
        data: products,
        count: products.length
      });
    } catch (error) {
      console.error('[ProductController] Get random error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch random products',
        message: 'An error occurred while fetching random products'
      });
    }
  }

  /**
   * Get all categories
   * GET /api/products/categories
   */
  async getCategories(req, res) {
    try {
      const categories = await productService.getCategories();

      res.json({
        success: true,
        data: categories,
        count: categories.length
      });
    } catch (error) {
      console.error('[ProductController] Get categories error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch categories',
        message: 'An error occurred while fetching categories'
      });
    }
  }

  /**
   * Get all brands
   * GET /api/products/brands
   */
  async getBrands(req, res) {
    try {
      const brands = await productService.getBrands();

      res.json({
        success: true,
        data: brands,
        count: brands.length
      });
    } catch (error) {
      console.error('[ProductController] Get brands error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch brands',
        message: 'An error occurred while fetching brands'
      });
    }
  }

  /**
   * Get database statistics
   * GET /api/products/stats
   */
  async getStats(req, res) {
    try {
      const stats = await productService.getStats();

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('[ProductController] Get stats error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch statistics',
        message: 'An error occurred while fetching statistics'
      });
    }
  }
}

// Export singleton instance
module.exports = new ProductController();

