// Product Repository - Pure data access layer
const { getMongoCollection } = require('../config/mongodb');
const { ObjectId } = require('mongodb');

class ProductRepository {
  constructor() {
    this.collection = null;
  }

  getCollection() {
    if (!this.collection) {
      try {
        this.collection = getMongoCollection('products');
        console.log('[ProductRepository] Successfully connected to products collection');
      } catch (error) {
        console.error('[ProductRepository] Failed to get products collection:', error);
        throw new Error('Database connection failed: ' + error.message);
      }
    }
    return this.collection;
  }

  /**
   * Find product by barcode
   * @param {string} barcode - Product barcode
   * @returns {Promise<object|null>} Raw product document
   */
  async findByBarcode(barcode) {
    try {
      const products = this.getCollection();
      return await products.findOne({ code: barcode });
    } catch (error) {
      console.error('[ProductRepository] Error finding by barcode:', error);
      throw error;
    }
  }

  /**
   * Find product by MongoDB ID
   * @param {string} id - MongoDB ObjectId string
   * @returns {Promise<object|null>} Raw product document
   */
  async findById(id) {
    try {
      const products = this.getCollection();
      return await products.findOne({ _id: new ObjectId(id) });
    } catch (error) {
      console.error('[ProductRepository] Error finding by ID:', error);
      throw error;
    }
  }

