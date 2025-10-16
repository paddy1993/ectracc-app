import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  BottomNavigation, 
  BottomNavigationAction, 
  useTheme,
  Paper
} from '@mui/material';
import {
  Dashboard,
  QrCodeScanner,
  Timeline,
  Person,
  AdminPanelSettings
} from '@mui/icons-material';
import { useAdminAuth } from '../../hooks/useAdminAuth';

const baseNavigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Dashboard },
  { path: '/products/search', label: 'Scan', icon: QrCodeScanner }, // Prominent scan action
  { path: '/history', label: 'History', icon: Timeline },
  { path: '/profile', label: 'Profile', icon: Person }
];

export default function BottomTabs() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAdmin } = useAdminAuth();

  // Build navigation items based on admin status
  const navigationItems = React.useMemo(() => {
    const items = [...baseNavigationItems];
    if (isAdmin) {
      // Insert admin before profile for better mobile layout
      items.splice(-1, 0, { path: '/admin', label: 'Admin', icon: AdminPanelSettings });
    }
    return items;
  }, [isAdmin]);

  const currentIndex = navigationItems.findIndex(item => 
    location.pathname === item.path || 
    (item.path === '/products/search' && location.pathname.startsWith('/products'))
  );

  const handleNavigation = (event: React.SyntheticEvent, newValue: number) => {
    if (newValue >= 0 && newValue < navigationItems.length) {
      navigate(navigationItems[newValue].path);
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        borderTop: `1px solid ${theme.palette.divider}`,
        // Safe area for mobile devices
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}
      elevation={8}
    >
      <BottomNavigation
        value={currentIndex}
        onChange={handleNavigation}
        showLabels
        sx={{
          height: 64, // Slightly taller for better touch targets
          '& .MuiBottomNavigationAction-root': {
            minWidth: 'auto',
            padding: '6px 12px 8px',
            '&.Mui-selected': {
              color: theme.palette.primary.main,
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.75rem',
                fontWeight: 600
              }
            },
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: -2,
              borderRadius: 1
            }
          },
          // Highlight the scan button
          '& .MuiBottomNavigationAction-root:nth-of-type(2)': {
            '& .MuiSvgIcon-root': {
              fontSize: '1.75rem', // Larger scan icon
              padding: '4px',
              borderRadius: '50%',
              backgroundColor: currentIndex === 1 ? theme.palette.primary.main : theme.palette.primary.light + '30',
              color: currentIndex === 1 ? 'white' : theme.palette.primary.main
            }
          }
        }}
      >
        {navigationItems.map((item, index) => (
          <BottomNavigationAction
            key={item.path}
            label={item.label}
            icon={<item.icon />}
            value={index}
          />
        ))}
      </BottomNavigation>
    </Paper>
  );
}
