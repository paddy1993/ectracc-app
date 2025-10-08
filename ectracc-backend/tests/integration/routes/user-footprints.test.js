const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const userFootprintsRouter = require('../../../routes/user-footprints');

describe('User Footprints API Integration Tests', () => {
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
      getMongoCollection: (collectionName) => db.collection(collectionName)
    }));

    // Create Express app for testing
    app = express();
    app.use(express.json());
    
    // Mock authentication middleware
    app.use((req, res, next) => {
      req.user = { id: 'test-user-123' };
      next();
    });
    
    app.use('/api/user-footprints', userFootprintsRouter);
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await db.collection('user_footprints').deleteMany({});
  });

  describe('POST /api/user-footprints/track', () => {
    test('should track a new footprint entry', async () => {
      const footprintData = {
        product_id: new ObjectId().toString(),
        product_name: 'Test Product',
        carbon_total: 2.5,
        quantity: 1,
        unit: 'item',
        carbon_footprint_source: 'manual_research',
        carbon_footprint_reference: 'Test Study',
        is_manual_entry: false,
        category: 'Test Category'
      };

      const response = await request(app)
        .post('/api/user-footprints/track')
        .send(footprintData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeTruthy();

      // Verify entry was saved to database
      const savedEntry = await db.collection('user_footprints').findOne({
        user_id: 'test-user-123'
      });

      expect(savedEntry).toBeTruthy();
      expect(savedEntry.product_name).toBe('Test Product');
      expect(savedEntry.carbon_total).toBe(2.5);
    });

    test('should validate required fields', async () => {
      const incompleteData = {
        product_name: 'Test Product'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/user-footprints/track')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation error');
    });

    test('should handle manual entries without product_id', async () => {
      const manualData = {
        product_name: 'Manual Entry',
        carbon_total: 1.5,
        quantity: 2,
        unit: 'kg',
        is_manual_entry: true,
        category: 'Manual Category'
      };

      const response = await request(app)
        .post('/api/user-footprints/track')
        .send(manualData)
        .expect(201);

      expect(response.body.success).toBe(true);
      
      const savedEntry = await db.collection('user_footprints').findOne({
        product_name: 'Manual Entry'
      });

      expect(savedEntry.is_manual_entry).toBe(true);
      expect(savedEntry.product_id).toBeNull();
    });

    test('should respect rate limiting', async () => {
      const footprintData = {
        product_name: 'Rate Test',
        carbon_total: 1.0,
        quantity: 1,
        unit: 'item',
        category: 'Test'
      };

      // Make many requests quickly
      const promises = Array(35).fill().map(() => 
        request(app)
          .post('/api/user-footprints/track')
          .send(footprintData)
      );

      const responses = await Promise.all(promises);
      
      // Some requests should be rate limited (429)
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('GET /api/user-footprints/history', () => {
    beforeEach(async () => {
      // Insert test data
      const testEntries = [
        {
          user_id: 'test-user-123',
          product_name: 'Product A',
          carbon_total: 2.5,
          logged_at: new Date('2024-01-15'),
          category: 'dairy'
        },
        {
          user_id: 'test-user-123',
          product_name: 'Product B',
          carbon_total: 1.8,
          logged_at: new Date('2024-01-16'),
          category: 'vegetables'
        },
        {
          user_id: 'other-user',
          product_name: 'Other Product',
          carbon_total: 3.0,
          logged_at: new Date('2024-01-15'),
          category: 'meat'
        }
      ];

      await db.collection('user_footprints').insertMany(testEntries);
    });

    test('should get user history with default parameters', async () => {
      const response = await request(app)
        .get('/api/user-footprints/history')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      
      // Should only return entries for the authenticated user
      const allEntries = response.body.data.flatMap(group => group.entries || []);
      allEntries.forEach(entry => {
        expect(entry.user_id).toBe('test-user-123');
      });
    });

    test('should filter by period', async () => {
      const response = await request(app)
        .get('/api/user-footprints/history')
        .query({ period: 'day' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
    });

    test('should handle pagination', async () => {
      const response = await request(app)
        .get('/api/user-footprints/history')
        .query({ page: 1, limit: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
    });

    test('should validate query parameters', async () => {
      const response = await request(app)
        .get('/api/user-footprints/history')
        .query({ period: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Validation error');
    });
  });

  describe('GET /api/user-footprints/category-breakdown', () => {
    beforeEach(async () => {
      const testEntries = [
        {
          user_id: 'test-user-123',
          carbon_total: 2.5,
          logged_at: new Date('2024-01-15'),
          category: 'dairy'
        },
        {
          user_id: 'test-user-123',
          carbon_total: 1.8,
          logged_at: new Date('2024-01-16'),
          category: 'dairy'
        },
        {
          user_id: 'test-user-123',
          carbon_total: 5.0,
          logged_at: new Date('2024-01-17'),
          category: 'meat'
        }
      ];

      await db.collection('user_footprints').insertMany(testEntries);
    });

    test('should return category breakdown', async () => {
      const response = await request(app)
        .get('/api/user-footprints/category-breakdown')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data).toHaveLength(2);

      const meatCategory = response.body.data.find(cat => cat._id === 'meat');
      const dairyCategory = response.body.data.find(cat => cat._id === 'dairy');

      expect(meatCategory.total_carbon).toBe(5.0);
      expect(dairyCategory.total_carbon).toBe(4.3);
    });
  });

  describe('GET /api/user-footprints/daily', () => {
    beforeEach(async () => {
      const testEntries = [
        {
          user_id: 'test-user-123',
          carbon_total: 2.5,
          logged_at: new Date('2024-01-15T10:00:00Z')
        },
        {
          user_id: 'test-user-123',
          carbon_total: 1.8,
          logged_at: new Date('2024-01-15T14:00:00Z')
        }
      ];

      await db.collection('user_footprints').insertMany(testEntries);
    });

    test('should return daily footprint for specific date', async () => {
      const response = await request(app)
        .get('/api/user-footprints/daily')
        .query({ date: '2024-01-15' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total_carbon).toBe(4.3);
      expect(response.body.data.count).toBe(2);
    });

    test('should return daily footprint for current date by default', async () => {
      const response = await request(app)
        .get('/api/user-footprints/daily')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_carbon');
      expect(response.body.data).toHaveProperty('count');
    });
  });

  describe('GET /api/user-footprints/recent', () => {
    beforeEach(async () => {
      const testEntries = [
        {
          user_id: 'test-user-123',
          product_name: 'Product A',
          logged_at: new Date('2024-01-15')
        },
        {
          user_id: 'test-user-123',
          product_name: 'Product B',
          logged_at: new Date('2024-01-16')
        },
        {
          user_id: 'test-user-123',
          product_name: 'Product C',
          logged_at: new Date('2024-01-17')
        }
      ];

      await db.collection('user_footprints').insertMany(testEntries);
    });

    test('should return recent entries in correct order', async () => {
      const response = await request(app)
        .get('/api/user-footprints/recent')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.data[0].product_name).toBe('Product C'); // Most recent first
    });

    test('should respect limit parameter', async () => {
      const response = await request(app)
        .get('/api/user-footprints/recent')
        .query({ limit: 2 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('Authentication', () => {
    test('should require authentication for all endpoints', async () => {
      // Create app without auth middleware
      const unauthenticatedApp = express();
      unauthenticatedApp.use(express.json());
      unauthenticatedApp.use('/api/user-footprints', userFootprintsRouter);

      const response = await request(unauthenticatedApp)
        .get('/api/user-footprints/recent')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Error handling', () => {
    test('should handle database errors gracefully', async () => {
      // Close database connection to simulate error
      await mongoClient.close();

      const response = await request(app)
        .get('/api/user-footprints/recent')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch recent footprint entries');

      // Reconnect for cleanup
      await mongoClient.connect();
      db = mongoClient.db('test');
    });
  });
});
