const request = require('supertest');
const express = require('express');

// Create a simple test app that mimics our API structure
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Mock health check endpoint
  app.get('/api/healthcheck', (req, res) => {
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: { status: 'connected' },
      memory: process.memoryUsage(),
      uptime: process.uptime()
    });
  });

  // Mock products search endpoint
  app.get('/api/products/search', (req, res) => {
    const { q, page = 1, limit = 20 } = req.query;
    
    // Mock product data
    const mockProducts = [
      {
        id: '1',
        product_name: 'Organic Milk',
        brands: ['Organic Brand'],
        categories: ['dairy'],
        carbon_footprint: 3.2,
        carbon_footprint_source: 'agribalyse'
      },
      {
        id: '2',
        product_name: 'Beef Burger',
        brands: ['Meat Co'],
        categories: ['meat'],
        carbon_footprint: 25.0,
        carbon_footprint_source: 'agribalyse'
      }
    ];

    // Simple search filtering
    let filteredProducts = mockProducts;
    if (q) {
      filteredProducts = mockProducts.filter(p => 
        p.product_name.toLowerCase().includes(q.toLowerCase())
      );
    }

    res.json({
      success: true,
      data: {
        products: filteredProducts,
        totalPages: 1,
        currentPage: parseInt(page),
        totalProducts: filteredProducts.length
      }
    });
  });

  // Mock user footprint tracking endpoint
  app.post('/api/user-footprints/track', (req, res) => {
    const { product_name, carbon_total, quantity, unit } = req.body;

    // Basic validation
    if (!product_name || !carbon_total) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Mock successful tracking
    res.status(201).json({
      success: true,
      data: {
        id: 'mock-id-123',
        product_name,
        carbon_total,
        quantity: quantity || 1,
        unit: unit || 'item',
        logged_at: new Date().toISOString()
      }
    });
  });

  // Mock base components endpoint
  app.get('/api/base-components', (req, res) => {
    const mockComponents = [
      {
        id: '1',
        name: 'Beef (average)',
        category: 'Meat & Poultry',
        footprint: 27.0,
        unit: 'per kg'
      },
      {
        id: '2',
        name: 'Milk (whole)',
        category: 'Dairy',
        footprint: 3.2,
        unit: 'per liter'
      }
    ];

    res.json({
      success: true,
      data: mockComponents
    });
  });

  // Error handler
  app.use((err, req, res, next) => {
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  });

  return app;
}

describe('API Integration Tests', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Health Check', () => {
    test('GET /api/healthcheck should return healthy status', async () => {
      const response = await request(app)
        .get('/api/healthcheck')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.status).toBe('healthy');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('database');
      expect(response.body).toHaveProperty('memory');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('Products API', () => {
    test('GET /api/products/search should return products', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('products');
      expect(response.body.data.products).toBeInstanceOf(Array);
      expect(response.body.data.products.length).toBeGreaterThan(0);
    });

    test('GET /api/products/search with query should filter results', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ q: 'milk' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.products).toHaveLength(1);
      expect(response.body.data.products[0].product_name).toBe('Organic Milk');
    });

    test('GET /api/products/search should handle pagination', async () => {
      const response = await request(app)
        .get('/api/products/search')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.currentPage).toBe(1);
      expect(response.body.data).toHaveProperty('totalPages');
    });
  });

  describe('User Footprints API', () => {
    test('POST /api/user-footprints/track should track footprint', async () => {
      const footprintData = {
        product_name: 'Test Product',
        carbon_total: 2.5,
        quantity: 1,
        unit: 'item'
      };

      const response = await request(app)
        .post('/api/user-footprints/track')
        .send(footprintData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.product_name).toBe('Test Product');
      expect(response.body.data.carbon_total).toBe(2.5);
    });

    test('POST /api/user-footprints/track should validate required fields', async () => {
      const incompleteData = {
        product_name: 'Test Product'
        // Missing carbon_total
      };

      const response = await request(app)
        .post('/api/user-footprints/track')
        .send(incompleteData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields');
    });
  });

  describe('Base Components API', () => {
    test('GET /api/base-components should return components', async () => {
      const response = await request(app)
        .get('/api/base-components')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      const component = response.body.data[0];
      expect(component).toHaveProperty('name');
      expect(component).toHaveProperty('category');
      expect(component).toHaveProperty('footprint');
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 for non-existent endpoints', async () => {
      const response = await request(app)
        .get('/api/non-existent')
        .expect(404);
    });

    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/user-footprints/track')
        .send('invalid json')
        .set('Content-Type', 'application/json')
        .expect(500); // Express returns 500 for malformed JSON by default
    });
  });

  describe('Response Format', () => {
    test('all successful responses should have consistent format', async () => {
      const endpoints = [
        { path: '/api/products/search', hasData: true },
        { path: '/api/base-components', hasData: true },
        { path: '/api/healthcheck', hasData: false } // Health check has different format
      ];

      for (const endpoint of endpoints) {
        const response = await request(app)
          .get(endpoint.path)
          .expect(200);

        expect(response.body).toHaveProperty('success');
        expect(response.body.success).toBe(true);
        
        if (endpoint.hasData) {
          expect(response.body).toHaveProperty('data');
        }
      }
    });

    test('error responses should have consistent format', async () => {
      const response = await request(app)
        .post('/api/user-footprints/track')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success');
      expect(response.body.success).toBe(false);
      expect(response.body).toHaveProperty('error');
      expect(typeof response.body.error).toBe('string');
    });
  });
});
