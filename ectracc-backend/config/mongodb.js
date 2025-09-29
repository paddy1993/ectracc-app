// MongoDB Atlas Connection Configuration
const { MongoClient } = require('mongodb');

class MongoDBConnection {
  constructor() {
    this.client = null;
    this.db = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      const mongoUri = process.env.MONGODB_URI;
      const dbName = process.env.MONGODB_DATABASE || 'ectracc';

      if (!mongoUri) {
        throw new Error('MONGODB_URI environment variable is not set');
      }

      console.log('Connecting to MongoDB Atlas...');
      
      this.client = new MongoClient(mongoUri, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4 // Use IPv4, skip trying IPv6
      });

      await this.client.connect();
      this.db = this.client.db(dbName);
      this.isConnected = true;

      console.log(`✅ Connected to MongoDB Atlas database: ${dbName}`);

      // Test the connection
      await this.db.admin().ping();
      console.log('✅ MongoDB connection verified');

      // Create indexes for better performance
      await this.createIndexes();

      return this.db;
    } catch (error) {
      console.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async createIndexes() {
    try {
      const products = this.db.collection('products');
      
      // Create indexes for common queries
      await products.createIndex({ code: 1 }, { unique: true }); // Barcode lookup
      await products.createIndex({ product_name: 'text' }); // Text search
      await products.createIndex({ categories: 1 }); // Category filtering
      await products.createIndex({ brands: 1 }); // Brand filtering
      await products.createIndex({ ecoscore_grade: 1 }); // Eco score filtering
      await products.createIndex({ 'nutriments.energy-kcal_100g': 1 }); // Nutrition sorting
      
      console.log('✅ MongoDB indexes created successfully');
    } catch (error) {
      console.warn('⚠️ Index creation warning:', error.message);
    }
  }

  getDatabase() {
    if (!this.isConnected || !this.db) {
      throw new Error('MongoDB not connected. Call connect() first.');
    }
    return this.db;
  }

  getCollection(name) {
    return this.getDatabase().collection(name);
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.isConnected = false;
      console.log('✅ MongoDB connection closed');
    }
  }

  async getStats() {
    try {
      const db = this.getDatabase();
      const products = db.collection('products');
      
      const stats = {
        totalProducts: await products.countDocuments(),
        withBarcodes: await products.countDocuments({ code: { $exists: true, $ne: '' } }),
        withEcoScore: await products.countDocuments({ ecoscore_grade: { $exists: true, $ne: '' } }),
        withNutrition: await products.countDocuments({ 'nutriments.energy-kcal_100g': { $exists: true } }),
        lastUpdated: new Date().toISOString()
      };

      return stats;
    } catch (error) {
      console.error('Error getting database stats:', error);
      return null;
    }
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', error: 'Not connected to MongoDB' };
      }

      await this.db.admin().ping();
      const stats = await this.getStats();
      
      return {
        status: 'connected',
        database: this.db.databaseName,
        stats: stats
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      };
    }
  }
}

// Export singleton instance
const mongoConnection = new MongoDBConnection();

module.exports = {
  mongoConnection,
  connectMongoDB: () => mongoConnection.connect(),
  getMongoDB: () => mongoConnection.getDatabase(),
  getMongoCollection: (name) => mongoConnection.getCollection(name),
  disconnectMongoDB: () => mongoConnection.disconnect(),
  getMongoStats: () => mongoConnection.getStats(),
  mongoHealthCheck: () => mongoConnection.healthCheck()
};
