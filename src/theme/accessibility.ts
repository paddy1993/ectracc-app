import { Theme } from '@mui/material/styles';

// WCAG AA compliant color contrasts
export const accessibilityColors = {
  // High contrast colors for better visibility
  highContrast: {
    primary: '#0066CC',
    secondary: '#8B5A2B',
    success: '#2E7D32',
    warning: '#ED6C02',
    error: '#D32F2F',
    info: '#0288D1'
  },
  
  // Focus indicators
  focus: {
    primary: '#005A9F',
    secondary: '#7A4D26',
    outline: '#005A9F',
    outlineWidth: '2px',
    outlineOffset: '2px'
  },
  
  // Text contrast ratios (WCAG AA: 4.5:1, AAA: 7:1)
  text: {
    primary: '#212121',      // 16:1 contrast ratio
    secondary: '#424242',    // 12:1 contrast ratio
    disabled: '#9E9E9E',     // 4.5:1 contrast ratio
    onPrimary: '#FFFFFF',    // 21:1 contrast ratio
    onSecondary: '#FFFFFF'   // 21:1 contrast ratio
  }
};

// Focus styles for interactive elements
export const focusStyles = {
  default: {
    outline: `${accessibilityColors.focus.outlineWidth} solid ${accessibilityColors.focus.outline}`,
    outlineOffset: accessibilityColors.focus.outlineOffset,
    borderRadius: '4px'
  },
  
  button: {
    outline: `${accessibilityColors.focus.outlineWidth} solid ${accessibilityColors.focus.outline}`,
    outlineOffset: accessibilityColors.focus.outlineOffset,
    boxShadow: `0 0 0 ${accessibilityColors.focus.outlineWidth} ${accessibilityColors.focus.outline}40`
  },
  
  input: {
    outline: `${accessibilityColors.focus.outlineWidth} solid ${accessibilityColors.focus.primary}`,
    outlineOffset: '1px',
    borderColor: accessibilityColors.focus.primary
  }
};

// Reduced motion preferences
export const motionPreferences = {
  // Respect user's motion preferences
  respectsReducedMotion: '@media (prefers-reduced-motion: reduce)',
  
  // Reduced motion variants
  reducedMotion: {
    transition: 'none',
    animation: 'none',
    transform: 'none'
  },
  
  // Standard motion for users who don't prefer reduced motion
  standardMotion: {
    transition: 'all 0.2s ease-in-out',
    animation: 'fadeIn 0.3s ease-in-out'
  }
};

// Accessibility mixins for common patterns
export const a11yMixins = {
  // Screen reader only content
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: 0
  },
  
  // Skip link for keyboard navigation
  skipLink: {
    position: 'absolute',
    top: '-40px',
    left: '6px',
    background: accessibilityColors.highContrast.primary,
    color: accessibilityColors.text.onPrimary,
    padding: '8px',
    textDecoration: 'none',
    borderRadius: '4px',
    zIndex: 9999,
    '&:focus': {
      top: '6px'
    }
  },
  
  // High contrast mode support
  highContrast: {
    '@media (prefers-contrast: high)': {
      border: '1px solid',
      backgroundColor: 'Canvas',
      color: 'CanvasText'
    }
  },
  
  // Focus visible styles
  focusVisible: {
    '&:focus-visible': focusStyles.default,
    '&.Mui-focusVisible': focusStyles.default
  },
  
  // Interactive element minimum size (44px for touch targets)
  touchTarget: {
    minHeight: '44px',
    minWidth: '44px'
  }
};

