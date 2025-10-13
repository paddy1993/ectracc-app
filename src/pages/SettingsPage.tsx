import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider,
  Button,
  Alert,
  Snackbar,

  Card,
  CardContent,
  CardActions,
  Chip
} from '@mui/material';
import {
  Palette,
  Wifi,
  Storage,
  Info,
  Sync,
  DeleteSweep
} from '@mui/icons-material';
import { useApp } from '../contexts/AppContext';
import { APP_VERSION } from '../constants';
import OfflineSyncManager, { getAppEnvironment, isStandalone } from '../utils/offlineSync';

export default function SettingsPage() {
  const { theme, isOnline, toggleTheme } = useApp();
  
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [offlineSync] = useState(() => OfflineSyncManager.getInstance());

  const appEnvironment = getAppEnvironment();

  useEffect(() => {
    // Get pending sync queue count
    const updateQueueCount = async () => {
      const count = await offlineSync.getPendingQueueCount();
      setPendingQueueCount(count);
    };

    updateQueueCount();
    const interval = setInterval(updateQueueCount, 5000);

    return () => clearInterval(interval);
  }, [offlineSync]);


  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        showSnackbar('Cache cleared successfully');
        
        // Reload the page to get fresh content
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (error) {
      showSnackbar('Failed to clear cache');
    }
  };

  const handleSyncNow = async () => {
    if (!isOnline) {
      showSnackbar('Cannot sync while offline');
      return;
    }

    try {
      await offlineSync.registerBackgroundSync();
      showSnackbar('Sync initiated');
    } catch (error) {
      showSnackbar('Sync failed');
    }
  };

  const showSnackbar = (message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Settings
      </Typography>

      {/* App Environment Info */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            App Environment
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip 
              label={`Running as: ${appEnvironment.toUpperCase()}`} 
              color="primary" 
            />
            {isStandalone() && (
              <Chip label="Standalone Mode" color="success" />
            )}
            {pendingQueueCount > 0 && (
              <Chip 
                label={`${pendingQueueCount} items pending sync`} 
                color="warning" 
                icon={<Sync />}
              />
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Paper sx={{ mb: 3 }}>
        <List>
          <Typography variant="h6" sx={{ p: 2, pb: 0 }}>
            Appearance
          </Typography>
          
          <ListItem>
            <ListItemIcon>
              <Palette />
            </ListItemIcon>
            <ListItemText 
              primary="Dark Mode" 
              secondary="Toggle between light and dark themes"
            />
            <Switch
              checked={theme === 'dark'}
              onChange={toggleTheme}
              color="primary"
            />
          </ListItem>
        </List>
      </Paper>



      {/* Sync & Storage */}
      <Paper sx={{ mb: 3 }}>
        <List>
          <Typography variant="h6" sx={{ p: 2, pb: 0 }}>
            Data & Storage
          </Typography>
          
          <ListItem>
            <ListItemIcon>
              <Wifi />
            </ListItemIcon>
            <ListItemText 
              primary="Connection Status" 
              secondary={isOnline ? "Connected to internet" : "Working offline"}
            />
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: isOnline ? 'success.main' : 'warning.main'
              }}
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <Storage />
            </ListItemIcon>
            <ListItemText 
              primary="Offline Storage" 
              secondary="App data cached for offline use"
            />
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <Sync />
            </ListItemIcon>
            <ListItemText 
              primary="Sync Status" 
              secondary={
                pendingQueueCount > 0 
                  ? `${pendingQueueCount} items waiting to sync`
                  : "All data synced"
              }
            />
            <Button
              size="small"
              onClick={handleSyncNow}
              disabled={!isOnline || pendingQueueCount === 0}
            >
              Sync Now
            </Button>
          </ListItem>
        </List>
      </Paper>

      {/* Advanced Settings */}
      <Paper sx={{ mb: 3 }}>
        <List>
          <Typography variant="h6" sx={{ p: 2, pb: 0 }}>
            Advanced
          </Typography>
          
          <ListItem>
            <ListItemIcon>
              <DeleteSweep />
            </ListItemIcon>
            <ListItemText 
              primary="Clear Cache" 
              secondary="Remove cached data and refresh app"
            />
            <Button
              size="small"
              color="error"
              onClick={handleClearCache}
            >
              Clear
            </Button>
          </ListItem>
          
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <Info />
            </ListItemIcon>
            <ListItemText 
              primary="App Version" 
              secondary={`Version ${APP_VERSION} - Environment: ${appEnvironment}`}
            />
          </ListItem>
        </List>
      </Paper>


      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Container>
  );
}
