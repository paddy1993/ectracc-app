import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Avatar,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Switch,
  Divider,
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Person,
  Edit,
  Logout,
  EmojiNature as Eco,
  Email,
  CalendarToday,
  Palette,
  Wifi,
  Storage,
  Info,
  Sync,
  DeleteSweep
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
// Simple form type for profile editing (updated for schema fix)
interface ProfileEditForm {
  display_name: string;
}
import { useApp } from '../contexts/AppContext';
import { APP_VERSION } from '../constants';
import OfflineSyncManager, { getAppEnvironment, isStandalone } from '../utils/offlineSync';
import logger from '../utils/logger';

const sustainabilityGoals = [
  'Learn about the carbon footprint of products I buy',
  'Track 50+ products to understand my consumption patterns',
  'Discover which product categories have the highest impact',
  'Compare carbon footprints across different brands',
  'Build awareness of my daily consumption choices',
  'Understand the environmental impact of my purchases'
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, profile, signOut, updateProfile, loading } = useAuth();
  const { theme, isOnline, toggleTheme } = useApp();
  
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editData, setEditData] = useState<ProfileEditForm>({
    display_name: profile?.full_name || ''
  });
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Settings state
  const [pendingQueueCount, setPendingQueueCount] = useState(0);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [offlineSync] = useState(() => OfflineSyncManager.getInstance());

  const appEnvironment = getAppEnvironment();

  const handleEditInputChange = (field: keyof ProfileEditForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setEditData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError(null);
  };

  // Simplified profile editing - removed sustainability_goal for now

  const handleEditSubmit = async () => {
    if (!editData.display_name.trim()) {
      setError('Name is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      logger.log('🔄 [PROFILE PAGE] Submitting profile update:', {
        display_name: editData.display_name.trim()
      });
      
      const { error: updateError } = await updateProfile({
        full_name: editData.display_name.trim()
      });

      if (updateError) {
        console.error('❌ [PROFILE PAGE] Profile update failed:', updateError);
        
        // Show specific error messages based on error type
        if (updateError.includes('Permission denied')) {
          setError('Permission denied. Database security policies may need to be configured. Please contact support.');
        } else if (updateError.includes('Connection failed') || updateError.includes('Failed to fetch')) {
          setError('Connection failed. Please check your internet connection and try again.');
        } else if (updateError.includes('validation') || updateError.includes('invalid')) {
          setError('Invalid data. Please check your entries and try again.');
        } else if (updateError.includes('auth') || updateError.includes('401') || updateError.includes('403')) {
          setError('Authentication error. Please sign out and sign in again.');
        } else {
          setError(updateError);
        }
        return;
      }

      logger.log('✅ [PROFILE PAGE] Profile updated successfully');
      setEditDialogOpen(false);
    } catch (error: any) {
      console.error('❌ [PROFILE PAGE] Exception during profile update:', error);
      setError(error.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      console.error('Sign out error:', error);
    } else {
      navigate('/login');
    }
  };

  const openEditDialog = () => {
    setEditData({
      display_name: profile?.full_name || ''
    });
    setError(null);
    setEditDialogOpen(true);
  };

  // Settings useEffect
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

  // Settings functions
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

  if (!user) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please sign in to view your profile.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        My Profile
      </Typography>

      {/* Profile Card */}
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            src={profile?.avatar_url}
            sx={{ width: 80, height: 80, mr: 3 }}
          >
            <Person sx={{ fontSize: 40 }} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" gutterBottom>
              {profile?.full_name || 'No name set'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Email sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <CalendarToday sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2" color="text.secondary">
                Joined {new Date(user.created_at).toLocaleDateString()}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={openEditDialog}
              disabled={loading}
            >
              Edit
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<Logout />}
              onClick={handleSignOut}
              disabled={loading}
            >
              Sign Out
            </Button>
          </Box>
        </Box>

        {/* Sustainability goal removed until table schema is updated */}
      </Paper>

      {/* Settings Section */}
      <Box sx={{ mt: 6 }}>
        <Typography variant="h4" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
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
      </Box>

      {/* Edit Profile Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Display Name"
            value={editData.display_name}
            onChange={handleEditInputChange('display_name')}
            margin="normal"
            required
          />

          {/* Learning goal removed until table schema is updated */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            disabled={isSubmitting}
          >
            {isSubmitting ? <CircularProgress size={20} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

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
