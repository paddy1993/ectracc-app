// Utility function tests
describe('Source Helper Functions', () => {
  // Helper functions for source display (same as in components)
  const getSourceIcon = (source: string): string => {
    switch (source) {
      case 'agribalyse': return '🔬';
      case 'manual_research': return '📚';
      case 'user_contributed': return '👥';
      case 'base_component': return '🧱';
      case 'estimated': return '📊';
      default: return '❓';
    }
  };

  const getSourceColor = (source: string): string => {
    switch (source) {
      case 'agribalyse': return '#1976d2'; // Blue
      case 'manual_research': return '#388e3c'; // Green
      case 'user_contributed': return '#f57c00'; // Orange
      case 'base_component': return '#7b1fa2'; // Purple
      case 'estimated': return '#616161'; // Grey
      default: return '#757575';
    }
  };

  const getSourceLabel = (source: string): string => {
    switch (source) {
      case 'agribalyse': return 'Agribalyse Database';
      case 'manual_research': return 'Research Studies';
      case 'user_contributed': return 'User Contributed';
      case 'base_component': return 'Base Component';
      case 'estimated': return 'Estimated';
      default: return 'Unknown Source';
    }
  };

  describe('getSourceIcon', () => {
    test('should return correct icons for known sources', () => {
      expect(getSourceIcon('agribalyse')).toBe('🔬');
      expect(getSourceIcon('manual_research')).toBe('📚');
      expect(getSourceIcon('user_contributed')).toBe('👥');
      expect(getSourceIcon('base_component')).toBe('🧱');
      expect(getSourceIcon('estimated')).toBe('📊');
    });

    test('should return default icon for unknown source', () => {
      expect(getSourceIcon('unknown')).toBe('❓');
      expect(getSourceIcon('')).toBe('❓');
    });
  });

  describe('getSourceColor', () => {
    test('should return correct colors for known sources', () => {
      expect(getSourceColor('agribalyse')).toBe('#1976d2');
      expect(getSourceColor('manual_research')).toBe('#388e3c');
      expect(getSourceColor('user_contributed')).toBe('#f57c00');
      expect(getSourceColor('base_component')).toBe('#7b1fa2');
      expect(getSourceColor('estimated')).toBe('#616161');
    });

    test('should return default color for unknown source', () => {
      expect(getSourceColor('unknown')).toBe('#757575');
      expect(getSourceColor('')).toBe('#757575');
    });
  });

  describe('getSourceLabel', () => {
    test('should return correct labels for known sources', () => {
      expect(getSourceLabel('agribalyse')).toBe('Agribalyse Database');
      expect(getSourceLabel('manual_research')).toBe('Research Studies');
      expect(getSourceLabel('user_contributed')).toBe('User Contributed');
      expect(getSourceLabel('base_component')).toBe('Base Component');
      expect(getSourceLabel('estimated')).toBe('Estimated');
    });

    test('should return default label for unknown source', () => {
      expect(getSourceLabel('unknown')).toBe('Unknown Source');
      expect(getSourceLabel('')).toBe('Unknown Source');
    });
  });
});

describe('Carbon Footprint Formatting', () => {
  const formatCarbonFootprint = (value: number | null | undefined): string => {
    if (value === null || value === undefined) return 'N/A';
    if (value === 0) return '0.00 kg CO₂e';
    if (value < 0.01) return '<0.01 kg CO₂e';
    if (value >= 1000) return `${(value / 1000).toFixed(1)}t CO₂e`;
    return `${value.toFixed(2)} kg CO₂e`;
  };

  test('should format carbon footprint values correctly', () => {
    expect(formatCarbonFootprint(2.5)).toBe('2.50 kg CO₂e');
    expect(formatCarbonFootprint(0.005)).toBe('<0.01 kg CO₂e');
    expect(formatCarbonFootprint(1500)).toBe('1.5t CO₂e');
    expect(formatCarbonFootprint(0)).toBe('0.00 kg CO₂e');
    expect(formatCarbonFootprint(null)).toBe('N/A');
    expect(formatCarbonFootprint(undefined)).toBe('N/A');
  });

  test('should handle edge cases', () => {
    expect(formatCarbonFootprint(0.01)).toBe('0.01 kg CO₂e');
    expect(formatCarbonFootprint(999.99)).toBe('999.99 kg CO₂e');
    expect(formatCarbonFootprint(1000)).toBe('1.0t CO₂e');
  });
});

describe('Data Processing Utilities', () => {
  test('should calculate total footprint from entries', () => {
    const calculateTotalFootprint = (entries: Array<{ total_footprint: number }>) => {
      return entries.reduce((total, entry) => total + entry.total_footprint, 0);
    };

    const entries = [
      { total_footprint: 2.5 },
      { total_footprint: 1.8 },
      { total_footprint: 3.2 }
    ];

    expect(calculateTotalFootprint(entries)).toBe(7.5);
    expect(calculateTotalFootprint([])).toBe(0);
  });

  test('should calculate average footprint', () => {
    const calculateAverageFootprint = (entries: Array<{ total_footprint: number }>) => {
      if (entries.length === 0) return 0;
      const total = entries.reduce((sum, entry) => sum + entry.total_footprint, 0);
      return total / entries.length;
    };

    const entries = [
      { total_footprint: 2.0 },
      { total_footprint: 4.0 },
      { total_footprint: 6.0 }
    ];

    expect(calculateAverageFootprint(entries)).toBe(4.0);
    expect(calculateAverageFootprint([])).toBe(0);
  });
});

describe('Form Validation Helpers', () => {
  test('should validate email format', () => {
    const isValidEmail = (email: string): boolean => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email);
    };

    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name+tag@domain.co.uk')).toBe(true);
    expect(isValidEmail('invalid.email')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
    expect(isValidEmail('@example.com')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });

  test('should validate quantity input', () => {
    const isValidQuantity = (quantity: string | number): boolean => {
      const num = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
      return !isNaN(num) && num > 0 && num <= 10000;
    };

    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity('2.5')).toBe(true);
    expect(isValidQuantity(10000)).toBe(true);
    expect(isValidQuantity(0)).toBe(false);
    expect(isValidQuantity(-1)).toBe(false);
    expect(isValidQuantity(10001)).toBe(false);
    expect(isValidQuantity('invalid')).toBe(false);
    expect(isValidQuantity('')).toBe(false);
  });
});

describe('URL and Navigation Helpers', () => {
  test('should build search query parameters', () => {
    const buildSearchParams = (params: Record<string, any>): string => {
      const searchParams = new URLSearchParams();
      
      Object.entries(params).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          if (Array.isArray(value)) {
            value.forEach(v => searchParams.append(key, v.toString()));
          } else {
            searchParams.set(key, value.toString());
          }
        }
      });
      
      return searchParams.toString();
    };

    expect(buildSearchParams({ q: 'milk', page: 1 })).toBe('q=milk&page=1');
    expect(buildSearchParams({ categories: ['dairy', 'organic'] })).toBe('categories=dairy&categories=organic');
    expect(buildSearchParams({ q: '', page: null })).toBe('');
    expect(buildSearchParams({})).toBe('');
  });
});
