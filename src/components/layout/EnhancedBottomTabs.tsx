import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Paper,
  BottomNavigation,
  BottomNavigationAction,
  Badge,
  Box,
  useTheme,
  useMediaQuery,
  Fab,
  Zoom
} from '@mui/material';
import {
  Dashboard,
  QrCodeScanner,
  Add,
  History,
  Person,
  Search
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { ENHANCED_COLORS } from '../../utils/enhancedColors';

// Haptic feedback utility
const hapticFeedback = {
  light: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    // iOS haptic feedback
    if ('hapticFeedback' in window) {
      (window as any).hapticFeedback.impactOccurred('light');
    }
  },
  medium: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }
    if ('hapticFeedback' in window) {
      (window as any).hapticFeedback.impactOccurred('medium');
    }
  },
  heavy: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([30, 10, 30]);
    }
    if ('hapticFeedback' in window) {
      (window as any).hapticFeedback.impactOccurred('heavy');
    }
  },
  success: () => {
    if ('vibrate' in navigator) {
      navigator.vibrate([10, 50, 10]);
    }
    if ('hapticFeedback' in window) {
      (window as any).hapticFeedback.notificationOccurred('success');
    }
  }
};

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ComponentType;
  badge?: number;
  isPrimary?: boolean;
  disabled?: boolean;
}

interface EnhancedBottomTabsProps {
  onTabChange?: (index: number, path: string) => void;
  showLabels?: boolean;
  enableHaptics?: boolean;
  enableGestures?: boolean;
}

