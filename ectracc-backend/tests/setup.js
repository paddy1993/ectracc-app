require('dotenv').config({ path: '.env.test' });

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.MONGODB_DATABASE = 'ectracc_test';
});

afterAll(async () => {
  // Cleanup after all tests
});

// Global test helpers
global.testHelpers = {
  createMockProduct: () => ({
    _id: '507f1f77bcf86cd799439011',
    code: '1234567890123',
    product_name: 'Test Product',
    brands: ['Test Brand'],
    categories: ['Test Category'],
    carbon_footprint: 2.5,
    carbon_footprint_source: 'manual_research',
    carbon_footprint_reference: 'Test Study',
    has_barcode: true,
    is_base_component: false,
    source_database: 'manual',
    product_type: 'food'
  }),

  createMockUserFootprint: () => ({
    _id: '507f1f77bcf86cd799439012',
    user_id: 'test-user-123',
    product_id: '507f1f77bcf86cd799439011',
    product_name: 'Test Product',
    carbon_total: 2.5,
    quantity: 1,
    unit: 'item',
    logged_at: new Date(),
    carbon_footprint_source: 'manual_research',
    carbon_footprint_reference: 'Test Study',
    is_manual_entry: false,
    category: 'Test Category',
    created_at: new Date(),
    updated_at: new Date()
  }),

  createMockBaseComponent: () => ({
    _id: '507f1f77bcf86cd799439013',
    name: 'Test Component',
    category: 'Test Category',
    footprint: 1.5,
    unit: 'per kg',
    source: 'Test Source',
    description: 'Test component description',
    created_at: new Date(),
    updated_at: new Date()
  })
};
