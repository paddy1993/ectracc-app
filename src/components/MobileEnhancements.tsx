import React, { useEffect, useState } from 'react';
import { 
  Fab, 
  Snackbar, 
  Alert, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button,
  Box,
  Typography,
  IconButton
} from '@mui/material';
import { 
  Add as AddIcon, 
  GetApp as InstallIcon,
  Close as CloseIcon,
  Vibration as VibrateIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logger from '../utils/logger';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface MobileEnhancementsProps {
  onInstallPrompt?: () => void;
}

const MobileEnhancements: React.FC<MobileEnhancementsProps> = ({ onInstallPrompt }) => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    // Check if app is in standalone mode
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
                             (window.navigator as any).standalone ||
                             document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show install prompt after a delay if not in standalone mode
      setTimeout(() => {
        if (!isStandalone) {
          setShowInstallPrompt(true);
        }
      }, 30000); // Show after 30 seconds
    };

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
      // Notify service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'ONLINE' });
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
    };

    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isStandalone]);

  // Handle install app
  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        logger.log('User accepted the install prompt');
        onInstallPrompt?.();
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  // Handle quick action FAB
  const handleQuickAction = () => {
    // Haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(50);
    }
    
    // Navigate to scanner for quick product scan
    navigate('/scanner');
  };

  // Request notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        logger.log('Notification permission granted');
      }
    }
  };

  useEffect(() => {
    // Request notification permission after a delay
    setTimeout(requestNotificationPermission, 5000);
  }, []);

  return (
    <>
      {/* Quick Action FAB - Only show in standalone mode or mobile, and after profile setup */}
      {(isStandalone || window.innerWidth <= 768) && profile && (
        <Fab
          color="primary"
          aria-label="Quick scan"
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
          onClick={handleQuickAction}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Install App Prompt */}
      <Dialog
        open={showInstallPrompt && !isStandalone}
        onClose={() => setShowInstallPrompt(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">Install ECTRACC</Typography>
            <IconButton onClick={() => setShowInstallPrompt(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" py={2}>
            <InstallIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
            <Typography variant="body1" paragraph>
              Install ECTRACC on your device for a better experience:
            </Typography>
            <Box component="ul" textAlign="left" sx={{ pl: 2 }}>
              <li>Quick access from your home screen</li>
              <li>Faster loading and better performance</li>
              <li>Works offline for core features</li>
              <li>Push notifications for goals and reminders</li>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowInstallPrompt(false)}>
            Maybe Later
          </Button>
          <Button 
            onClick={handleInstallApp} 
            variant="contained"
            startIcon={<InstallIcon />}
          >
            Install App
          </Button>
        </DialogActions>
      </Dialog>

      {/* Offline Alert */}
      <Snackbar
        open={showOfflineAlert}
        autoHideDuration={6000}
        onClose={() => setShowOfflineAlert(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowOfflineAlert(false)} 
          severity="warning"
          sx={{ width: '100%' }}
        >
          You're offline. Some features may be limited, but you can still track your carbon footprint!
        </Alert>
      </Snackbar>

    </>
  );
};

export default MobileEnhancements;
