// Base Component Model for Common Ingredient Carbon Footprints
const { getMongoCollection } = require('../config/mongodb');

class BaseComponent {
  constructor() {
    this.collection = null;
  }

  getCollection() {
    if (!this.collection) {
      this.collection = getMongoCollection('base_components');
    }
    return this.collection;
  }

  // Get all base components
  async getAll() {
    try {
      const components = this.getCollection();
      const results = await components.find({}).sort({ category: 1, name: 1 }).toArray();
      return results.map(component => this.formatComponent(component));
    } catch (error) {
      console.error('Error getting base components:', error);
      throw error;
    }
  }

  // Get base components by category
  async getByCategory(category) {
    try {
      const components = this.getCollection();
      const results = await components.find({ category }).sort({ name: 1 }).toArray();
      return results.map(component => this.formatComponent(component));
    } catch (error) {
      console.error('Error getting base components by category:', error);
      throw error;
    }
  }

  // Search base components
  async search(query) {
    try {
      const components = this.getCollection();
      const filter = {
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { category: { $regex: query, $options: 'i' } },
          { description: { $regex: query, $options: 'i' } }
        ]
      };
      
      const results = await components.find(filter).sort({ category: 1, name: 1 }).toArray();
      return results.map(component => this.formatComponent(component));
    } catch (error) {
      console.error('Error searching base components:', error);
      throw error;
    }
  }

  // Get component by ID
  async getById(id) {
    try {
      const components = this.getCollection();
      const component = await components.findOne({ _id: id });
      
      if (component) {
        return this.formatComponent(component);
      }
      
      return null;
    } catch (error) {
      console.error('Error getting base component by ID:', error);
      throw error;
    }
  }

  // Create new base component
  async create(componentData) {
    try {
      const components = this.getCollection();
      const component = {
        ...componentData,
        created_at: new Date(),
        updated_at: new Date()
      };
      
      const result = await components.insertOne(component);
      return this.formatComponent({ ...component, _id: result.insertedId });
    } catch (error) {
      console.error('Error creating base component:', error);
      throw error;
    }
  }

  // Update base component
  async update(id, updateData) {
    try {
      const components = this.getCollection();
      const result = await components.updateOne(
        { _id: id },
        { 
          $set: {
            ...updateData,
            updated_at: new Date()
          }
        }
      );
      
      if (result.matchedCount === 0) {
        throw new Error('Base component not found');
      }
      
      return await this.getById(id);
    } catch (error) {
      console.error('Error updating base component:', error);
      throw error;
    }
  }

  // Delete base component
  async delete(id) {
    try {
      const components = this.getCollection();
      const result = await components.deleteOne({ _id: id });
      
      if (result.deletedCount === 0) {
        throw new Error('Base component not found');
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting base component:', error);
      throw error;
    }
  }

  // Bulk insert base components
  async bulkInsert(componentsData) {
    try {
      const components = this.getCollection();
      const timestamp = new Date();
      
      const componentsWithTimestamps = componentsData.map(component => ({
        ...component,
        created_at: timestamp,
        updated_at: timestamp
      }));
      
      const result = await components.insertMany(componentsWithTimestamps);
      return result.insertedCount;
    } catch (error) {
      console.error('Error bulk inserting base components:', error);
      throw error;
    }
  }

  // Get categories
  async getCategories() {
    try {
      const components = this.getCollection();
      const categories = await components.distinct('category');
      return categories.sort();
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Format component for API response
  formatComponent(component) {
    if (!component) return null;

    return {
      id: component._id,
      name: component.name,
      category: component.category,
      carbon_footprint: component.carbon_footprint,
      unit: component.unit,
      source: component.source,
      description: component.description || null,
      created_at: component.created_at,
      updated_at: component.updated_at
    };
  }

  // Create indexes for the collection
  async createIndexes() {
    try {
      const components = this.getCollection();
      
      // Create indexes for efficient querying
      await components.createIndex({ category: 1, name: 1 });
      await components.createIndex({ name: 1 });
      await components.createIndex({ category: 1 });
      
      console.log('✅ Base components indexes created');
    } catch (error) {
      console.error('Error creating base components indexes:', error);
      throw error;
    }
  }

  // Get statistics
  async getStats() {
    try {
      const components = this.getCollection();
      
      const totalComponents = await components.countDocuments();
      const categoriesCount = await components.distinct('category');
      
      // Get breakdown by category
      const categoryBreakdown = await components.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            avgFootprint: { $avg: '$carbon_footprint' }
          }
        },
        { $sort: { _id: 1 } }
      ]).toArray();
      
      return {
        totalComponents,
        totalCategories: categoriesCount.length,
        categoryBreakdown: categoryBreakdown.map(cat => ({
          category: cat._id,
          count: cat.count,
          avgFootprint: Math.round(cat.avgFootprint * 100) / 100
        }))
      };
    } catch (error) {
      console.error('Error getting base components stats:', error);
      throw error;
    }
  }
}

module.exports = new BaseComponent();
