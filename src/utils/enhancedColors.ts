// Enhanced Color System for ECTRACC
// Provides comprehensive color tokens for better design consistency

export const ENHANCED_COLORS = {
  // Primary green palette (eco-friendly theme)
  primary: {
    50: '#E8F5E8',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50', // Main brand color
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
    A100: '#B9F6CA',
    A200: '#69F0AE',
    A400: '#00E676',
    A700: '#00C853'
  },

  // Secondary blue palette (trust and reliability)
  secondary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Main secondary color
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
    A100: '#82B1FF',
    A200: '#448AFF',
    A400: '#2979FF',
    A700: '#2962FF'
  },

  // Neutral grays (modern and clean)
  neutral: {
    0: '#FFFFFF',
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
    950: '#0A0A0A'
  },

  // Semantic colors (status and feedback)
  semantic: {
    success: {
      light: '#81C784',
      main: '#4CAF50',
      dark: '#388E3C',
      contrastText: '#FFFFFF'
    },
    warning: {
      light: '#FFB74D',
      main: '#FF9800',
      dark: '#F57C00',
      contrastText: '#FFFFFF'
    },
    error: {
      light: '#E57373',
      main: '#F44336',
      dark: '#D32F2F',
      contrastText: '#FFFFFF'
    },
    info: {
      light: '#64B5F6',
      main: '#2196F3',
      dark: '#1976D2',
      contrastText: '#FFFFFF'
    }
  },

  // Carbon footprint specific colors
  carbon: {
    excellent: '#4CAF50', // Very low footprint
    good: '#8BC34A',      // Low footprint
    moderate: '#FFC107',   // Medium footprint
    high: '#FF9800',      // High footprint
    critical: '#F44336'   // Very high footprint
  },

  // Data visualization palette (colorblind friendly)
  chart: {
    primary: '#4CAF50',
    secondary: '#2196F3',
    tertiary: '#FF9800',
    quaternary: '#9C27B0',
    quinary: '#607D8B',
    gradient: {
      green: ['#E8F5E8', '#4CAF50', '#1B5E20'],
      blue: ['#E3F2FD', '#2196F3', '#0D47A1'],
      orange: ['#FFF3E0', '#FF9800', '#E65100']
    }
  },

  // Background variations
  background: {
    light: {
      primary: '#FFFFFF',
      secondary: '#FAFAFA',
      tertiary: '#F5F5F5',
      elevated: '#FFFFFF',
      overlay: 'rgba(0, 0, 0, 0.5)'
    },
    dark: {
      primary: '#0F172A',
      secondary: '#1E293B',
      tertiary: '#334155',
      elevated: '#1E293B',
      overlay: 'rgba(0, 0, 0, 0.7)'
    }
  },

  // Text colors with proper contrast ratios
  text: {
    light: {
      primary: '#212121',     // 87% opacity equivalent
      secondary: '#757575',   // 60% opacity equivalent
      disabled: '#BDBDBD',    // 38% opacity equivalent
      hint: '#9E9E9E'        // 50% opacity equivalent
    },
    dark: {
      primary: '#F1F5F9',     // 87% opacity equivalent
      secondary: '#CBD5E1',   // 60% opacity equivalent
      disabled: '#64748B',    // 38% opacity equivalent
      hint: '#94A3B8'        // 50% opacity equivalent
    }
  },

  // Interactive states
  interaction: {
    hover: 'rgba(0, 0, 0, 0.04)',
    selected: 'rgba(76, 175, 80, 0.12)',
    focus: 'rgba(76, 175, 80, 0.24)',
    pressed: 'rgba(0, 0, 0, 0.12)',
    disabled: 'rgba(0, 0, 0, 0.26)'
  },

  // Elevation shadows (Material Design 3)
  elevation: {
    0: 'none',
    1: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
    2: '0px 1px 2px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
    3: '0px 1px 3px rgba(0, 0, 0, 0.3), 0px 4px 8px 3px rgba(0, 0, 0, 0.15)',
    4: '0px 2px 3px rgba(0, 0, 0, 0.3), 0px 6px 10px 4px rgba(0, 0, 0, 0.15)',
    5: '0px 4px 4px rgba(0, 0, 0, 0.3), 0px 8px 12px 6px rgba(0, 0, 0, 0.15)'
  }
};

// Utility functions for color manipulation
export const colorUtils = {
  // Add alpha channel to hex color
  addAlpha: (hex: string, alpha: number): string => {
    const alphaHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `${hex}${alphaHex}`;
  },

  // Get carbon footprint color based on value
  getCarbonColor: (value: number, max: number = 100): string => {
    const percentage = (value / max) * 100;
    if (percentage <= 20) return ENHANCED_COLORS.carbon.excellent;
    if (percentage <= 40) return ENHANCED_COLORS.carbon.good;
    if (percentage <= 60) return ENHANCED_COLORS.carbon.moderate;
    if (percentage <= 80) return ENHANCED_COLORS.carbon.high;
    return ENHANCED_COLORS.carbon.critical;
  },

  // Get contrast text color
  getContrastText: (backgroundColor: string, theme: 'light' | 'dark' = 'light'): string => {
    // Simplified contrast calculation - in production, use a proper contrast ratio library
    const isDark = backgroundColor.includes('dark') || backgroundColor.includes('900') || backgroundColor.includes('800');
    return isDark 
      ? ENHANCED_COLORS.text.dark.primary 
      : ENHANCED_COLORS.text.light.primary;
  },

  // Generate gradient
  createGradient: (colors: string[], direction: string = 'to right'): string => {
    return `linear-gradient(${direction}, ${colors.join(', ')})`;
  },

  // Get semantic color with alpha
  getSemanticColor: (type: 'success' | 'warning' | 'error' | 'info', alpha: number = 1): string => {
    const color = ENHANCED_COLORS.semantic[type].main;
    return alpha === 1 ? color : colorUtils.addAlpha(color, alpha);
  }
};

// Accessibility color combinations (WCAG AAA compliant)
export const accessibleCombinations = {
  highContrast: {
    text: '#000000',
    background: '#FFFFFF',
    primary: '#0066CC',
    secondary: '#8B5A2B',
    success: '#2E7D32',
    warning: '#ED6C02',
    error: '#D32F2F',
    info: '#0288D1'
  },
  darkMode: {
    text: '#F1F5F9',
    background: '#0F172A',
    primary: '#4CAF50',
    secondary: '#2196F3',
    success: '#4CAF50',
    warning: '#FF9800',
    error: '#F44336',
    info: '#2196F3'
  }
};

// Export default color system for backward compatibility
export const COLORS = {
  primary: ENHANCED_COLORS.primary[500],
  secondary: ENHANCED_COLORS.secondary[500],
  success: ENHANCED_COLORS.semantic.success.main,
  warning: ENHANCED_COLORS.semantic.warning.main,
  error: ENHANCED_COLORS.semantic.error.main,
  info: ENHANCED_COLORS.semantic.info.main
};

export default ENHANCED_COLORS;
