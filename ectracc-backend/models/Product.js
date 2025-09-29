// Product Model for Open Food Facts Data
const { getMongoCollection } = require('../config/mongodb');

class Product {
  constructor() {
    this.collection = null;
  }

  getCollection() {
    if (!this.collection) {
      this.collection = getMongoCollection('products');
    }
    return this.collection;
  }

  // Find product by barcode
  async findByBarcode(barcode) {
    try {
      const products = this.getCollection();
      const product = await products.findOne({ code: barcode });
      
      if (product) {
        return this.formatProduct(product);
      }
      
      return null;
    } catch (error) {
      console.error('Error finding product by barcode:', error);
      throw error;
    }
  }

  // Search products by name or brand
  async search(query, options = {}) {
    try {
      const products = this.getCollection();
    const {
        limit = 20,
        skip = 0,
      category = null,
        brand = null,
      ecoScore = null,
      sortBy = 'relevance'
    } = options;

      // Build search filter
      const filter = {
        $text: { $search: query }
      };

      // Add additional filters
      if (category) {
        filter.categories = { $regex: category, $options: 'i' };
      }
      
      if (brand) {
        filter.brands = { $regex: brand, $options: 'i' };
      }
      
      if (ecoScore) {
        filter.ecoscore_grade = ecoScore.toLowerCase();
      }

      // Build sort options
      let sort = {};
    switch (sortBy) {
        case 'name':
          sort = { product_name: 1 };
          break;
        case 'ecoscore':
          sort = { ecoscore_grade: 1 };
        break;
        case 'nutrition':
          sort = { 'nutriments.energy-kcal_100g': 1 };
        break;
      default:
          sort = { score: { $meta: 'textScore' } };
      }

      const results = await products
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();

      return results.map(product => this.formatProduct(product));
    } catch (error) {
      console.error('Error searching products:', error);
      throw error;
    }
  }

  // Get products by category
  async getByCategory(category, options = {}) {
    try {
      const products = this.getCollection();
      const { limit = 20, skip = 0 } = options;

      const results = await products
        .find({ categories: { $regex: category, $options: 'i' } })
        .sort({ product_name: 1 })
        .skip(skip)
        .limit(limit)
        .toArray();

      return results.map(product => this.formatProduct(product));
    } catch (error) {
      console.error('Error getting products by category:', error);
      throw error;
    }
  }

  // Get random products (for discovery)
  async getRandom(count = 10) {
    try {
      const products = this.getCollection();
      
      const results = await products
        .aggregate([
          { $sample: { size: count } },
          { $match: { product_name: { $exists: true, $ne: '' } } }
        ])
        .toArray();

      return results.map(product => this.formatProduct(product));
    } catch (error) {
      console.error('Error getting random products:', error);
      throw error;
    }
  }

