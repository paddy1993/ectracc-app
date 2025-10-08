// Simple unit tests for core functionality
describe('Core Functionality Tests', () => {
  
  describe('Product Model', () => {
    const Product = require('../../models/Product');

    test('should format product correctly', () => {
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

      expect(formatted).toBeTruthy();
      expect(formatted.id).toBe('507f1f77bcf86cd799439011');
      expect(formatted.product_name).toBe('Test Product');
      expect(formatted.carbon_footprint).toBe(2.5);
      expect(formatted.carbon_footprint_source).toBe('agribalyse');
    });

    test('should handle null product', () => {
      const formatted = Product.formatProduct(null);
      expect(formatted).toBeNull();
    });

    test('should calculate carbon footprint for meat products', () => {
      const product = {
        categories: ['meat', 'beef'],
        product_name: 'Beef Steak'
      };

      const footprint = Product.calculateCarbonFootprint(product);
      expect(footprint).toBeGreaterThan(10); // Meat should have high footprint
    });

    test('should calculate carbon footprint for vegetables', () => {
      const product = {
        categories: ['vegetables', 'fresh'],
        product_name: 'Carrots'
      };

      const footprint = Product.calculateCarbonFootprint(product);
      expect(footprint).toBeLessThan(2); // Vegetables should have low footprint
    });
  });

  describe('Validation Functions', () => {
    const { trackFootprintValidation } = require('../../validation/footprintValidation');

    test('should validate correct footprint data', () => {
      const validData = {
        manual_item: 'Test Product',
        carbon_total: 2.5,
        amount: 1,
        category: 'food'
      };

      const result = trackFootprintValidation.safeParse(validData);
      expect(result.success).toBe(true);
    });

    test('should reject invalid footprint data', () => {
      const invalidData = {
        product_name: 'Test Product'
        // Missing required fields
      };

      const result = trackFootprintValidation.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('Utility Functions', () => {
    const { calculateDateRange } = require('../../utils/dateUtils');

    test('should calculate date range for weekly period', () => {
      const { startDate, endDate } = calculateDateRange('weekly');
      
      expect(startDate).toBeInstanceOf(Date);
      expect(endDate).toBeInstanceOf(Date);
      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
    });

    test('should calculate date range for monthly period', () => {
      const { startDate, endDate } = calculateDateRange('monthly');
      
      expect(startDate).toBeInstanceOf(Date);
      expect(endDate).toBeInstanceOf(Date);
      expect(endDate.getTime()).toBeGreaterThan(startDate.getTime());
    });
  });

  describe('Source Helper Functions', () => {
    test('should identify source icons correctly', () => {
      const getSourceIcon = (source) => {
        switch (source) {
          case 'agribalyse': return '🔬';
          case 'manual_research': return '📚';
          case 'user_contributed': return '👥';
          case 'base_component': return '🧱';
          case 'estimated': return '📊';
          default: return '❓';
        }
      };

      expect(getSourceIcon('agribalyse')).toBe('🔬');
      expect(getSourceIcon('manual_research')).toBe('📚');
      expect(getSourceIcon('unknown')).toBe('❓');
    });

    test('should identify source colors correctly', () => {
      const getSourceColor = (source) => {
        switch (source) {
          case 'agribalyse': return '#1976d2';
          case 'manual_research': return '#388e3c';
          case 'user_contributed': return '#f57c00';
          case 'base_component': return '#7b1fa2';
          case 'estimated': return '#616161';
          default: return '#757575';
        }
      };

      expect(getSourceColor('agribalyse')).toBe('#1976d2');
      expect(getSourceColor('manual_research')).toBe('#388e3c');
      expect(getSourceColor('unknown')).toBe('#757575');
    });
  });

  describe('Error Handling', () => {
    test('should handle graceful error responses', () => {
      const createErrorResponse = (message, statusCode = 500) => ({
        success: false,
        error: message,
        statusCode
      });

      const error = createErrorResponse('Test error', 400);
      expect(error.success).toBe(false);
      expect(error.error).toBe('Test error');
      expect(error.statusCode).toBe(400);
    });
  });

  describe('Data Processing', () => {
    test('should process carbon footprint calculations', () => {
      const calculateTotalFootprint = (entries) => {
        return entries.reduce((total, entry) => total + entry.carbon_total, 0);
      };

      const entries = [
        { carbon_total: 2.5 },
        { carbon_total: 1.8 },
        { carbon_total: 3.2 }
      ];

      const total = calculateTotalFootprint(entries);
      expect(total).toBe(7.5);
    });

    test('should format carbon footprint values', () => {
      const formatCarbonFootprint = (value) => {
        if (value === null || value === undefined) return 'N/A';
        if (value < 0.01) return '<0.01 kg CO₂e';
        if (value >= 1000) return `${(value / 1000).toFixed(1)}t CO₂e`;
        return `${value.toFixed(2)} kg CO₂e`;
      };

      expect(formatCarbonFootprint(2.5)).toBe('2.50 kg CO₂e');
      expect(formatCarbonFootprint(0.005)).toBe('<0.01 kg CO₂e');
      expect(formatCarbonFootprint(1500)).toBe('1.5t CO₂e');
      expect(formatCarbonFootprint(null)).toBe('N/A');
    });
  });
});
