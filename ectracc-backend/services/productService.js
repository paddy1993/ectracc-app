// Product Service - Business logic layer
const productRepository = require('../repositories/productRepository');
const cacheService = require('./cacheService');

class ProductService {
  /**
   * Calculate carbon footprint for a product
   * @param {object} product - Raw product data
   * @returns {number} Carbon footprint in kg CO2
   */
  calculateCarbonFootprint(product) {
    // Priority 1: Use actual co2_total if available
    if (product.co2_total && typeof product.co2_total === 'number' && product.co2_total > 0) {
      return Math.round(product.co2_total * 100) / 100;
    }

    // Priority 2: Estimate from ecoscore
    if (product.ecoscore_grade) {
      const ecoScoreMap = {
        'a': 0.3,
        'b': 0.6,
        'c': 1.2,
        'd': 2.0,
        'e': 3.5
      };
      const baseCarbon = ecoScoreMap[product.ecoscore_grade.toLowerCase()] || 1.5;
      
      // Adjust for product type
      let multiplier = 1.0;
      if (product.product_type === 'food') multiplier = 1.0;
      else if (product.product_type === 'beauty') multiplier = 0.8;
      else if (product.product_type === 'petfood') multiplier = 1.2;
      
      return Math.round(baseCarbon * multiplier * 100) / 100;
    }

    // Priority 3: Estimate from category
    if (product.categories_tags && product.categories_tags.length > 0) {
      const categoryString = product.categories_tags.join(' ').toLowerCase();
      
      // High carbon categories
      if (categoryString.includes('meat') || categoryString.includes('beef')) return 5.5;
      if (categoryString.includes('cheese') || categoryString.includes('dairy')) return 3.2;
      if (categoryString.includes('fish') || categoryString.includes('seafood')) return 2.8;
      
      // Medium carbon categories
      if (categoryString.includes('chicken') || categoryString.includes('poultry')) return 2.0;
      if (categoryString.includes('egg')) return 1.8;
      if (categoryString.includes('rice') || categoryString.includes('grain')) return 1.5;
      
      // Low carbon categories
      if (categoryString.includes('vegetable') || categoryString.includes('fruit')) return 0.5;
      if (categoryString.includes('legume') || categoryString.includes('bean')) return 0.4;
      if (categoryString.includes('water') || categoryString.includes('beverage')) return 0.3;
    }

    // Default estimate
    return 1.5;
  }

