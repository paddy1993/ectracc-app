const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');
const express = require('express');
const productsRouter = require('../../../routes/products');

describe('Products API Integration Tests', () => {
  let app;
  let mongoServer;
  let mongoClient;
  let db;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    db = mongoClient.db('test');
    
    // Mock the MongoDB configuration
    jest.doMock('../../../config/mongodb', () => ({
      getMongoCollection: (collectionName) => db.collection(collectionName),
      mongoHealthCheck: async () => ({ status: 'connected' })
    }));

    // Create Express app for testing
    app = express();
    app.use(express.json());
    app.use('/api/products', productsRouter);
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear and seed test data
    await db.collection('products').deleteMany({});
    
    const testProducts = [
      {
        code: '1111111111111',
        product_name: 'Organic Milk',
        brands: ['Organic Brand'],
        categories: ['dairy', 'milk'],
        co2_total: 3.2,
        carbon_footprint_source: 'agribalyse',
        has_barcode: true,
        is_base_component: false,
        source_database: 'openfoodfacts'
      },
      {
        code: '2222222222222',
        product_name: 'Beef Burger',
        brands: ['Meat Co'],
        categories: ['meat', 'beef'],
        co2_total: 25.0,
        carbon_footprint_source: 'agribalyse',
        has_barcode: true,
        is_base_component: false,
        source_database: 'openfoodfacts'
      },
      {
        code: '3333333333333',
        product_name: 'Fresh Carrots',
        brands: ['Veggie Farm'],
        categories: ['vegetables', 'fresh'],
        co2_total: 0.4,
        carbon_footprint_source: 'manual_research',
        has_barcode: true,
        is_base_component: false,
        source_database: 'manual'
      }
    ];

    await db.collection('products').insertMany(testProducts);
  });

  describe('GET /api/products/search', () => {
    test('should search products by query', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'milk' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].product_name).toBe('Organic Milk');
      expect(response.body.data.totalPages).toBe(1);
      expect(response.body.data.currentPage).toBe(1);
    });

    test('should filter by categories', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ categories: 'meat' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].product_name).toBe('Beef Burger');
    });

    test('should filter by carbon footprint range', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ minCarbon: 0, maxCarbon: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].product_name).toBe('Fresh Carrots');
    });

    test('should filter by sources', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ sources: 'manual_research' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].product_name).toBe('Fresh Carrots');
    });

    test('should sort by carbon footprint ascending', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ sortBy: 'carbon_asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(3);
      expect(response.body.data.products[0].product_name).toBe('Fresh Carrots');
      expect(response.body.data.products[2].product_name).toBe('Beef Burger');
    });

    test('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ page: 2, limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.currentPage).toBe(2);
      expect(response.body.data.totalPages).toBe(2);
    });

    test('should return empty results for no matches', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'nonexistent' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(0);
      expect(response.body.data.totalPages).toBe(0);
    });

    test('should handle invalid parameters gracefully', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ page: 'invalid', limit: 'invalid' })
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should use default values
      expect(response.body.data.currentPage).toBe(1);
    });
  });

  describe('GET /api/products/barcode/:barcode', () => {
    test('should find product by barcode', async () => {
      const response = await request(app)
        .get('/api/products/barcode/1111111111111')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.product_name).toBe('Organic Milk');
      expect(response.body.data.code).toBe('1111111111111');
    });

    test('should return 404 for non-existent barcode', async () => {
      const response = await request(app)
        .get('/api/products/barcode/9999999999999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Product not found');
    });

    test('should validate barcode format', async () => {
      const response = await request(app)
        .get('/api/products/barcode/invalid')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid barcode format');
    });
  });

  describe('GET /api/products/categories', () => {
    test('should return unique categories', async () => {
      const response = await request(app)
        .get('/api/products/categories')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toContain('dairy');
      expect(response.body.data).toContain('meat');
      expect(response.body.data).toContain('vegetables');
      
      // Should not have duplicates
      const uniqueCategories = [...new Set(response.body.data)];
      expect(response.body.data.length).toBe(uniqueCategories.length);
    });
  });

  describe('GET /api/products/brands', () => {
    test('should return unique brands', async () => {
      const response = await request(app)
        .get('/api/products/brands')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toContain('Organic Brand');
      expect(response.body.data).toContain('Meat Co');
      expect(response.body.data).toContain('Veggie Farm');
      
      // Should not have duplicates
      const uniqueBrands = [...new Set(response.body.data)];
      expect(response.body.data.length).toBe(uniqueBrands.length);
    });
  });

  describe('GET /api/products/random', () => {
    test('should return random products', async () => {
      const response = await request(app)
        .get('/api/products/random')
        .query({ limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0]).toHaveProperty('product_name');
      expect(response.body.data[0]).toHaveProperty('carbon_footprint');
    });

    test('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/products/random')
        .query({ limit: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });

    test('should handle limit exceeding available products', async () => {
      const response = await request(app)
        .get('/api/products/random')
        .query({ limit: 100 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(3);
    });
  });

  describe('GET /api/products/stats', () => {
    test('should return database statistics', async () => {
      const response = await request(app)
        .get('/api/products/stats')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('totalProducts');
      expect(response.body.data).toHaveProperty('totalCategories');
      expect(response.body.data).toHaveProperty('totalBrands');
      expect(response.body.data).toHaveProperty('sourceBreakdown');
      
      expect(response.body.data.totalProducts).toBe(3);
      expect(response.body.data.totalCategories).toBeGreaterThan(0);
      expect(response.body.data.totalBrands).toBe(3);
    });
  });

  describe('Error handling', () => {
    test('should handle database connection errors', async () => {
      // Mock database error
      jest.doMock('../../../config/mongodb', () => ({
        getMongoCollection: () => { throw new Error('Database error'); },
        mongoHealthCheck: async () => ({ status: 'disconnected' })
      }));

      const response = await request(app)
        .get('/api/products/search')
        .expect(503);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Database unavailable');
    });
  });
});
