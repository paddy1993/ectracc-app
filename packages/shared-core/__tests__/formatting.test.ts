import {
  getEcoScoreColor,
  getEcoScoreLabel,
  formatCarbonFootprint,
} from '../src/formatting';

describe('Product Formatting Utilities', () => {
  describe('getEcoScoreColor', () => {
    it('should return green for A grade', () => {
      expect(getEcoScoreColor('A')).toBe('#28a745');
    });

    it('should return light green for B grade', () => {
      expect(getEcoScoreColor('B')).toBe('#5cb85c');
    });

    it('should return yellow for C grade', () => {
      expect(getEcoScoreColor('C')).toBe('#ffc107');
    });

    it('should return orange for D grade', () => {
      expect(getEcoScoreColor('D')).toBe('#fd7e14');
    });

    it('should return red for E grade', () => {
      expect(getEcoScoreColor('E')).toBe('#dc3545');
    });

    it('should return gray for unknown grade', () => {
      expect(getEcoScoreColor('F')).toBe('#6c757d');
      expect(getEcoScoreColor('')).toBe('#6c757d');
    });

    it('should be case insensitive', () => {
      expect(getEcoScoreColor('a')).toBe('#28a745');
      expect(getEcoScoreColor('b')).toBe('#5cb85c');
    });
  });

  describe('getEcoScoreLabel', () => {
    it('should return correct labels for grades', () => {
      expect(getEcoScoreLabel('A')).toBe('Excellent');
      expect(getEcoScoreLabel('B')).toBe('Good');
      expect(getEcoScoreLabel('C')).toBe('Fair');
      expect(getEcoScoreLabel('D')).toBe('Poor');
      expect(getEcoScoreLabel('E')).toBe('Bad');
    });

    it('should return Unknown for invalid grades', () => {
      expect(getEcoScoreLabel('F')).toBe('Unknown');
      expect(getEcoScoreLabel('')).toBe('Unknown');
    });

    it('should be case insensitive', () => {
      expect(getEcoScoreLabel('a')).toBe('Excellent');
      expect(getEcoScoreLabel('e')).toBe('Bad');
    });
  });

  describe('formatCarbonFootprint', () => {
    it('should format small values in grams', () => {
      expect(formatCarbonFootprint(50)).toBe('50 g CO₂');
      expect(formatCarbonFootprint(999)).toBe('999 g CO₂');
    });

    it('should format large values in kilograms', () => {
      expect(formatCarbonFootprint(1000)).toBe('1.00 kg CO₂');
      expect(formatCarbonFootprint(1500)).toBe('1.50 kg CO₂');
      expect(formatCarbonFootprint(2345)).toBe('2.35 kg CO₂');
    });

    it('should handle zero', () => {
      expect(formatCarbonFootprint(0)).toBe('0 g CO₂');
    });

    it('should handle decimals', () => {
      expect(formatCarbonFootprint(123.45)).toBe('123 g CO₂');
      expect(formatCarbonFootprint(1234.56)).toBe('1.23 kg CO₂');
    });

    it('should handle negative values gracefully', () => {
      expect(formatCarbonFootprint(-100)).toBe('0 g CO₂');
    });
  });
});