  /**
   * Format product for API response
   * @param {object} product - Raw product data
   * @returns {object} Formatted product
   */
  formatProduct(product) {
    if (!product) return null;

    const carbonFootprint = this.calculateCarbonFootprint(product);

    // Ensure brands is always an array
    let brands = [];
    if (product.brands) {
      if (Array.isArray(product.brands)) {
        brands = product.brands.filter(brand => brand && brand.trim());
      } else if (typeof product.brands === 'string') {
        brands = product.brands.split(',').map(b => b.trim()).filter(b => b);
      }
    }

    // Ensure categories is always an array
    let categories = [];
    if (product.categories_tags && Array.isArray(product.categories_tags)) {
      categories = product.categories_tags
        .filter(cat => cat && typeof cat === 'string')
        .map(cat => cat.replace(/^en:/, '').replace(/-/g, ' '))
        .filter(cat => cat.trim());
    } else if (product.categories) {
      if (Array.isArray(product.categories)) {
        categories = product.categories.filter(cat => cat && cat.trim());
      } else if (typeof product.categories === 'string') {
        categories = product.categories.split(',').map(c => c.trim()).filter(c => c);
      }
    }

    return {
      id: product._id?.toString(),
      code: product.code || null,
      product_name: product.product_name || 'Unknown Product',
      brands: brands,
      categories: categories,
      carbonFootprint: carbonFootprint, // Use camelCase for frontend compatibility
      carbon_footprint: carbonFootprint, // Keep snake_case for backward compatibility
      carbonFootprintUnit: 'kg CO2 per 100g',
      ecoscore_grade: product.ecoscore_grade?.toLowerCase() || null,
      nutriscore_grade: product.nutriscore_grade?.toLowerCase() || null,
      image_url: product.image_url || null,
      serving_size: product.serving_size || '100g',
      product_type: product.product_type || 'product',
      source_database: product.source_database || 'estimated',
      last_updated: product.last_updated || new Date().toISOString(),
      nutrition_info: product.nutriments ? {
        energy_100g: product.nutriments['energy-kcal_100g'] || null,
        proteins_100g: product.nutriments.proteins_100g || null,
        carbohydrates_100g: product.nutriments.carbohydrates_100g || null,
        fat_100g: product.nutriments.fat_100g || null,
        fiber_100g: product.nutriments.fiber_100g || null,
        salt_100g: product.nutriments.salt_100g || null
      } : null,
      
      // Enhanced enrichment fields (11 new fields)
      quantity: product.quantity || null,
      product_quantity: product.product_quantity || null,
      product_quantity_unit: product.product_quantity_unit || null,
      net_weight: product.net_weight || null,
      net_weight_unit: product.net_weight_unit || null,
      packaging: product.packaging || null,
      packaging_text: product.packaging_text || null,
      origins: Array.isArray(product.origins) ? product.origins : 
               (product.origins ? [product.origins] : null),
      manufacturing_places: Array.isArray(product.manufacturing_places) ? product.manufacturing_places : 
                           (product.manufacturing_places ? [product.manufacturing_places] : null),
      labels: Array.isArray(product.labels) ? product.labels : 
              (product.labels ? [product.labels] : null),
      stores: Array.isArray(product.stores) ? product.stores : 
              (product.stores ? [product.stores] : null),
      countries: Array.isArray(product.countries) ? product.countries : 
                 (product.countries ? [product.countries] : null),
      
      // Enrichment tracking
      last_enriched: product.last_enriched || null
    };
  }

