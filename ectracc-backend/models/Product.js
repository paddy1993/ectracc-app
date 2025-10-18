// Product Model for Open Food Facts Data
const { getMongoCollection } = require('../config/mongodb');

class Product {
  constructor() {
    this.collection = null;
  }

  getCollection() {
    if (!this.collection) {
      this.collection = getMongoCollection('food_products');
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

  // Find product by MongoDB _id
  async findById(id) {
    try {
      const products = this.getCollection();
      const { ObjectId } = require('mongodb');
      
      // Handle both string and ObjectId formats
      let objectId;
      if (typeof id === 'string') {
        // Check if it's a valid ObjectId string
        if (ObjectId.isValid(id)) {
          objectId = new ObjectId(id);
        } else {
          console.log('Invalid ObjectId format:', id);
          return null;
        }
      } else if (id instanceof ObjectId) {
        objectId = id;
      } else {
        console.log('Invalid ID type:', typeof id, id);
        return null;
      }
      
      const product = await products.findOne({ _id: objectId });
      return product ? this.formatProduct(product) : null;
    } catch (error) {
      console.error('Error finding product by ID:', error);
      return null;
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
        minCarbon = null,
        maxCarbon = null,
      sortBy = 'relevance'
    } = options;

      // Build search filter
      const filter = {
        $text: { $search: query }
      };

      // Add additional filters
      if (category) {
        if (Array.isArray(category)) {
          filter.categories = { $in: category.map(cat => new RegExp(cat, 'i')) };
        } else {
          filter.categories = { $regex: category, $options: 'i' };
        }
      }
      
      if (brand) {
        if (Array.isArray(brand)) {
          filter.brands = { $in: brand.map(b => new RegExp(b, 'i')) };
        } else {
          filter.brands = { $regex: brand, $options: 'i' };
        }
      }
      
      if (ecoScore) {
        if (Array.isArray(ecoScore)) {
          filter.ecoscore_grade = { $in: ecoScore.map(score => score.toLowerCase()) };
        } else {
          filter.ecoscore_grade = ecoScore.toLowerCase();
        }
      }

      // Carbon footprint filtering (we'll calculate this on the fly)
      if (minCarbon !== null || maxCarbon !== null) {
        // For now, we'll filter after calculation since carbon footprint is computed
        // In a production system, you'd want to pre-calculate and index this
      }

      // Build sort options
      let sort = {};
    switch (sortBy) {
        case 'name_asc':
          sort = { product_name: 1 };
          break;
        case 'eco_best':
          sort = { ecoscore_grade: 1 }; // A comes before E
          break;
      case 'carbon_asc':
          // We'll sort after calculating carbon footprint
          sort = { score: { $meta: 'textScore' } };
        break;
      case 'carbon_desc':
          // We'll sort after calculating carbon footprint  
          sort = { score: { $meta: 'textScore' } };
        break;
      case 'relevance':
      default:
          sort = { score: { $meta: 'textScore' } };
      }

      let results = await products
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit * 2) // Get more results for carbon filtering
        .toArray();

      // Format products and calculate carbon footprints
      let formattedProducts = results.map(product => this.formatProduct(product));

      // Apply carbon footprint filtering
      if (minCarbon !== null || maxCarbon !== null) {
        formattedProducts = formattedProducts.filter(product => {
          const carbon = product.carbon_footprint;
          if (minCarbon !== null && carbon < minCarbon) return false;
          if (maxCarbon !== null && carbon > maxCarbon) return false;
          return true;
        });
      }

      // Apply carbon-based sorting
      if (sortBy === 'carbon_asc') {
        formattedProducts.sort((a, b) => a.carbon_footprint - b.carbon_footprint);
      } else if (sortBy === 'carbon_desc') {
        formattedProducts.sort((a, b) => b.carbon_footprint - a.carbon_footprint);
      }

      // Limit to requested amount after filtering
      return formattedProducts.slice(0, limit);
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

    // Use real carbon footprint data if available, otherwise calculate estimate
    const carbonFootprint = product.co2_total || this.calculateCarbonFootprint(product);
    
    // Determine carbon footprint source
    let carbonFootprintSource = 'estimated';
    let carbonFootprintReference = null;
    
    if (product.co2_total) {
      carbonFootprintSource = 'agribalyse';
      carbonFootprintReference = 'Agribalyse (French Environmental Agency)';
    } else if (product.carbon_footprint_source) {
      carbonFootprintSource = product.carbon_footprint_source;
      carbonFootprintReference = product.carbon_footprint_reference;
    } else if (product.is_base_component) {
      carbonFootprintSource = 'base_component';
      carbonFootprintReference = product.carbon_footprint_reference || 'Research average from multiple studies';
    }

    return {
      id: product._id?.toString(),
      code: product.code,
      product_name: product.product_name || 'Unknown Product',
      brands: Array.isArray(product.brands) ? product.brands : 
              (product.brands ? [product.brands] : []),
      categories: Array.isArray(product.categories) ? product.categories : 
                  (product.categories ? [product.categories] : []),
      categories_hierarchy: product.categories_hierarchy || [],
      ecoscore_grade: product.ecoscore_grade || null,
      environmental_score_grade: product.environmental_score_grade || null,
      nutriscore_grade: product.nutriscore_grade || null,
      nutrition_info: this.formatNutrition(product.nutriments),
      ingredients_text: product.ingredients_text || null,
      ingredients_count: product.ingredients ? product.ingredients.length : 0,
      labels: product.labels || null,
      carbon_footprint: carbonFootprint,
      // Carbon footprint source information
      carbon_footprint_source: carbonFootprintSource,
      carbon_footprint_reference: carbonFootprintReference,
      // Detailed carbon footprint breakdown (if available)
      carbon_footprint_details: product.co2_total ? {
        total: product.co2_total,
        agriculture: product.co2_agriculture || null,
        processing: product.co2_processing || null,
        transportation: product.co2_transportation || null,
        packaging: product.co2_packaging || null,
        distribution: product.co2_distribution || null
      } : null,
      product_type: product.product_type || 'food',
      source_database: product.source_database || 'openfoodfacts',
      has_barcode: product.has_barcode !== false, // Default to true for existing products
      is_base_component: product.is_base_component || false,
      last_updated: product.last_modified_t ? 
                   new Date(product.last_modified_t * 1000).toISOString() : 
                   (product.imported_at || new Date().toISOString()),
      // Remove image data to save bandwidth
      image_url: null, // We're not storing images
      
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
      stores: Array.isArray(product.stores) ? product.stores : 
              (product.stores ? [product.stores] : null),
      countries: Array.isArray(product.countries) ? product.countries : 
                 (product.countries ? [product.countries] : null),
      
      // Enrichment tracking
      last_enriched: product.last_enriched || null
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
      const withCarbonData = await products.countDocuments({
        co2_total: { $ne: null, $exists: true }
      });
      const foodProducts = await products.countDocuments({ product_type: 'food' });
      const beautyProducts = await products.countDocuments({ product_type: 'beauty' });
      const petfoodProducts = await products.countDocuments({ product_type: 'petfood' });
      const generalProducts = await products.countDocuments({ product_type: 'product' });
      
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
      console.error('Error getting product stats:', error);
      throw error;
    }
  }
}

module.exports = new Product();