  /**
   * Search products with filters and pagination
   * @param {string} query - Search query
   * @param {object} options - Search options (filters, pagination, sorting)
   * @returns {Promise<object[]>} Array of raw product documents
   */
  async search(query, options = {}) {
    try {
      console.log('[ProductRepository] Starting search with query:', query, 'options:', options);
      const products = this.getCollection();
      const {
        limit = 20,
        skip = 0,
        category = null,
        brand = null,
        ecoScore = null,
        minCarbon = null,
        maxCarbon = null,
        sortBy = 'relevance'
      } = options;

      // Build filter
      const filter = {};

      // Text search if query provided
      if (query && query.trim().length >= 2) {
        filter.$text = { $search: query.trim() };
      }

      // Category filter
      if (category) {
        filter.categories_tags = { $regex: category, $options: 'i' };
      }

      // Brand filter
      if (brand) {
        filter.brands = { $regex: brand, $options: 'i' };
      }

      // Ecoscore filter
      if (ecoScore) {
        filter.ecoscore_grade = ecoScore.toLowerCase();
      }

      // Build sort options
      let sort = {};
      switch (sortBy) {
        case 'name_asc':
          sort = { product_name: 1 };
          break;
        case 'eco_best':
          sort = { ecoscore_grade: 1 };
          break;
        case 'carbon_asc':
        case 'carbon_desc':
          // Carbon sorting done after formatting
          sort = query ? { score: { $meta: 'textScore' } } : { product_name: 1 };
          break;
        case 'relevance':
        default:
          sort = query ? { score: { $meta: 'textScore' } } : { product_name: 1 };
      }

      // Projection - only fetch needed fields for performance
      const projection = {
        code: 1,
        product_name: 1,
        brands: 1,
        categories: 1,
        categories_tags: 1,
        ecoscore_grade: 1,
        nutriscore_grade: 1,
        co2_total: 1,
        nutriments: 1,
        product_type: 1,
        image_url: 1,
        serving_size: 1
      };

      // Add text score to projection if using text search
      if (query) {
        projection.score = { $meta: 'textScore' };
      }

      // Execute query with proper pagination
      console.log('[ProductRepository] Executing query with filter:', JSON.stringify(filter), 'sort:', sort);
      const results = await products
        .find(filter, { projection })
        .sort(sort)
        .skip(skip)
        .limit(limit * 2) // Get extra for post-filtering
        .toArray();

      console.log('[ProductRepository] Query returned', results.length, 'results');
      return results;
    } catch (error) {
      console.error('[ProductRepository] Error searching products:', {
        message: error.message,
        stack: error.stack,
        query: query,
        options: options,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  /**
   * Get products by category
   * @param {string} category - Category name
   * @param {object} options - Pagination options
   * @returns {Promise<object[]>} Array of raw product documents
   */
  async findByCategory(category, options = {}) {
    try {
      const products = this.getCollection();
      const { limit = 20, skip = 0 } = options;

      const results = await products
        .find({ 
          categories_tags: { $regex: category, $options: 'i' }
        })
        .sort({ product_name: 1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      return results;
    } catch (error) {
      console.error('[ProductRepository] Error finding by category:', error);
      throw error;
    }
  }

  /**
   * Get random products
   * @param {number} count - Number of products to return
   * @returns {Promise<object[]>} Array of raw product documents
   */
  async getRandom(count = 10) {
    try {
      const products = this.getCollection();
      
      const results = await products
        .aggregate([
          { $sample: { size: Math.min(count, 100) } },
          {
            $project: {
              code: 1,
              product_name: 1,
              brands: 1,
              categories: 1,
              categories_tags: 1,
              ecoscore_grade: 1,
              nutriscore_grade: 1,
              co2_total: 1,
              nutriments: 1,
              product_type: 1,
              image_url: 1,
              serving_size: 1
            }
          }
        ])
        .toArray();

      return results;
    } catch (error) {
      console.error('[ProductRepository] Error getting random products:', error);
      throw error;
    }
  }

  /**
   * Get all unique categories
   * @returns {Promise<string[]>} Array of category names
   */
  async getCategories() {
    try {
      const products = this.getCollection();
      
      const categories = await products
        .distinct('categories_tags')
        .then(tags => 
          tags
            .filter(tag => tag && tag.length > 0 && tag.length < 50)
            .map(tag => tag.replace(/^en:/, '').replace(/-/g, ' '))
            .filter((tag, index, self) => self.indexOf(tag) === index)
            .sort()
        );

      return categories;
    } catch (error) {
      console.error('[ProductRepository] Error getting categories:', error);
      throw error;
    }
  }

  /**
   * Get all unique brands
   * @returns {Promise<string[]>} Array of brand names
   */
  async getBrands() {
    try {
      const products = this.getCollection();
      
      const brands = await products
        .distinct('brands')
        .then(brandList =>
          brandList
            .filter(brand => brand && brand.length > 0 && brand.length < 100)
            .sort()
        );

      return brands.slice(0, 500); // Limit to top 500 brands
    } catch (error) {
      console.error('[ProductRepository] Error getting brands:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   * @returns {Promise<object>} Database statistics
   */
  async getStats() {
    try {
      const products = this.getCollection();
      
      const [
        totalProducts,
        withBarcodes,
        withEcoScore,
        withNutrition,
        withCarbonData,
        foodProducts,
        beautyProducts,
        petfoodProducts,
        generalProducts
      ] = await Promise.all([
        products.countDocuments(),
        products.countDocuments({ code: { $exists: true, $ne: '' } }),
        products.countDocuments({ ecoscore_grade: { $exists: true, $ne: '' } }),
        products.countDocuments({ 'nutriments.energy-kcal_100g': { $exists: true } }),
        products.countDocuments({ co2_total: { $ne: null, $exists: true } }),
        products.countDocuments({ product_type: 'food' }),
        products.countDocuments({ product_type: 'beauty' }),
        products.countDocuments({ product_type: 'petfood' }),
        products.countDocuments({ product_type: 'product' })
      ]);
      
      return {
        totalProducts,
        withBarcodes,
        withEcoScore,
        withNutrition,
        withCarbonData,
        productTypes: {
          food: foodProducts,
          beauty: beautyProducts,
          petfood: petfoodProducts,
          general: generalProducts
        },
        coverage: {
          barcodes: Math.round((withBarcodes / totalProducts) * 100),
          ecoScore: Math.round((withEcoScore / totalProducts) * 100),
          nutrition: Math.round((withNutrition / totalProducts) * 100),
          carbonData: Math.round((withCarbonData / totalProducts) * 100)
        }
      };
    } catch (error) {
      console.error('[ProductRepository] Error getting stats:', error);
      throw error;
    }
  }

  /**
   * Count products matching filter
   * @param {object} filter - MongoDB filter
   * @returns {Promise<number>} Count
   */
  async count(filter = {}) {
    try {
      const products = this.getCollection();
      return await products.countDocuments(filter);
    } catch (error) {
      console.error('[ProductRepository] Error counting products:', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new ProductRepository();