  /**
   * Search products with caching
   * @param {string} query - Search query
   * @param {object} filters - Search filters and options
   * @returns {Promise<object[]>} Formatted products
   */
  async searchProducts(query, filters = {}) {
    try {
      // Build cache key from query and filters
      const cacheKey = `products:search:${query || 'all'}:${JSON.stringify(filters)}`;
      
      // Check cache first
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        console.log(`[ProductService] Cache HIT for: ${cacheKey.substring(0, 50)}...`);
        return cached;
      }
      
      console.log(`[ProductService] Cache MISS for: ${cacheKey.substring(0, 50)}...`);

      // Parse options
      const {
        limit = 20,
        page = 1,
        category,
        brand,
        ecoScore,
        minCarbon,
        maxCarbon,
        sortBy = 'relevance'
      } = filters;

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const options = {
        limit: Math.min(parseInt(limit), 100),
        skip: Math.max(skip, 0),
        category,
        brand,
        ecoScore,
        minCarbon: minCarbon ? parseFloat(minCarbon) : null,
        maxCarbon: maxCarbon ? parseFloat(maxCarbon) : null,
        sortBy
      };

      // Get products from repository
      let products = await productRepository.search(query, options);

      // Format products
      let formattedProducts = products.map(p => this.formatProduct(p));

      // Apply carbon footprint filtering (post-query)
      if (options.minCarbon !== null || options.maxCarbon !== null) {
        formattedProducts = formattedProducts.filter(product => {
          const carbon = product.carbonFootprint || product.carbon_footprint || 0;
          if (options.minCarbon !== null && carbon < options.minCarbon) return false;
          if (options.maxCarbon !== null && carbon > options.maxCarbon) return false;
          return true;
        });
      }

      // Apply carbon-based sorting
      if (sortBy === 'carbon_asc') {
        formattedProducts.sort((a, b) => (a.carbonFootprint || 0) - (b.carbonFootprint || 0));
      } else if (sortBy === 'carbon_desc') {
        formattedProducts.sort((a, b) => (b.carbonFootprint || 0) - (a.carbonFootprint || 0));
      }

      // Limit to requested amount after filtering
      const result = formattedProducts.slice(0, options.limit);

      // Cache for 5 minutes
      await cacheService.set(cacheKey, result, 300);

      return result;
    } catch (error) {
      console.error('[ProductService] Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get product by barcode with caching
   * @param {string} barcode - Product barcode
   * @returns {Promise<object|null>} Formatted product or null
   */
  async getProductByBarcode(barcode) {
    try {
      const cacheKey = `product:barcode:${barcode}`;
      
      // Check cache
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        console.log(`[ProductService] Cache HIT for barcode: ${barcode}`);
        return cached;
      }

      console.log(`[ProductService] Cache MISS for barcode: ${barcode}`);

      // Get from repository
      const product = await productRepository.findByBarcode(barcode);
      
      if (!product) {
        return null;
      }

      const formatted = this.formatProduct(product);

      // Cache for 1 hour (barcodes don't change often)
      await cacheService.set(cacheKey, formatted, 3600);

      return formatted;
    } catch (error) {
      console.error('[ProductService] Error getting product by barcode:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   * @param {string} id - MongoDB ObjectId
   * @returns {Promise<object|null>} Formatted product or null
   */
  async getProductById(id) {
    try {
      const cacheKey = `product:id:${id}`;
      
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const product = await productRepository.findById(id);
      if (!product) {
        return null;
      }

      const formatted = this.formatProduct(product);
      await cacheService.set(cacheKey, formatted, 3600);

      return formatted;
    } catch (error) {
      console.error('[ProductService] Error getting product by ID:', error);
      throw error;
    }
  }

  /**
   * Get random products for discovery
   * @param {number} count - Number of products
   * @returns {Promise<object[]>} Formatted products
   */
  async getRandomProducts(count = 10) {
    try {
      const cacheKey = `products:random:${count}`;
      
      // Cache random products for shorter time (2 minutes)
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const products = await productRepository.getRandom(count);
      const formatted = products.map(p => this.formatProduct(p));

      await cacheService.set(cacheKey, formatted, 120);

      return formatted;
    } catch (error) {
      console.error('[ProductService] Error getting random products:', error);
      throw error;
    }
  }

  /**
   * Get all categories with caching
   * @returns {Promise<string[]>} Category list
   */
  async getCategories() {
    try {
      const cacheKey = 'products:categories';
      
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        console.log('[ProductService] Cache HIT for categories');
        return cached;
      }

      console.log('[ProductService] Cache MISS for categories');

      const categories = await productRepository.getCategories();

      // Cache for 30 minutes (categories don't change often)
      await cacheService.set(cacheKey, categories, 1800);

      return categories;
    } catch (error) {
      console.error('[ProductService] Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get all brands with caching
   * @returns {Promise<string[]>} Brand list
   */
  async getBrands() {
    try {
      const cacheKey = 'products:brands';
      
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        console.log('[ProductService] Cache HIT for brands');
        return cached;
      }

      console.log('[ProductService] Cache MISS for brands');

      const brands = await productRepository.getBrands();

      // Cache for 30 minutes
      await cacheService.set(cacheKey, brands, 1800);

      return brands;
    } catch (error) {
      console.error('[ProductService] Error getting brands:', error);
      throw error;
    }
  }

  /**
   * Get database statistics with caching
   * @returns {Promise<object>} Database stats
   */
  async getStats() {
    try {
      const cacheKey = 'products:stats';
      
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        return cached;
      }

      const stats = await productRepository.getStats();

      // Cache for 10 minutes
      await cacheService.set(cacheKey, stats, 600);

      return stats;
    } catch (error) {
      console.error('[ProductService] Error getting stats:', error);
      throw error;
    }
  }

  /**
   * Clear product caches (useful after data updates)
   * @returns {Promise<number>} Number of keys cleared
   */
  async clearCache() {
    try {
      const cleared = await cacheService.delPattern('products:*');
      console.log(`[ProductService] Cleared ${cleared} product cache entries`);
      return cleared;
    } catch (error) {
      console.error('[ProductService] Error clearing cache:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ProductService();