// Color contrast utilities
export const contrastUtils = {
  // Calculate relative luminance
  getLuminance: (color: string): number => {
    const rgb = parseInt(color.slice(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },
  
  // Calculate contrast ratio
  getContrastRatio: (color1: string, color2: string): number => {
    const lum1 = contrastUtils.getLuminance(color1);
    const lum2 = contrastUtils.getLuminance(color2);
    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);
    return (brightest + 0.05) / (darkest + 0.05);
  },
  
  // Check if contrast meets WCAG standards
  meetsWCAG: (color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean => {
    const ratio = contrastUtils.getContrastRatio(color1, color2);
    return level === 'AA' ? ratio >= 4.5 : ratio >= 7;
  }
};

// Keyboard navigation utilities
export const keyboardUtils = {
  // Common keyboard event handlers
  handleEnterSpace: (callback: () => void) => (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  },
  
  // Escape key handler
  handleEscape: (callback: () => void) => (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      callback();
    }
  },
  
  // Arrow key navigation
  handleArrowKeys: (
    onUp?: () => void,
    onDown?: () => void,
    onLeft?: () => void,
    onRight?: () => void
  ) => (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        onUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        onDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        onLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        onRight?.();
        break;
    }
  }
};

// ARIA utilities
export const ariaUtils = {
  // Generate unique IDs for ARIA relationships
  generateId: (prefix: string = 'ectracc'): string => {
    return `${prefix}-${Math.random().toString(36).substr(2, 9)}`;
  },
  
  // Common ARIA attributes
  button: (label: string, expanded?: boolean, controls?: string) => ({
    role: 'button',
    'aria-label': label,
    ...(expanded !== undefined && { 'aria-expanded': expanded }),
    ...(controls && { 'aria-controls': controls }),
    tabIndex: 0
  }),
  
  dialog: (labelledBy: string, describedBy?: string) => ({
    role: 'dialog',
    'aria-labelledby': labelledBy,
    'aria-modal': true,
    ...(describedBy && { 'aria-describedby': describedBy })
  }),
  
  list: (label?: string) => ({
    role: 'list',
    ...(label && { 'aria-label': label })
  }),
  
  listItem: () => ({
    role: 'listitem'
  }),
  
  region: (label: string) => ({
    role: 'region',
    'aria-label': label
  })
};

// Theme enhancement function
export const enhanceThemeForAccessibility = (theme: Theme): Theme => {
  return {
    ...theme,
    components: {
      ...theme.components,
      
      // Button accessibility enhancements
      MuiButton: {
        ...theme.components?.MuiButton,
        styleOverrides: {
          ...theme.components?.MuiButton?.styleOverrides,
          root: {
            ...(theme.components?.MuiButton?.styleOverrides?.root || {}),
            minHeight: '44px',
            '&:focus-visible': focusStyles.button,
            [motionPreferences.respectsReducedMotion]: motionPreferences.reducedMotion
          }
        }
      },
      
      // TextField accessibility enhancements
      MuiTextField: {
        ...theme.components?.MuiTextField,
        styleOverrides: {
          ...theme.components?.MuiTextField?.styleOverrides,
          root: {
            ...(theme.components?.MuiTextField?.styleOverrides?.root || {}),
            '& .MuiOutlinedInput-root': {
              '&:focus-within': focusStyles.input,
              '&.Mui-focused': focusStyles.input
            }
          }
        }
      },
      
      // IconButton accessibility enhancements
      MuiIconButton: {
        ...theme.components?.MuiIconButton,
        styleOverrides: {
          ...theme.components?.MuiIconButton?.styleOverrides,
          root: {
            ...(theme.components?.MuiIconButton?.styleOverrides?.root || {}),
            minHeight: '44px',
            minWidth: '44px',
            '&:focus-visible': focusStyles.button
          }
        }
      },
      
      // Chip accessibility enhancements
      MuiChip: {
        ...theme.components?.MuiChip,
        styleOverrides: {
          ...theme.components?.MuiChip?.styleOverrides,
          root: {
            ...(theme.components?.MuiChip?.styleOverrides?.root || {}),
            '&:focus-visible': focusStyles.default,
            '&.MuiChip-clickable': {
              minHeight: '32px'
            }
          }
        }
      }
    }
  };
};

export default {
  accessibilityColors,
  focusStyles,
  motionPreferences,
  a11yMixins,
  contrastUtils,
  keyboardUtils,
  ariaUtils,
  enhanceThemeForAccessibility
};
