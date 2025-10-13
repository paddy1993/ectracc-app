import React, { useEffect } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Snackbar, Alert } from '@mui/material';
import { AppProvider, useApp } from './contexts/AppContext';
import { AuthProvider } from './contexts/AuthContext';
import { AccessibilityProvider, useAccessibility } from './contexts/AccessibilityContext';
import { getTheme } from './utils/theme';
import ErrorBoundary from './components/ErrorBoundary';
import AppRoutes from './components/AppRoutes';
import MobileEnhancements from './components/MobileEnhancements';
import SkipLinks from './components/accessibility/SkipLinks';
import PWAStatus from './components/pwa/PWAStatus';
import notificationService from './services/notificationService';
import offlineStorage from './services/offlineStorage';
import analytics, { EVENTS } from './services/analytics';
import performanceMonitor from './services/performanceMonitor';
import optimisticUI from './services/optimisticUI';
import pwaInstaller from './services/pwaInstaller';
import { register as registerSW } from './services/serviceWorkerRegistration';
import './styles/mobile.css';
import './styles/accessibility.css';

// Main app component with theme and accessibility
function ThemedApp() {
  const { theme, error, setError } = useApp();
  const { settings, isHighContrastMode } = useAccessibility();
  const muiTheme = getTheme(theme, settings.highContrast || isHighContrastMode);

  // Initialize services on app start
  useEffect(() => {
    const initializeServices = async () => {
      // Mark app initialization start
      performanceMonitor.markMilestone('app-init-start');

      // Track app opened
      analytics.track(EVENTS.APP_OPENED, {
        timestamp: new Date().toISOString(),
        theme: theme,
        is_pwa: pwaInstaller.getState().isStandalone,
        platform: pwaInstaller.getState().platform
      });

      // Register service worker
      registerSW({
        onSuccess: () => {
          console.log('[PWA] Service worker registered successfully');
          performanceMonitor.recordMetric('sw-registration', performance.now());
        },
        onUpdate: () => {
          console.log('[PWA] New content available');
        },
        onOfflineReady: () => {
          console.log('[PWA] App ready for offline use');
        }
      });

      // Initialize performance monitoring
      performanceMonitor.markMilestone('performance-init');

      // Initialize optimistic UI
      optimisticUI.registerBackgroundSync();

      // Initialize notifications
      const notificationsSupported = await notificationService.initialize();
      if (notificationsSupported) {
        console.log('[Services] Notification service initialized');
        performanceMonitor.recordMetric('notifications-init', performance.now());
      }

      // Initialize offline storage
      const offlineSupported = await offlineStorage.initialize();
      if (offlineSupported) {
        console.log('[Services] Offline storage initialized');
        performanceMonitor.recordMetric('offline-storage-init', performance.now());
      }

      // Request persistent storage for PWA
      if (pwaInstaller.getState().isStandalone) {
        const persistent = await pwaInstaller.getStorageEstimate();
        if (persistent) {
          console.log('[PWA] Storage estimate:', persistent);
        }
      }

      // Mark app initialization complete
      performanceMonitor.markMilestone('app-init-end');
      const initTime = performanceMonitor.measureBetween('app-init-start', 'app-init-end', 'app-initialization');
      
      console.log(`[Performance] App initialized in ${initTime.toFixed(2)}ms`);
    };

    initializeServices();
  }, [theme]);

  const handleInstallPrompt = () => {
    // Show success message after install
    console.log('App installed successfully!');
  };

  const handleCloseError = () => {
    setError(null);
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <CssBaseline />
      <Router>
        <AuthProvider>
          <ErrorBoundary>
            {/* Skip Links for Keyboard Navigation */}
            <SkipLinks />
            
            <AppRoutes />
            
            {/* Mobile Enhancements - PWA, offline alerts, quick actions */}
            <MobileEnhancements onInstallPrompt={handleInstallPrompt} />

            {/* PWA Status - Install prompts, update notifications, offline sync */}
            <PWAStatus />

            {/* Error Snackbar */}
            <Snackbar
              open={!!error}
              autoHideDuration={6000}
              onClose={handleCloseError}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
              <Alert onClose={handleCloseError} severity="error" variant="filled">
                {error}
              </Alert>
            </Snackbar>
          </ErrorBoundary>
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}

// Root App component
function App() {
  return (
    <AppProvider>
      <AccessibilityProvider>
        <ThemedApp />
      </AccessibilityProvider>
    </AppProvider>
  );
}

export default App;