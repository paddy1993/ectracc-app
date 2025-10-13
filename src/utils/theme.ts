import { createTheme, ThemeOptions } from '@mui/material/styles';
import { COLORS } from '../constants';
import { enhanceThemeForAccessibility, accessibilityColors, focusStyles, motionPreferences } from '../theme/accessibility';

// Base theme configuration
const baseTheme: ThemeOptions = {
  palette: {
    primary: {
      main: COLORS.primary,
      light: '#81C784',
      dark: '#388E3C',
      contrastText: '#fff'
    },
    secondary: {
      main: COLORS.secondary,
      light: '#64B5F6',
      dark: '#1976D2',
      contrastText: '#fff'
    },
    success: {
      main: COLORS.success
    },
    warning: {
      main: COLORS.warning
    },
    error: {
      main: COLORS.error
    },
    info: {
      main: COLORS.info
    }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 600
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600
    }
  },
  shape: {
    borderRadius: 12
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          minHeight: '44px',
          minWidth: '44px',
          '&:focus-visible': {
            ...focusStyles.button,
            outline: `2px solid ${accessibilityColors.focus.outline}`,
            outlineOffset: '2px',
            boxShadow: `0 0 0 4px ${accessibilityColors.focus.outline}40`
          },
          [motionPreferences.respectsReducedMotion]: {
            ...motionPreferences.reducedMotion
          },
          '@media (prefers-reduced-motion: no-preference)': {
            transition: 'all 0.2s ease-in-out'
          }
        }
      }
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minHeight: '44px',
          minWidth: '44px',
          '&:focus-visible': {
            ...focusStyles.button,
            outline: `2px solid ${accessibilityColors.focus.outline}`,
            outlineOffset: '2px',
            backgroundColor: `${accessibilityColors.focus.outline}10`
          }
        }
      }
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:focus-within': {
              outline: `2px solid ${accessibilityColors.focus.primary}`,
              outlineOffset: '1px'
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: accessibilityColors.focus.primary,
                borderWidth: '2px'
              }
            }
          },
          '& .MuiInputLabel-root.Mui-focused': {
            color: accessibilityColors.focus.primary
          }
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0 2px 16px rgba(0,0,0,0.08)',
          '&:focus-within': {
            outline: `2px solid ${accessibilityColors.focus.outline}`,
            outlineOffset: '2px'
          },
          '@media (prefers-contrast: high)': {
            border: '1px solid',
            boxShadow: 'none'
          }
        }
      }
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '16px',
          '&:last-child': {
            paddingBottom: '16px'
          }
        }
      }
    },
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (min-width: 600px)': {
            paddingLeft: '24px',
            paddingRight: '24px'
          }
        }
      }
    },
    MuiTypography: {
      styleOverrides: {
        gutterBottom: {
          marginBottom: '0.75em'
        },
        root: {
          '@media (prefers-contrast: high)': {
            fontWeight: 500
          }
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          '&:focus-visible': {
            outline: `2px solid ${accessibilityColors.focus.outline}`,
            outlineOffset: '2px'
          },
          '&.MuiChip-clickable': {
            minHeight: '32px',
            '&:hover': {
              '@media (prefers-reduced-motion: no-preference)': {
                transform: 'translateY(-1px)'
              }
            }
          }
        }
      }
    },
    MuiFab: {
      styleOverrides: {
        root: {
          minHeight: '56px',
          minWidth: '56px',
          '&:focus-visible': {
            outline: `2px solid ${accessibilityColors.focus.outline}`,
            outlineOffset: '2px'
          }
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          '&.MuiAlert-standardError': {
            backgroundColor: `${accessibilityColors.highContrast.error}10`,
            color: accessibilityColors.highContrast.error,
            border: `1px solid ${accessibilityColors.highContrast.error}40`
          },
          '&.MuiAlert-standardWarning': {
            backgroundColor: `${accessibilityColors.highContrast.warning}10`,
            color: accessibilityColors.highContrast.warning,
            border: `1px solid ${accessibilityColors.highContrast.warning}40`
          },
          '&.MuiAlert-standardSuccess': {
            backgroundColor: `${accessibilityColors.highContrast.success}10`,
            color: accessibilityColors.highContrast.success,
            border: `1px solid ${accessibilityColors.highContrast.success}40`
          },
          '&.MuiAlert-standardInfo': {
            backgroundColor: `${accessibilityColors.highContrast.info}10`,
            color: accessibilityColors.highContrast.info,
            border: `1px solid ${accessibilityColors.highContrast.info}40`
          }
        }
      }
    }
  }
};

// Light theme with accessibility enhancements
const baseLightTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'light',
    background: {
      default: '#f8fafc',
      paper: '#ffffff'
    },
    text: {
      primary: accessibilityColors.text.primary,
      secondary: accessibilityColors.text.secondary
    }
  }
});

export const lightTheme = enhanceThemeForAccessibility(baseLightTheme);

// Dark theme with accessibility enhancements
const baseDarkTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'dark',
    background: {
      default: '#0f172a',
      paper: '#1e293b'
    },
    text: {
      primary: '#f1f5f9',
      secondary: '#cbd5e1'
    }
  }
});

export const darkTheme = enhanceThemeForAccessibility(baseDarkTheme);

// High contrast theme
export const highContrastTheme = enhanceThemeForAccessibility(createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'light',
    primary: {
      main: accessibilityColors.highContrast.primary,
      contrastText: '#ffffff'
    },
    secondary: {
      main: accessibilityColors.highContrast.secondary,
      contrastText: '#ffffff'
    },
    success: {
      main: accessibilityColors.highContrast.success
    },
    warning: {
      main: accessibilityColors.highContrast.warning
    },
    error: {
      main: accessibilityColors.highContrast.error
    },
    info: {
      main: accessibilityColors.highContrast.info
    },
    background: {
      default: '#ffffff',
      paper: '#ffffff'
    },
    text: {
      primary: accessibilityColors.text.primary,
      secondary: accessibilityColors.text.secondary
    }
  },
  components: {
    ...baseTheme.components,
    MuiButton: {
      ...baseTheme.components?.MuiButton,
      styleOverrides: {
        ...baseTheme.components?.MuiButton?.styleOverrides,
        root: {
          ...(baseTheme.components?.MuiButton?.styleOverrides?.root as any || {}),
          border: '2px solid',
          '&:hover': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        }
      }
    },
    MuiCard: {
      ...baseTheme.components?.MuiCard,
      styleOverrides: {
        ...baseTheme.components?.MuiCard?.styleOverrides,
        root: {
          ...(baseTheme.components?.MuiCard?.styleOverrides?.root as any || {}),
          border: '1px solid #000000',
          boxShadow: 'none'
        }
      }
    }
  }
}));

// Get theme based on mode and accessibility preferences
export const getTheme = (
  mode: 'light' | 'dark', 
  highContrast: boolean = false
) => {
  if (highContrast) {
    return highContrastTheme;
  }
  return mode === 'light' ? lightTheme : darkTheme;
};



