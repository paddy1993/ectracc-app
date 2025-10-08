const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
const express = require('express');
const baseComponentsRouter = require('../../../routes/base-components');

describe('Base Components API Integration Tests', () => {
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
    
    // Mock authentication middleware for protected routes
    app.use((req, res, next) => {
      if (req.method !== 'GET') {
        req.user = { id: 'admin-user-123', role: 'admin' };
      }
      next();
    });
    
    app.use('/api/base-components', baseComponentsRouter);
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear and seed test data
    await db.collection('base_components').deleteMany({});
    
    const testComponents = [
      {
        name: 'Beef (average)',
        category: 'Meat & Poultry',
        footprint: 27.0,
        unit: 'per kg',
        source: 'Multiple studies average',
        description: 'Average across production methods',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Milk (whole)',
        category: 'Dairy',
        footprint: 3.2,
        unit: 'per liter',
        source: 'Multiple studies average',
        description: 'Cow\'s milk, whole fat',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        name: 'Carrots',
        category: 'Vegetables',
        footprint: 0.3,
        unit: 'per kg',
        source: 'Multiple studies average',
        description: 'Average carrots',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await db.collection('base_components').insertMany(testComponents);
  });

  describe('GET /api/base-components', () => {
    test('should return all base components', async () => {
      const response = await request(app)
        .get('/api/base-components')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      
      const componentNames = response.body.data.map(c => c.name);
      expect(componentNames).toContain('Beef (average)');
      expect(componentNames).toContain('Milk (whole)');
      expect(componentNames).toContain('Carrots');
    });

    test('should return empty array when no components exist', async () => {
      await db.collection('base_components').deleteMany({});
      
      const response = await request(app)
        .get('/api/base-components')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/base-components/:id', () => {
    let testComponentId;

    beforeEach(async () => {
      const component = await db.collection('base_components').findOne({ name: 'Beef (average)' });
      testComponentId = component._id.toString();
    });

    test('should return component by valid ID', async () => {
      const response = await request(app)
        .get(`/api/base-components/${testComponentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Beef (average)');
      expect(response.body.data.footprint).toBe(27.0);
    });

    test('should return 404 for non-existent ID', async () => {
      const nonExistentId = new ObjectId().toString();
      
      const response = await request(app)
        .get(`/api/base-components/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Base component not found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/base-components/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });
  });

  describe('POST /api/base-components', () => {
    test('should create a new base component', async () => {
      const newComponent = {
        name: 'Chicken (organic)',
        category: 'Meat & Poultry',
        footprint: 6.9,
        unit: 'per kg',
        source: 'Organic farming study',
        description: 'Organic chicken production'
      };

      const response = await request(app)
        .post('/api/base-components')
        .send(newComponent)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeTruthy();

      // Verify component was created in database
      const savedComponent = await db.collection('base_components').findOne({
        name: 'Chicken (organic)'
      });

      expect(savedComponent).toBeTruthy();
      expect(savedComponent.footprint).toBe(6.9);
      expect(savedComponent.created_at).toBeInstanceOf(Date);
    });

    test('should handle missing fields gracefully', async () => {
      const incompleteComponent = {
        name: 'Incomplete Component'
        // Missing other fields
      };

      const response = await request(app)
        .post('/api/base-components')
        .send(incompleteComponent)
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    test('should require authentication', async () => {
      // Create app without auth middleware
      const unauthenticatedApp = express();
      unauthenticatedApp.use(express.json());
      unauthenticatedApp.use('/api/base-components', baseComponentsRouter);

      const response = await request(unauthenticatedApp)
        .post('/api/base-components')
        .send({ name: 'Test' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/base-components/:id', () => {
    let testComponentId;

    beforeEach(async () => {
      const component = await db.collection('base_components').findOne({ name: 'Beef (average)' });
      testComponentId = component._id.toString();
    });

    test('should update existing component', async () => {
      const updateData = {
        name: 'Beef (grass-fed)',
        footprint: 30.0,
        description: 'Grass-fed beef production'
      };

      const response = await request(app)
        .put(`/api/base-components/${testComponentId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Base component updated successfully');

      // Verify update in database
      const updatedComponent = await db.collection('base_components').findOne({
        _id: new ObjectId(testComponentId)
      });

      expect(updatedComponent.name).toBe('Beef (grass-fed)');
      expect(updatedComponent.footprint).toBe(30.0);
      expect(updatedComponent.category).toBe('Meat & Poultry'); // Unchanged field
    });

    test('should return 404 for non-existent component', async () => {
      const nonExistentId = new ObjectId().toString();
      
      const response = await request(app)
        .put(`/api/base-components/${nonExistentId}`)
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Base component not found or no changes made');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .put('/api/base-components/invalid-id')
        .send({ name: 'Updated Name' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });
  });

  describe('DELETE /api/base-components/:id', () => {
    let testComponentId;

    beforeEach(async () => {
      const component = await db.collection('base_components').findOne({ name: 'Carrots' });
      testComponentId = component._id.toString();
    });

    test('should delete existing component', async () => {
      const response = await request(app)
        .delete(`/api/base-components/${testComponentId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Base component deleted successfully');

      // Verify deletion in database
      const deletedComponent = await db.collection('base_components').findOne({
        _id: new ObjectId(testComponentId)
      });

      expect(deletedComponent).toBeNull();
    });

    test('should return 404 for non-existent component', async () => {
      const nonExistentId = new ObjectId().toString();
      
      const response = await request(app)
        .delete(`/api/base-components/${nonExistentId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Base component not found');
    });

    test('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .delete('/api/base-components/invalid-id')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid ID format');
    });
  });

  describe('Error handling', () => {
    test('should handle database errors gracefully', async () => {
      // Close database connection to simulate error
      await mongoClient.close();

      const response = await request(app)
        .get('/api/base-components')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Failed to fetch base components');

      // Reconnect for cleanup
      await mongoClient.connect();
      db = mongoClient.db('test');
    });
  });
});
