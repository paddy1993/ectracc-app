const { MongoMemoryServer } = require('mongodb-memory-server');
const { MongoClient } = require('mongodb');

// Mock the mongodb config before requiring the Product model
jest.mock('../../../config/mongodb');

const Product = require('../../../models/Product');

describe('Product Model', () => {
  let mongoServer;
  let mongoClient;
  let db;
  let mockGetMongoCollection;

  beforeAll(async () => {
    // Start in-memory MongoDB instance
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    mongoClient = new MongoClient(mongoUri);
    await mongoClient.connect();
    db = mongoClient.db('test');
    
    // Mock the getMongoCollection function
    const mongoConfig = require('../../../config/mongodb');
    mockGetMongoCollection = jest.fn((collectionName) => db.collection(collectionName));
    mongoConfig.getMongoCollection = mockGetMongoCollection;
  });

  afterAll(async () => {
    await mongoClient.close();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await db.collection('products').deleteMany({});
  });

  describe('formatProduct', () => {
    test('should format product with all fields correctly', () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        code: '1234567890123',
        product_name: 'Test Product',
        brands: ['Test Brand'],
        categories: ['Test Category'],
        co2_total: 2.5,
        carbon_footprint_source: 'agribalyse',
        carbon_footprint_reference: 'Agribalyse Database',
        has_barcode: true,
        is_base_component: false,
        source_database: 'openfoodfacts',
        product_type: 'food'
      };

      const formatted = Product.formatProduct(mockProduct);

      expect(formatted).toEqual({
        id: '507f1f77bcf86cd799439011',
        code: '1234567890123',
        product_name: 'Test Product',
        brands: ['Test Brand'],
        categories: ['Test Category'],
        categories_hierarchy: [],
        ecoscore_grade: null,
        environmental_score_grade: null,
        nutriscore_grade: null,
        nutrition_info: null,
        ingredients_text: null,
        ingredients_count: 0,
        labels: null,
        carbon_footprint: 2.5,
        carbon_footprint_source: 'agribalyse',
        carbon_footprint_reference: 'Agribalyse Database',
        carbon_footprint_details: {
          total: 2.5,
          agriculture: null,
          processing: null,
          transportation: null,
          packaging: null,
          distribution: null
        },
        product_type: 'food',
        source_database: 'openfoodfacts',
        has_barcode: true,
        is_base_component: false,
        last_updated: expect.any(String),
        image_url: null,
        packaging: null,
        countries: null,
        manufacturing_places: null
      });
    });

    test('should handle null product', () => {
      const formatted = Product.formatProduct(null);
      expect(formatted).toBeNull();
    });

    test('should handle product with missing fields', () => {
      const mockProduct = {
        _id: '507f1f77bcf86cd799439011',
        product_name: 'Minimal Product'
      };

      const formatted = Product.formatProduct(mockProduct);

      expect(formatted.id).toBe('507f1f77bcf86cd799439011');
      expect(formatted.product_name).toBe('Minimal Product');
      expect(formatted.brands).toEqual([]);
      expect(formatted.categories).toEqual([]);
      expect(formatted.carbon_footprint_source).toBe('estimated');
    });
  });

  describe('calculateCarbonFootprint', () => {
    test('should calculate carbon footprint for meat products', () => {
      const product = {
        categories: ['meat', 'beef'],
        product_name: 'Beef Steak'
      };

      const footprint = Product.calculateCarbonFootprint(product);
      expect(footprint).toBeGreaterThan(10); // Meat should have high footprint
    });

    test('should calculate carbon footprint for dairy products', () => {
      const product = {
        categories: ['dairy', 'milk'],
        product_name: 'Whole Milk'
      };

      const footprint = Product.calculateCarbonFootprint(product);
      expect(footprint).toBeGreaterThan(1);
      expect(footprint).toBeLessThan(10);
    });

    test('should calculate carbon footprint for vegetables', () => {
      const product = {
        categories: ['vegetables', 'fresh'],
        product_name: 'Carrots'
      };

      const footprint = Product.calculateCarbonFootprint(product);
      expect(footprint).toBeLessThan(2); // Vegetables should have low footprint
    });

    test('should return default footprint for unknown categories', () => {
      const product = {
        categories: ['unknown-category'],
        product_name: 'Mystery Product'
      };

      const footprint = Product.calculateCarbonFootprint(product);
      expect(footprint).toBe(1.0); // Default fallback
    });
  });

  describe('searchProducts', () => {
    beforeEach(async () => {
      // Insert test products
      const testProducts = [
        {
          code: '1111111111111',
          product_name: 'Organic Milk',
          brands: ['Organic Brand'],
          categories: ['dairy', 'milk'],
          co2_total: 3.2,
          carbon_footprint_source: 'agribalyse'
        },
        {
          code: '2222222222222',
          product_name: 'Beef Burger',
          brands: ['Meat Co'],
          categories: ['meat', 'beef'],
          co2_total: 25.0,
          carbon_footprint_source: 'agribalyse'
        },
        {
          code: '3333333333333',
          product_name: 'Fresh Carrots',
          brands: ['Veggie Farm'],
          categories: ['vegetables', 'fresh'],
          co2_total: 0.4,
          carbon_footprint_source: 'manual_research'
        }
      ];

      await db.collection('products').insertMany(testProducts);
    });

    test('should search products by name', async () => {
      const results = await Product.search('milk', {
        limit: 10,
        skip: 0
      });

      expect(results.products).toHaveLength(1);
      expect(results.products[0].product_name).toBe('Organic Milk');
      expect(results.totalPages).toBe(1);
      expect(results.currentPage).toBe(1);
    });

    test('should filter by categories', async () => {
      const results = await Product.searchProducts({
        categories: ['meat'],
        page: 1,
        limit: 10
      });

      expect(results.products).toHaveLength(1);
      expect(results.products[0].product_name).toBe('Beef Burger');
    });

    test('should filter by carbon footprint range', async () => {
      const results = await Product.searchProducts({
        minCarbon: 0,
        maxCarbon: 1,
        page: 1,
        limit: 10
      });

      expect(results.products).toHaveLength(1);
      expect(results.products[0].product_name).toBe('Fresh Carrots');
    });

    test('should filter by source', async () => {
      const results = await Product.searchProducts({
        sources: ['manual_research'],
        page: 1,
        limit: 10
      });

      expect(results.products).toHaveLength(1);
      expect(results.products[0].product_name).toBe('Fresh Carrots');
    });

    test('should sort by carbon footprint ascending', async () => {
      const results = await Product.searchProducts({
        sortBy: 'carbon_asc',
        page: 1,
        limit: 10
      });

      expect(results.products).toHaveLength(3);
      expect(results.products[0].product_name).toBe('Fresh Carrots');
      expect(results.products[2].product_name).toBe('Beef Burger');
    });

    test('should handle pagination', async () => {
      const results = await Product.searchProducts({
        page: 2,
        limit: 2
      });

      expect(results.products).toHaveLength(1);
      expect(results.currentPage).toBe(2);
      expect(results.totalPages).toBe(2);
    });
  });

  describe('getProductByBarcode', () => {
    beforeEach(async () => {
      await db.collection('products').insertOne({
        code: '1234567890123',
        product_name: 'Test Product',
        brands: ['Test Brand'],
        categories: ['test'],
        co2_total: 2.5
      });
    });

    test('should find product by barcode', async () => {
      const product = await Product.findByBarcode('1234567890123');
      
      expect(product).toBeTruthy();
      expect(product.product_name).toBe('Test Product');
      expect(product.code).toBe('1234567890123');
    });

    test('should return null for non-existent barcode', async () => {
      const product = await Product.findByBarcode('9999999999999');
      expect(product).toBeNull();
    });
  });

  describe('getCategories', () => {
    beforeEach(async () => {
      const testProducts = [
        { categories: ['dairy', 'milk'] },
        { categories: ['meat', 'beef'] },
        { categories: ['dairy', 'cheese'] },
        { categories: ['vegetables'] }
      ];

      await db.collection('products').insertMany(testProducts);
    });

    test('should return unique categories', async () => {
      const categories = await Product.getCategories();
      
      expect(categories).toContain('dairy');
      expect(categories).toContain('meat');
      expect(categories).toContain('beef');
      expect(categories).toContain('milk');
      expect(categories).toContain('cheese');
      expect(categories).toContain('vegetables');
      
      // Should not have duplicates
      const uniqueCategories = [...new Set(categories)];
      expect(categories.length).toBe(uniqueCategories.length);
    });
  });

  describe('getBrands', () => {
    beforeEach(async () => {
      const testProducts = [
        { brands: ['Brand A', 'Brand B'] },
        { brands: ['Brand C'] },
        { brands: ['Brand A', 'Brand D'] }
      ];

      await db.collection('products').insertMany(testProducts);
    });

    test('should return unique brands', async () => {
      const brands = await Product.getBrands();
      
      expect(brands).toContain('Brand A');
      expect(brands).toContain('Brand B');
      expect(brands).toContain('Brand C');
      expect(brands).toContain('Brand D');
      
      // Should not have duplicates
      const uniqueBrands = [...new Set(brands)];
      expect(brands.length).toBe(uniqueBrands.length);
    });
  });
});