  // Get popular categories
  async getCategories(limit = 50) {
    try {
      const products = this.getCollection();
      
      const categories = await products
        .aggregate([
          { $unwind: '$categories' },
          { $group: { _id: '$categories', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit },
          { $project: { category: '$_id', count: 1, _id: 0 } }
        ])
        .toArray();

      return categories;
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Get popular brands
  async getBrands(limit = 50) {
    try {
      const products = this.getCollection();
      
      const brands = await products
        .aggregate([
          { $unwind: '$brands' },
          { $group: { _id: '$brands', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: limit },
          { $project: { brand: '$_id', count: 1, _id: 0 } }
        ])
        .toArray();

      return brands;
    } catch (error) {
      console.error('Error getting brands:', error);
      throw error;
    }
  }

  // Format product data for API response
  formatProduct(product) {
    if (!product) return null;

    // Calculate carbon footprint estimate based on available data
    const carbonFootprint = this.calculateCarbonFootprint(product);

    return {
      id: product._id,
      code: product.code,
      product_name: product.product_name || 'Unknown Product',
      brands: Array.isArray(product.brands) ? product.brands : 
              (product.brands ? [product.brands] : []),
      categories: Array.isArray(product.categories) ? product.categories : 
                  (product.categories ? [product.categories] : []),
      ecoscore_grade: product.ecoscore_grade || null,
      nutriscore_grade: product.nutriscore_grade || null,
      nutrition_info: this.formatNutrition(product.nutriments),
      ingredients_count: product.ingredients ? product.ingredients.length : 0,
      carbon_footprint: carbonFootprint,
      last_updated: product.last_modified_t ? 
                   new Date(product.last_modified_t * 1000).toISOString() : 
                   new Date().toISOString(),
      // Remove image data to save bandwidth
      image_url: null, // We're not storing images
      packaging: product.packaging || null,
      countries: product.countries || null,
      manufacturing_places: product.manufacturing_places || null
    };
  }

  // Format nutrition data
  formatNutrition(nutriments) {
    if (!nutriments) return null;

      return {
      energy_kcal: nutriments['energy-kcal_100g'] || null,
      energy_kj: nutriments['energy-kj_100g'] || null,
      fat: nutriments['fat_100g'] || null,
      saturated_fat: nutriments['saturated-fat_100g'] || null,
      carbohydrates: nutriments['carbohydrates_100g'] || null,
      sugars: nutriments['sugars_100g'] || null,
      fiber: nutriments['fiber_100g'] || null,
      proteins: nutriments['proteins_100g'] || null,
      salt: nutriments['salt_100g'] || null,
      sodium: nutriments['sodium_100g'] || null
    };
  }

  // Calculate estimated carbon footprint
  calculateCarbonFootprint(product) {
    // This is a simplified calculation - you can enhance this later
    let footprint = 2.5; // Base footprint in kg CO2e

    // Adjust based on categories
    if (product.categories) {
      const categories = Array.isArray(product.categories) ? 
                        product.categories : [product.categories];
      
      for (const category of categories) {
        const cat = category.toLowerCase();
        
        // Meat and dairy have higher footprints
        if (cat.includes('meat') || cat.includes('beef') || cat.includes('pork')) {
          footprint += 5.0;
        } else if (cat.includes('dairy') || cat.includes('cheese') || cat.includes('milk')) {
          footprint += 2.0;
        } else if (cat.includes('fish') || cat.includes('seafood')) {
          footprint += 1.5;
        } else if (cat.includes('vegetable') || cat.includes('fruit')) {
          footprint -= 1.0;
        } else if (cat.includes('organic')) {
          footprint -= 0.5;
        }
      }
    }

    // Adjust based on packaging
    if (product.packaging) {
      const packaging = product.packaging.toLowerCase();
      if (packaging.includes('plastic')) {
        footprint += 0.3;
      } else if (packaging.includes('glass')) {
        footprint += 0.2;
      } else if (packaging.includes('cardboard') || packaging.includes('paper')) {
        footprint += 0.1;
      }
    }

    // Adjust based on eco score
    if (product.ecoscore_grade) {
      const grade = product.ecoscore_grade.toLowerCase();
      switch (grade) {
        case 'a':
          footprint *= 0.7;
          break;
        case 'b':
          footprint *= 0.85;
          break;
        case 'd':
          footprint *= 1.15;
          break;
        case 'e':
          footprint *= 1.3;
          break;
      }
    }

    return Math.max(0.1, Math.round(footprint * 100) / 100); // Minimum 0.1, round to 2 decimals
  }

  // Get database statistics
  async getStats() {
    try {
      const products = this.getCollection();
      
      const totalProducts = await products.countDocuments();
      const withBarcodes = await products.countDocuments({ 
        code: { $exists: true, $ne: '' } 
      });
      const withEcoScore = await products.countDocuments({ 
        ecoscore_grade: { $exists: true, $ne: '' } 
      });
      const withNutrition = await products.countDocuments({ 
        'nutriments.energy-kcal_100g': { $exists: true } 
      });
      
      return {
        totalProducts,
        withBarcodes,
        withEcoScore,
        withNutrition,
        coverage: {
          barcodes: Math.round((withBarcodes / totalProducts) * 100),
          ecoScore: Math.round((withEcoScore / totalProducts) * 100),
          nutrition: Math.round((withNutrition / totalProducts) * 100)
        }
      };
    } catch (error) {
      console.error('Error getting product stats:', error);
      throw error;
    }
  }
}

module.exports = new Product();