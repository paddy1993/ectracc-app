const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
const BaseComponent = require('../../../models/BaseComponent');

describe('BaseComponent Model', () => {
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
    
    // Mock the getMongoCollection function
    jest.doMock('../../../config/mongodb', () => ({
      getMongoCollection: (collectionName) => db.collection(collectionName)
    }));
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await db.collection('base_components').deleteMany({});
  });

  describe('getAll', () => {
    beforeEach(async () => {
      const testComponents = [
        {
          name: 'Beef (average)',
          category: 'Meat & Poultry',
          footprint: 27.0,
          unit: 'per kg',
          source: 'Multiple studies average',
          description: 'Average across production methods'
        },
        {
          name: 'Milk (whole)',
          category: 'Dairy',
          footprint: 3.2,
          unit: 'per liter',
          source: 'Multiple studies average',
          description: 'Cow\'s milk, whole fat'
        }
      ];

      await db.collection('base_components').insertMany(testComponents);
    });

    test('should return all base components', async () => {
      const components = await BaseComponent.getAll();
      
      expect(components).toHaveLength(2);
      expect(components[0].name).toBe('Beef (average)');
      expect(components[1].name).toBe('Milk (whole)');
    });

    test('should return empty array when no components exist', async () => {
      await db.collection('base_components').deleteMany({});
      
      const components = await BaseComponent.getAll();
      expect(components).toEqual([]);
    });
  });

  describe('getById', () => {
    let testComponentId;

    beforeEach(async () => {
      const testComponent = {
        name: 'Test Component',
        category: 'Test Category',
        footprint: 5.0,
        unit: 'per kg',
        source: 'Test Source',
        description: 'Test description'
      };

      const result = await db.collection('base_components').insertOne(testComponent);
      testComponentId = result.insertedId;
    });

    test('should return component by valid ID', async () => {
      const component = await BaseComponent.getById(testComponentId.toString());
      
      expect(component).toBeTruthy();
      expect(component.name).toBe('Test Component');
      expect(component.footprint).toBe(5.0);
    });

    test('should return null for non-existent ID', async () => {
      const nonExistentId = new ObjectId();
      const component = await BaseComponent.getById(nonExistentId.toString());
      
      expect(component).toBeNull();
    });

    test('should handle invalid ID format', async () => {
      await expect(BaseComponent.getById('invalid-id')).rejects.toThrow();
    });
  });

  describe('create', () => {
    test('should create a new base component', async () => {
      const componentData = {
        name: 'New Component',
        category: 'New Category',
        footprint: 2.5,
        unit: 'per kg',
        source: 'New Source',
        description: 'New description'
      };

      const result = await BaseComponent.create(componentData);
      
      expect(result).toBeTruthy();
      
      // Verify component was created in database
      const savedComponent = await db.collection('base_components').findOne({
        name: 'New Component'
      });
      
      expect(savedComponent).toBeTruthy();
      expect(savedComponent.name).toBe('New Component');
      expect(savedComponent.footprint).toBe(2.5);
      expect(savedComponent.created_at).toBeInstanceOf(Date);
      expect(savedComponent.updated_at).toBeInstanceOf(Date);
    });

    test('should handle missing required fields gracefully', async () => {
      const incompleteData = {
        name: 'Incomplete Component'
        // Missing other required fields
      };

      const result = await BaseComponent.create(incompleteData);
      
      expect(result).toBeTruthy();
      
      const savedComponent = await db.collection('base_components').findOne({
        name: 'Incomplete Component'
      });
      
      expect(savedComponent.name).toBe('Incomplete Component');
      expect(savedComponent.created_at).toBeInstanceOf(Date);
    });
  });

  describe('update', () => {
    let testComponentId;

    beforeEach(async () => {
      const testComponent = {
        name: 'Original Component',
        category: 'Original Category',
        footprint: 5.0,
        unit: 'per kg',
        source: 'Original Source',
        description: 'Original description',
        created_at: new Date(),
        updated_at: new Date()
      };

      const result = await db.collection('base_components').insertOne(testComponent);
      testComponentId = result.insertedId;
    });

    test('should update existing component', async () => {
      const updateData = {
        name: 'Updated Component',
        footprint: 7.5,
        description: 'Updated description'
      };

      const success = await BaseComponent.update(testComponentId.toString(), updateData);
      
      expect(success).toBe(true);
      
      // Verify update in database
      const updatedComponent = await db.collection('base_components').findOne({
        _id: testComponentId
      });
      
      expect(updatedComponent.name).toBe('Updated Component');
      expect(updatedComponent.footprint).toBe(7.5);
      expect(updatedComponent.description).toBe('Updated description');
      expect(updatedComponent.category).toBe('Original Category'); // Unchanged
      expect(updatedComponent.updated_at).toBeInstanceOf(Date);
    });

    test('should return false for non-existent component', async () => {
      const nonExistentId = new ObjectId();
      const updateData = { name: 'Updated Name' };

      const success = await BaseComponent.update(nonExistentId.toString(), updateData);
      
      expect(success).toBe(false);
    });

    test('should handle invalid ID format', async () => {
      const updateData = { name: 'Updated Name' };
      
      await expect(BaseComponent.update('invalid-id', updateData)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    let testComponentId;

    beforeEach(async () => {
      const testComponent = {
        name: 'Component to Delete',
        category: 'Test Category',
        footprint: 3.0,
        unit: 'per kg'
      };

      const result = await db.collection('base_components').insertOne(testComponent);
      testComponentId = result.insertedId;
    });

    test('should delete existing component', async () => {
      const success = await BaseComponent.delete(testComponentId.toString());
      
      expect(success).toBe(true);
      
      // Verify deletion in database
      const deletedComponent = await db.collection('base_components').findOne({
        _id: testComponentId
      });
      
      expect(deletedComponent).toBeNull();
    });

    test('should return false for non-existent component', async () => {
      const nonExistentId = new ObjectId();
      
      const success = await BaseComponent.delete(nonExistentId.toString());
      
      expect(success).toBe(false);
    });

    test('should handle invalid ID format', async () => {
      await expect(BaseComponent.delete('invalid-id')).rejects.toThrow();
    });
  });

  describe('error handling', () => {
    test('should handle database connection errors gracefully', async () => {
      // Close the database connection to simulate error
      await mongoClient.close();
      
      await expect(BaseComponent.getAll()).rejects.toThrow();
      
      // Reconnect for cleanup
      await mongoClient.connect();
      db = mongoClient.db('test');
    });
  });
});