const EnhancedBottomTabs: React.FC<EnhancedBottomTabsProps> = ({
  onTabChange,
  showLabels = true,
  enableHaptics = true,
  enableGestures = true
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  // Navigation items configuration
  const navigationItems: NavigationItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: Dashboard
    },
    {
      label: 'Scan',
      path: '/products/search?scan=true',
      icon: QrCodeScanner,
      isPrimary: true
    },
    {
      label: 'Products',
      path: '/products/search',
      icon: Search
    },
    {
      label: 'History',
      path: '/history',
      icon: History,
      badge: 0 // Could be set based on new entries
    },
    {
      label: 'Profile',
      path: '/profile',
      icon: Person
    }
  ];

  // Find current tab index based on location
  useEffect(() => {
    const currentPath = location.pathname;
    const index = navigationItems.findIndex(item => {
      if (item.path.includes('?')) {
        return currentPath === item.path.split('?')[0];
      }
      return currentPath === item.path || currentPath.startsWith(item.path + '/');
    });
    setCurrentIndex(index >= 0 ? index : 0);
  }, [location.pathname]);

  // Auto-hide on scroll (mobile optimization)
  useEffect(() => {
    if (!isMobile || !enableGestures) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = currentScrollY - lastScrollY;

      if (Math.abs(scrollDifference) > 10) {
        setIsVisible(scrollDifference < 0 || currentScrollY < 100);
        setLastScrollY(currentScrollY);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMobile, enableGestures]);

  // Swipe gesture handling
  useEffect(() => {
    if (!enableGestures || !isMobile) return;

    let startX = 0;
    let startY = 0;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!startX || !startY) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = startX - currentX;
      const diffY = startY - currentY;

      // Only handle horizontal swipes
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
        setSwipeDirection(diffX > 0 ? 'left' : 'right');
      }
    };

    const handleTouchEnd = () => {
      if (swipeDirection) {
        const newIndex = swipeDirection === 'left' 
          ? Math.min(currentIndex + 1, navigationItems.length - 1)
          : Math.max(currentIndex - 1, 0);
        
        if (newIndex !== currentIndex) {
          handleNavigation(null, newIndex);
          if (enableHaptics) hapticFeedback.light();
        }
        setSwipeDirection(null);
      }
      startX = 0;
      startY = 0;
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentIndex, swipeDirection, enableGestures, isMobile, enableHaptics]);

  const handleNavigation = useCallback((event: React.SyntheticEvent | null, newValue: number) => {
    const item = navigationItems[newValue];
    if (!item || item.disabled) return;

    // Haptic feedback
    if (enableHaptics) {
      if (item.isPrimary) {
        hapticFeedback.medium();
      } else {
        hapticFeedback.light();
      }
    }

    setCurrentIndex(newValue);
    navigate(item.path);
    
    if (onTabChange) {
      onTabChange(newValue, item.path);
    }
  }, [navigate, onTabChange, enableHaptics]);

  // Floating Action Button for primary action (scan)
  const primaryItem = navigationItems.find(item => item.isPrimary);
  const primaryIndex = navigationItems.findIndex(item => item.isPrimary);

  if (!isMobile) return null;

  return (
    <>
      {/* Main Bottom Navigation */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 1100
            }}
          >
            <Paper
              elevation={8}
              sx={{
                borderTop: `1px solid ${theme.palette.divider}`,
                borderRadius: '16px 16px 0 0',
                // Safe area for devices with home indicators
                paddingBottom: 'env(safe-area-inset-bottom)',
                background: theme.palette.mode === 'dark' 
                  ? 'rgba(30, 41, 59, 0.95)' 
                  : 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(10px)',
                // Swipe indicator
                '&::before': swipeDirection ? {
                  content: '""',
                  position: 'absolute',
                  top: 4,
                  left: swipeDirection === 'right' ? 8 : 'auto',
                  right: swipeDirection === 'left' ? 8 : 'auto',
                  width: 4,
                  height: 32,
                  backgroundColor: ENHANCED_COLORS.primary[500],
                  borderRadius: 2,
                  opacity: 0.7,
                  transition: 'all 0.2s ease'
                } : {}
              }}
            >
              <BottomNavigation
                value={currentIndex}
                onChange={handleNavigation}
                showLabels={showLabels}
                sx={{
                  backgroundColor: 'transparent',
                  height: 64,
                  '& .MuiBottomNavigationAction-root': {
                    minWidth: 'auto',
                    padding: '6px 12px 8px',
                    transition: 'all 0.2s ease-in-out',
                    '&.Mui-selected': {
                      color: ENHANCED_COLORS.primary[600],
                      '& .MuiBottomNavigationAction-label': {
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        transform: 'scale(1.05)'
                      },
                      '& .MuiSvgIcon-root': {
                        transform: 'scale(1.1)'
                      }
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${ENHANCED_COLORS.primary[500]}`,
                      outlineOffset: -2,
                      borderRadius: 1
                    },
                    // Hide primary action from bottom nav (it's a FAB)
                    '&:nth-of-type(2)': {
                      display: 'none'
                    }
                  }
                }}
              >
                {navigationItems.map((item, index) => {
                  if (item.isPrimary) return null; // Skip primary action

                  return (
                    <BottomNavigationAction
                      key={item.path}
                      label={item.label}
                      disabled={item.disabled}
                      icon={
                        <Badge 
                          badgeContent={item.badge} 
                          color="error"
                          sx={{
                            '& .MuiBadge-badge': {
                              fontSize: '0.6rem',
                              height: 16,
                              minWidth: 16
                            }
                          }}
                        >
                          <item.icon />
                        </Badge>
                      }
                      value={index}
                    />
                  );
                })}
              </BottomNavigation>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button for Primary Action */}
      {primaryItem && (
        <Zoom in={isVisible} timeout={300}>
          <Fab
            color="primary"
            size="large"
            onClick={() => handleNavigation(null, primaryIndex)}
            sx={{
              position: 'fixed',
              bottom: 80, // Above bottom nav
              right: 20,
              zIndex: 1200,
              width: 64,
              height: 64,
              boxShadow: theme.shadows[6],
              background: `linear-gradient(135deg, ${ENHANCED_COLORS.primary[500]}, ${ENHANCED_COLORS.primary[600]})`,
              '&:hover': {
                background: `linear-gradient(135deg, ${ENHANCED_COLORS.primary[600]}, ${ENHANCED_COLORS.primary[700]})`,
                transform: 'scale(1.05)'
              },
              '&:active': {
                transform: 'scale(0.95)'
              },
              // Pulse animation for attention
              animation: currentIndex !== primaryIndex ? 'pulse 2s infinite' : 'none',
              '@keyframes pulse': {
                '0%': {
                  boxShadow: `0 0 0 0 ${ENHANCED_COLORS.primary[500]}40`
                },
                '70%': {
                  boxShadow: `0 0 0 10px ${ENHANCED_COLORS.primary[500]}00`
                },
                '100%': {
                  boxShadow: `0 0 0 0 ${ENHANCED_COLORS.primary[500]}00`
                }
              }
            }}
            aria-label={primaryItem.label}
          >
            <Box sx={{ fontSize: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <primaryItem.icon />
            </Box>
          </Fab>
        </Zoom>
      )}

      {/* Quick Action Indicator */}
      {swipeDirection && (
        <Box
          sx={{
            position: 'fixed',
            top: '50%',
            left: swipeDirection === 'right' ? 20 : 'auto',
            right: swipeDirection === 'left' ? 20 : 'auto',
            transform: 'translateY(-50%)',
            zIndex: 1300,
            backgroundColor: ENHANCED_COLORS.primary[500],
            color: 'white',
            padding: '8px 12px',
            borderRadius: 2,
            fontSize: '0.75rem',
            fontWeight: 600,
            opacity: 0.9
          }}
        >
          {swipeDirection === 'left' ? 'Next →' : '← Previous'}
        </Box>
      )}
    </>
  );
};

export default EnhancedBottomTabs;
