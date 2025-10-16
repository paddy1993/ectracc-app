import React from 'react';
import { Outlet } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  Logout
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../constants';
import ResponsiveNav from './layout/ResponsiveNav';
import ScanFab from './actions/ScanFab';
import NotificationBell from './NotificationBell';

export default function Layout() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { theme: appTheme, toggleTheme } = useApp();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleScanClick = () => {
    // Navigate to product search page with scan mode
    window.location.href = '/products/search?scan=true';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Top AppBar */}
      <AppBar 
        position="fixed" 
        sx={{ zIndex: theme.zIndex.drawer + 1 }}
        component="header"
        role="banner"
      >
        <Toolbar>
          <Typography 
            variant="h6" 
            component="h1" 
            sx={{ flexGrow: 1, fontWeight: 600 }}
            id="app-title"
          >
            {APP_NAME}
          </Typography>

          <Box component="nav" role="navigation" aria-label="User actions">
            <IconButton 
              color="inherit" 
              onClick={toggleTheme}
              aria-label={`Switch to ${appTheme === 'dark' ? 'light' : 'dark'} theme`}
              sx={{
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.common.white}`,
                  outlineOffset: 2
                }
              }}
            >
              {appTheme === 'dark' ? <Brightness7 /> : <Brightness4 />}
            </IconButton>

            {user && <NotificationBell />}

            {user && (
              <IconButton 
                color="inherit" 
                onClick={handleSignOut} 
                aria-label="Sign out of your account"
                sx={{
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.common.white}`,
                    outlineOffset: 2
                  }
                }}
              >
                <Logout />
              </IconButton>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* Responsive Navigation */}
      <Box component="nav" role="navigation" aria-label="Main navigation" id="navigation">
        <ResponsiveNav />
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        role="main"
        aria-labelledby="app-title"
        id="main-content"
        tabIndex={-1}
        sx={{
          flexGrow: 1,
          p: isMobile ? 1 : 2,
          ml: isMobile ? 0 : { md: '64px', lg: '240px' }, // Dynamic based on sidebar state
          mt: '64px',
          mb: isMobile ? '64px' : 0, // Space for bottom tabs
          backgroundColor: 'background.default',
          minHeight: 'calc(100vh - 64px)',
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          '&:focus': {
            outline: 'none'
          }
        }}
      >
        <Outlet />
      </Box>
      
      {/* Mobile Scan FAB */}
      <ScanFab onClick={handleScanClick} />
      
      {/* Footer for screen readers */}
      <Box 
        component="footer" 
        role="contentinfo" 
        id="footer"
        sx={{ 
          position: 'absolute',
          left: '-10000px',
          width: '1px',
          height: '1px',
          overflow: 'hidden'
        }}
      >
        <Typography variant="body2">
          End of {APP_NAME} application
        </Typography>
      </Box>
    </Box>
  );
}
