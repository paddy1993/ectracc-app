const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient, ObjectId } = require('mongodb');
const UserFootprint = require('../../../models/UserFootprint');

describe('UserFootprint Model', () => {
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
    await db.collection('user_footprints').deleteMany({});
  });

  describe('addEntry', () => {
    test('should add a new footprint entry', async () => {
      const entryData = {
        user_id: 'test-user-123',
        product_id: new ObjectId(),
        product_name: 'Test Product',
        carbon_total: 2.5,
        quantity: 1,
        unit: 'item',
        logged_at: new Date(),
        carbon_footprint_source: 'manual_research',
        is_manual_entry: false,
        category: 'Test Category'
      };

      const result = await UserFootprint.addEntry(entryData);
      
      expect(result).toBeTruthy();
      
      // Verify entry was added to database
      const savedEntry = await db.collection('user_footprints').findOne({
        user_id: 'test-user-123'
      });
      
      expect(savedEntry).toBeTruthy();
      expect(savedEntry.product_name).toBe('Test Product');
      expect(savedEntry.carbon_total).toBe(2.5);
      expect(savedEntry.created_at).toBeInstanceOf(Date);
      expect(savedEntry.updated_at).toBeInstanceOf(Date);
    });
  });

  describe('getHistory', () => {
    beforeEach(async () => {
      // Insert test data
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
          category: 'vegetables'
        },
        {
          user_id: 'test-user-123',
          carbon_total: 3.2,
          logged_at: new Date('2024-01-17'),
          category: 'meat'
        },
        {
          user_id: 'other-user',
          carbon_total: 1.0,
          logged_at: new Date('2024-01-15'),
          category: 'dairy'
        }
      ];

      await db.collection('user_footprints').insertMany(testEntries);
    });

    test('should get daily history', async () => {
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-17');
      
      const history = await UserFootprint.getHistory('test-user-123', 'daily', startDate, endDate, 1, 10);
      
      expect(history).toHaveLength(3);
      expect(history[0].total_carbon).toBe(3.2); // Most recent first
    });

    test('should filter by user_id', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const history = await UserFootprint.getHistory('test-user-123', 'daily', startDate, endDate, 1, 10);
      
      // Should only return entries for test-user-123, not other-user
      expect(history).toHaveLength(3);
      history.forEach(entry => {
        entry.entries.forEach(e => {
          expect(e.user_id).toBe('test-user-123');
        });
      });
    });

    test('should respect pagination', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const page1 = await UserFootprint.getHistory('test-user-123', 'daily', startDate, endDate, 1, 2);
      const page2 = await UserFootprint.getHistory('test-user-123', 'daily', startDate, endDate, 2, 2);
      
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
    });
  });

  describe('getCategoryBreakdown', () => {
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

    test('should calculate category breakdown correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      
      const breakdown = await UserFootprint.getCategoryBreakdown('test-user-123', startDate, endDate);
      
      expect(breakdown).toHaveLength(2);
      
      const meatCategory = breakdown.find(cat => cat._id === 'meat');
      const dairyCategory = breakdown.find(cat => cat._id === 'dairy');
      
      expect(meatCategory.total_carbon).toBe(5.0);
      expect(meatCategory.count).toBe(1);
      
      expect(dairyCategory.total_carbon).toBe(4.3);
      expect(dairyCategory.count).toBe(2);
      
      // Should be sorted by total_carbon descending
      expect(breakdown[0]._id).toBe('meat');
      expect(breakdown[1]._id).toBe('dairy');
    });
  });

  describe('getDailyFootprint', () => {
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
        },
        {
          user_id: 'test-user-123',
          carbon_total: 3.0,
          logged_at: new Date('2024-01-16T10:00:00Z')
        }
      ];

      await db.collection('user_footprints').insertMany(testEntries);
    });

    test('should calculate daily footprint correctly', async () => {
      const targetDate = new Date('2024-01-15');
      
      const dailyFootprint = await UserFootprint.getDailyFootprint('test-user-123', targetDate);
      
      expect(dailyFootprint.total_carbon).toBe(4.3); // 2.5 + 1.8
      expect(dailyFootprint.count).toBe(2);
    });

    test('should return zero for day with no entries', async () => {
      const targetDate = new Date('2024-01-20');
      
      const dailyFootprint = await UserFootprint.getDailyFootprint('test-user-123', targetDate);
      
      expect(dailyFootprint.total_carbon).toBe(0);
      expect(dailyFootprint.count).toBe(0);
    });
  });

  describe('getWeeklyFootprint', () => {
    beforeEach(async () => {
      // Week of Jan 14-20, 2024 (Sunday to Saturday)
      const testEntries = [
        {
          user_id: 'test-user-123',
          carbon_total: 2.5,
          logged_at: new Date('2024-01-14T10:00:00Z') // Sunday
        },
        {
          user_id: 'test-user-123',
          carbon_total: 1.8,
          logged_at: new Date('2024-01-16T14:00:00Z') // Tuesday
        },
        {
          user_id: 'test-user-123',
          carbon_total: 3.0,
          logged_at: new Date('2024-01-21T10:00:00Z') // Next week
        }
      ];

      await db.collection('user_footprints').insertMany(testEntries);
    });

    test('should calculate weekly footprint correctly', async () => {
      const targetDate = new Date('2024-01-16'); // Tuesday in the week
      
      const weeklyFootprint = await UserFootprint.getWeeklyFootprint('test-user-123', targetDate);
      
      expect(weeklyFootprint.total_carbon).toBe(4.3); // 2.5 + 1.8
      expect(weeklyFootprint.count).toBe(2);
    });
  });

  describe('getMonthlyFootprint', () => {
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
          logged_at: new Date('2024-01-25T14:00:00Z')
        },
        {
          user_id: 'test-user-123',
          carbon_total: 3.0,
          logged_at: new Date('2024-02-05T10:00:00Z') // Next month
        }
      ];

      await db.collection('user_footprints').insertMany(testEntries);
    });

    test('should calculate monthly footprint correctly', async () => {
      const targetDate = new Date('2024-01-20');
      
      const monthlyFootprint = await UserFootprint.getMonthlyFootprint('test-user-123', targetDate);
      
      expect(monthlyFootprint.total_carbon).toBe(4.3); // 2.5 + 1.8
      expect(monthlyFootprint.count).toBe(2);
    });
  });

  describe('getYearlyFootprint', () => {
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
          logged_at: new Date('2024-06-25T14:00:00Z')
        },
        {
          user_id: 'test-user-123',
          carbon_total: 3.0,
          logged_at: new Date('2025-02-05T10:00:00Z') // Next year
        }
      ];

      await db.collection('user_footprints').insertMany(testEntries);
    });

    test('should calculate yearly footprint correctly', async () => {
      const targetDate = new Date('2024-08-20');
      
      const yearlyFootprint = await UserFootprint.getYearlyFootprint('test-user-123', targetDate);
      
      expect(yearlyFootprint.total_carbon).toBe(4.3); // 2.5 + 1.8
      expect(yearlyFootprint.count).toBe(2);
    });
  });

  describe('getRecentEntries', () => {
    beforeEach(async () => {
      const testEntries = [
        {
          user_id: 'test-user-123',
          product_name: 'Product A',
          logged_at: new Date('2024-01-15T10:00:00Z')
        },
        {
          user_id: 'test-user-123',
          product_name: 'Product B',
          logged_at: new Date('2024-01-16T10:00:00Z')
        },
        {
          user_id: 'test-user-123',
          product_name: 'Product C',
          logged_at: new Date('2024-01-17T10:00:00Z')
        },
        {
          user_id: 'other-user',
          product_name: 'Other Product',
          logged_at: new Date('2024-01-18T10:00:00Z')
        }
      ];

      await db.collection('user_footprints').insertMany(testEntries);
    });

    test('should get recent entries in correct order', async () => {
      const recentEntries = await UserFootprint.getRecentEntries('test-user-123', 3);
      
      expect(recentEntries).toHaveLength(3);
      expect(recentEntries[0].product_name).toBe('Product C'); // Most recent first
      expect(recentEntries[1].product_name).toBe('Product B');
      expect(recentEntries[2].product_name).toBe('Product A');
    });

    test('should respect limit parameter', async () => {
      const recentEntries = await UserFootprint.getRecentEntries('test-user-123', 2);
      
      expect(recentEntries).toHaveLength(2);
    });

    test('should filter by user_id', async () => {
      const recentEntries = await UserFootprint.getRecentEntries('test-user-123', 10);
      
      expect(recentEntries).toHaveLength(3);
      recentEntries.forEach(entry => {
        expect(entry.user_id).toBe('test-user-123');
      });
    });
  });
});
