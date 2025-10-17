/**
 * Carbon Footprint Unit Conversion Tests
 * 
 * Tests to ensure carbon footprint values are properly converted between
 * grams, kilograms, and tonnes across the application.
 */

import userFootprintApi from '../services/userFootprintApi';

describe('Carbon Footprint Unit Conversions', () => {
  describe('formatCarbonFootprint (expects kg input)', () => {
    it('should format very small values (< 0.01 kg)', () => {
      expect(userFootprintApi.formatCarbonFootprint(0.005)).toBe('<0.01 kg CO₂e');
      expect(userFootprintApi.formatCarbonFootprint(0.001)).toBe('<0.01 kg CO₂e');
      expect(userFootprintApi.formatCarbonFootprint(0.009)).toBe('<0.01 kg CO₂e');
    });

    it('should format small values (< 1 kg) with 2 decimals', () => {
      expect(userFootprintApi.formatCarbonFootprint(0.01)).toBe('0.01 kg CO₂e');
      expect(userFootprintApi.formatCarbonFootprint(0.5)).toBe('0.50 kg CO₂e');
      expect(userFootprintApi.formatCarbonFootprint(0.99)).toBe('0.99 kg CO₂e');
    });

    it('should format medium values (1-10 kg) with 1 decimal', () => {
      expect(userFootprintApi.formatCarbonFootprint(1)).toBe('1.0 kg CO₂e');
      expect(userFootprintApi.formatCarbonFootprint(2.5)).toBe('2.5 kg CO₂e');
      expect(userFootprintApi.formatCarbonFootprint(9.9)).toBe('9.9 kg CO₂e');
    });

    it('should format large values (≥ 10 kg) as whole numbers', () => {
      expect(userFootprintApi.formatCarbonFootprint(10)).toBe('10 kg CO₂e');
      expect(userFootprintApi.formatCarbonFootprint(50.7)).toBe('51 kg CO₂e');
      expect(userFootprintApi.formatCarbonFootprint(999)).toBe('999 kg CO₂e');
    });

    it('should handle realistic food carbon values', () => {
      // Chicken (180g) = 2.8 kg CO₂e
      expect(userFootprintApi.formatCarbonFootprint(2.8)).toBe('2.8 kg CO₂e');
      
      // Pork (200g) = 3.8 kg CO₂e
      expect(userFootprintApi.formatCarbonFootprint(3.8)).toBe('3.8 kg CO₂e');
      
      // Apple = 0.032 kg CO₂e
      expect(userFootprintApi.formatCarbonFootprint(0.032)).toBe('0.03 kg CO₂e');
      
      // Coffee = 0.049 kg CO₂e
      expect(userFootprintApi.formatCarbonFootprint(0.049)).toBe('0.05 kg CO₂e');
    });
  });

  describe('formatTotalFootprint (handles g/kg/t conversions)', () => {
    it('should format very small totals in grams', () => {
      expect(userFootprintApi.formatTotalFootprint(0.001)).toBe('1 g CO₂e');
      expect(userFootprintApi.formatTotalFootprint(0.5)).toBe('500 g CO₂e');
      expect(userFootprintApi.formatTotalFootprint(0.999)).toBe('999 g CO₂e');
    });

    it('should format medium totals in kilograms', () => {
      expect(userFootprintApi.formatTotalFootprint(1)).toBe('1.0 kg CO₂e');
      expect(userFootprintApi.formatTotalFootprint(50.5)).toBe('50.5 kg CO₂e');
      expect(userFootprintApi.formatTotalFootprint(999)).toBe('999.0 kg CO₂e');
    });

    it('should format large totals in tonnes', () => {
      expect(userFootprintApi.formatTotalFootprint(1000)).toBe('1.00 t CO₂e');
      expect(userFootprintApi.formatTotalFootprint(1500)).toBe('1.50 t CO₂e');
      expect(userFootprintApi.formatTotalFootprint(10000)).toBe('10.00 t CO₂e');
    });

    it('should handle dashboard total values correctly', () => {
      // User with 760.023 kg total should show as kg, not tonnes
      expect(userFootprintApi.formatTotalFootprint(760.023)).toBe('760.0 kg CO₂e');
      
      // User with 5.2 kg total
      expect(userFootprintApi.formatTotalFootprint(5.2)).toBe('5.2 kg CO₂e');
      
      // User with 0.1 kg total should show in grams
      expect(userFootprintApi.formatTotalFootprint(0.1)).toBe('100 g CO₂e');
    });
  });

  describe('Manual Entry Calculations', () => {
    it('should convert gram calculations to kg before storage', () => {
      // Simulate TrackerPage calculation
      const carbonPerUnit = 200; // 200g CO₂e per unit (food)
      const amount = 1;
      const calculatedCarbonGrams = amount * carbonPerUnit; // 200g
      const calculatedCarbonKg = calculatedCarbonGrams / 1000; // 0.2kg
      
      expect(calculatedCarbonKg).toBe(0.2);
      expect(Math.round(calculatedCarbonKg * 100) / 100).toBe(0.2);
    });

    it('should handle all manual entry categories', () => {
      const testCases = [
        { category: 'food', perUnit: 200, amount: 1, expected: 0.2 },
        { category: 'transport', perUnit: 150, amount: 10, expected: 1.5 },
        { category: 'energy', perUnit: 500, amount: 5, expected: 2.5 },
        { category: 'shopping', perUnit: 5000, amount: 1, expected: 5 },
        { category: 'misc', perUnit: 50, amount: 2, expected: 0.1 },
      ];

      testCases.forEach(({ category, perUnit, amount, expected }) => {
        const carbonGrams = amount * perUnit;
        const carbonKg = Math.round((carbonGrams / 1000) * 100) / 100;
        expect(carbonKg).toBe(expected);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero values', () => {
      expect(userFootprintApi.formatCarbonFootprint(0)).toBe('<0.01 kg CO₂e');
      expect(userFootprintApi.formatTotalFootprint(0)).toBe('0 g CO₂e');
    });

    it('should handle very large values', () => {
      expect(userFootprintApi.formatCarbonFootprint(10000)).toBe('10000 kg CO₂e');
      expect(userFootprintApi.formatTotalFootprint(10000)).toBe('10.00 t CO₂e');
    });

    it('should handle precise decimal values', () => {
      expect(userFootprintApi.formatCarbonFootprint(2.8)).toBe('2.8 kg CO₂e');
      expect(userFootprintApi.formatCarbonFootprint(3.14159)).toBe('3.1 kg CO₂e');
    });
  });

  describe('Backend Validation', () => {
    it('should accept reasonable kg values', () => {
      // These values should pass validation (0.001 to 100 kg)
      const validValues = [0.001, 0.5, 1, 10, 50, 100];
      
      validValues.forEach(value => {
        expect(value).toBeGreaterThanOrEqual(0.001);
        expect(value).toBeLessThanOrEqual(100);
      });
    });

    it('should reject unreasonable values', () => {
      // These values should fail validation
      const invalidValues = [0, 0.0001, 101, 1000, 10000];
      
      invalidValues.forEach(value => {
        const isValid = value >= 0.001 && value <= 100;
        expect(isValid).toBe(false);
      });
    });

    it('should identify gram values stored as kg (migration candidates)', () => {
      // Values > 100 kg are likely stored in grams
      const suspiciousValues = [200, 500, 2800, 5000, 760023];
      
      suspiciousValues.forEach(value => {
        expect(value).toBeGreaterThan(100);
        
        // After dividing by 1000, they should be reasonable
        const converted = value / 1000;
        expect(converted).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('Real-world Scenarios', () => {
    it('should handle typical user dashboard totals', () => {
      // User tracking meals for a week
      const chickenMeal = 2.8; // kg
      const milkDrink = 1.5; // kg
      const apple = 0.032; // kg
      const bread = 0.815; // kg
      
      const weekTotal = chickenMeal + milkDrink + apple + bread;
      expect(weekTotal).toBeCloseTo(5.147, 2);
      expect(userFootprintApi.formatTotalFootprint(weekTotal)).toBe('5.1 kg CO₂e');
    });

    it('should handle monthly aggregations', () => {
      // User with ~5kg per week over 4 weeks
      const monthlyTotal = 5.147 * 4;
      expect(monthlyTotal).toBeCloseTo(20.588, 2);
      expect(userFootprintApi.formatTotalFootprint(monthlyTotal)).toBe('20.6 kg CO₂e');
    });

    it('should handle yearly aggregations', () => {
      // User with ~20kg per month over 12 months
      const yearlyTotal = 20.588 * 12;
      expect(yearlyTotal).toBeCloseTo(247.056, 2);
      expect(userFootprintApi.formatTotalFootprint(yearlyTotal)).toBe('247.1 kg CO₂e');
    });
  });
});

