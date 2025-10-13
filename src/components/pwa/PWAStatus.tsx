import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  IconButton,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  GetApp,
  Update,
  Close,
  CheckCircle,
  Warning,
  Info,
  Share,
  Storage,
  Wifi,
  WifiOff
} from '@mui/icons-material';
import pwaInstaller from '../../services/pwaInstaller';
import optimisticUI from '../../services/optimisticUI';

export default function PWAStatus() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [pwaState, setPwaState] = useState(pwaInstaller.getState());
  const [optimisticState, setOptimisticState] = useState(optimisticUI.getState());
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [installInstructionsOpen, setInstallInstructionsOpen] = useState(false);
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  useEffect(() => {
    // Subscribe to PWA state changes
    const unsubscribePWA = pwaInstaller.subscribe(setPwaState);
    const unsubscribeOptimistic = optimisticUI.subscribe(setOptimisticState);

    // Listen for PWA events
    const handleUpdateAvailable = () => setUpdateAvailable(true);
    const handleManualInstall = (event: CustomEvent) => {
      setInstallInstructionsOpen(true);
    };

    window.addEventListener('pwa-update-available', handleUpdateAvailable);
    window.addEventListener('pwa-manual-install', handleManualInstall as EventListener);

    // Check if we should show install prompt
    if (pwaState.canInstall && pwaInstaller.shouldRecommendInstall()) {
      setTimeout(() => setShowInstallPrompt(true), 2000);
    }

    // Get storage information
    pwaInstaller.getStorageEstimate().then(setStorageInfo);

    return () => {
      unsubscribePWA();
      unsubscribeOptimistic();
      window.removeEventListener('pwa-update-available', handleUpdateAvailable);
      window.removeEventListener('pwa-manual-install', handleManualInstall as EventListener);
    };
  }, [pwaState.canInstall]);

  const handleInstall = async () => {
    const success = await pwaInstaller.triggerInstall();
    if (success) {
      setShowInstallPrompt(false);
    }
  };

  const handleUpdate = () => {
    pwaInstaller.applyUpdate();
    setUpdateAvailable(false);
  };

  const handleRetrySync = () => {
    optimisticUI.retryFailedActions();
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getInstallInstructions = () => {
    switch (pwaState.platform) {
      case 'ios':
        return [
          'Tap the Share button at the bottom of the screen',
          'Scroll down and tap "Add to Home Screen"',
          'Tap "Add" to install ECTRACC on your home screen'
        ];
      case 'android':
        return [
          'Tap the menu button (⋮) in your browser',
          'Select "Add to Home screen" or "Install app"',
          'Tap "Add" to install ECTRACC'
        ];
      default:
        return [
          'Click the install icon in your browser\'s address bar',
          'Or go to browser menu and select "Install ECTRACC"',
          'Follow the prompts to complete installation'
        ];
    }
  };

  return (
    <>
      {/* Install Prompt Snackbar */}
      <Snackbar
        open={showInstallPrompt && !pwaState.isInstalled}
        autoHideDuration={10000}
        onClose={() => setShowInstallPrompt(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleInstall}
                startIcon={<GetApp />}
              >
                Install
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setShowInstallPrompt(false)}
              >
                <Close />
              </IconButton>
            </Box>
          }
        >
          Install ECTRACC for a better experience!
        </Alert>
      </Snackbar>

      {/* Update Available Snackbar */}
      <Snackbar
        open={updateAvailable}
        onClose={() => setUpdateAvailable(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          severity="info"
          action={
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                color="inherit"
                size="small"
                onClick={handleUpdate}
                startIcon={<Update />}
              >
                Update
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setUpdateAvailable(false)}
              >
                <Close />
              </IconButton>
            </Box>
          }
        >
          A new version of ECTRACC is available!
        </Alert>
      </Snackbar>

      {/* Offline Actions Snackbar */}
      {optimisticState.actions.length > 0 && (
        <Snackbar
          open={true}
          anchorOrigin={{ vertical: 'bottom', horizontal: isMobile ? 'center' : 'left' }}
        >
          <Alert
            severity={optimisticState.isOnline ? 'info' : 'warning'}
            icon={optimisticState.isOnline ? <Wifi /> : <WifiOff />}
            action={
              optimisticUI.getFailedActions().length > 0 ? (
                <Button
                  color="inherit"
                  size="small"
                  onClick={handleRetrySync}
                >
                  Retry
                </Button>
              ) : null
            }
          >
            {optimisticState.isOnline
              ? `Syncing ${optimisticState.actions.length} actions...`
              : `${optimisticState.actions.length} actions will sync when online`
            }
          </Alert>
        </Snackbar>
      )}

      {/* PWA Status Card (for settings/debug) */}
      {process.env.NODE_ENV === 'development' && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              PWA Status
            </Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
              <Chip
                label={pwaState.isInstalled ? 'Installed' : 'Not Installed'}
                color={pwaState.isInstalled ? 'success' : 'default'}
                icon={pwaState.isInstalled ? <CheckCircle /> : <Warning />}
              />
              
              <Chip
                label={pwaState.isStandalone ? 'Standalone' : 'Browser'}
                color={pwaState.isStandalone ? 'primary' : 'default'}
              />
              
              <Chip
                label={optimisticState.isOnline ? 'Online' : 'Offline'}
                color={optimisticState.isOnline ? 'success' : 'error'}
                icon={optimisticState.isOnline ? <Wifi /> : <WifiOff />}
              />
              
              <Chip
                label={`Platform: ${pwaState.platform}`}
                variant="outlined"
              />
            </Box>

            {storageInfo && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Storage Usage: {formatBytes(storageInfo.usage || 0)} / {formatBytes(storageInfo.quota || 0)}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={storageInfo.usagePercentage || 0}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            )}

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {pwaState.canInstall && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<GetApp />}
                  onClick={handleInstall}
                >
                  Install App
                </Button>
              )}
              
              <Button
                variant="outlined"
                size="small"
                startIcon={<Update />}
                onClick={() => pwaInstaller.checkForUpdates()}
              >
                Check Updates
              </Button>
              
              {optimisticUI.getFailedActions().length > 0 && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  onClick={handleRetrySync}
                >
                  Retry Failed ({optimisticUI.getFailedActions().length})
                </Button>
              )}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Manual Install Instructions Dialog */}
      <Dialog
        open={installInstructionsOpen}
        onClose={() => setInstallInstructionsOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Install ECTRACC
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            To install ECTRACC on your {pwaState.platform} device:
          </Typography>
          
          <List>
            {getInstallInstructions().map((instruction, index) => (
              <ListItem key={index}>
                <ListItemIcon>
                  <Typography variant="h6" color="primary">
                    {index + 1}
                  </Typography>
                </ListItemIcon>
                <ListItemText primary={instruction} />
              </ListItem>
            ))}
          </List>
          
          <Alert severity="info" sx={{ mt: 2 }}>
            Installing ECTRACC gives you faster access, offline functionality, and a native app experience!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInstallInstructionsOpen(false)}>
            Got it
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
