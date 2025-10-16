import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../hooks/useAdminAuth';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  IconButton,
  Box,
  Divider,
  Tooltip,
  useTheme
} from '@mui/material';
import {
  Dashboard,
  Search,
  Add,
  Timeline,
  Person,
  Info,
  ChevronLeft,
  ChevronRight,
  AdminPanelSettings
} from '@mui/icons-material';

const baseNavigationItems = [
  { path: '/dashboard', label: 'Dashboard', icon: Dashboard },
  { path: '/products/search', label: 'Products', icon: Search },
  { path: '/tracker', label: 'Manual Entry', icon: Add },
  { path: '/history', label: 'History', icon: Timeline },
  { path: '/profile', label: 'Profile', icon: Person },
  { path: '/about', label: 'About', icon: Info }
];

const adminNavigationItem = { path: '/admin', label: 'Admin Dashboard', icon: AdminPanelSettings };

const SIDEBAR_WIDTH = 240;
const SIDEBAR_COLLAPSED_WIDTH = 64;
const STORAGE_KEY = 'ectracc-sidebar-collapsed';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const { isAdmin } = useAdminAuth();
  
  // Load collapsed state from localStorage
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  // Build navigation items based on admin status
  const navigationItems = React.useMemo(() => {
    const items = [...baseNavigationItems];
    if (isAdmin) {
      items.push(adminNavigationItem);
    }
    return items;
  }, [isAdmin]);

  // Save collapsed state to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsed));
  }, [collapsed]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  const toggleCollapsed = () => {
    setCollapsed(!collapsed);
  };

  const drawerWidth = collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        transition: theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          overflowX: 'hidden',
          borderRight: `1px solid ${theme.palette.divider}`
        }
      }}
    >
      {/* Toolbar spacer */}
      <Box sx={{ height: 64 }} />
      
      {/* Collapse toggle button */}
      <Box sx={{ display: 'flex', justifyContent: collapsed ? 'center' : 'flex-end', p: 1 }}>
        <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} placement="right">
          <IconButton 
            onClick={toggleCollapsed}
            size="small"
            sx={{
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: 2
              }
            }}
          >
            {collapsed ? <ChevronRight /> : <ChevronLeft />}
          </IconButton>
        </Tooltip>
      </Box>
      
      <Divider />

      {/* Navigation items */}
      <List sx={{ pt: 1 }}>
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.path || 
            (item.path === '/products/search' && location.pathname.startsWith('/products'));
          
          return (
            <ListItem key={item.path} disablePadding sx={{ display: 'block' }}>
              <Tooltip 
                title={collapsed ? item.label : ''} 
                placement="right"
                disableHoverListener={!collapsed}
              >
                <ListItemButton
                  selected={isActive}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    minHeight: 48,
                    justifyContent: collapsed ? 'center' : 'initial',
                    px: 2.5,
                    mx: 1,
                    borderRadius: 2,
                    mb: 0.5,
                    '&.Mui-selected': {
                      backgroundColor: theme.palette.primary.light + '20',
                      color: theme.palette.primary.main,
                      '& .MuiListItemIcon-root': {
                        color: theme.palette.primary.main,
                      },
                      '&:hover': {
                        backgroundColor: theme.palette.primary.light + '30',
                      }
                    },
                    '&:hover': {
                      backgroundColor: theme.palette.action.hover,
                      borderRadius: 2
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: -2
                    }
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: collapsed ? 'auto' : 3,
                      justifyContent: 'center',
                    }}
                  >
                    <item.icon />
                  </ListItemIcon>
                  
                  <ListItemText 
                    primary={item.label}
                    sx={{ 
                      opacity: collapsed ? 0 : 1,
                      '& .MuiListItemText-primary': {
                        fontWeight: isActive ? 600 : 400,
                        fontSize: '0.875rem'
                      }
                    }}
                  />
                </ListItemButton>
              </Tooltip>
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}
