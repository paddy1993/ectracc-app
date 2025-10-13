import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Switch,
  FormControlLabel,
  Collapse,
  IconButton,
  Chip
} from '@mui/material';
import {
  Analytics,
  ExpandMore,
  ExpandLess,
  PrivacyTip as Privacy,
  Speed,
  BugReport
} from '@mui/icons-material';
import { analytics } from '../services/analytics';

interface AnalyticsConsentProps {
  onConsentChange?: (consented: boolean) => void;
}

const AnalyticsConsent: React.FC<AnalyticsConsentProps> = ({ onConsentChange }) => {
  const [showConsent, setShowConsent] = useState(false);
  const [consented, setConsented] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [performanceEnabled, setPerformanceEnabled] = useState(false);
  const [errorTrackingEnabled, setErrorTrackingEnabled] = useState(false);

  useEffect(() => {
    // Check if user has already made a choice
    const consentStatus = localStorage.getItem('analytics_consent');
    const consentTimestamp = localStorage.getItem('analytics_consent_timestamp');
    
    if (consentStatus === null) {
      // Show consent banner for new users
      setShowConsent(true);
    } else {
      const consented = consentStatus === 'true';
      setConsented(consented);
      setAnalyticsEnabled(consented);
      setPerformanceEnabled(consented);
      setErrorTrackingEnabled(consented);
      
      // Check if consent is older than 6 months (re-consent)
      if (consentTimestamp) {
        const sixMonthsAgo = Date.now() - (6 * 30 * 24 * 60 * 60 * 1000);
        if (parseInt(consentTimestamp) < sixMonthsAgo) {
          setShowConsent(true);
        }
      }
    }
  }, []);

  const handleAcceptAll = () => {
    setConsented(true);
    setAnalyticsEnabled(true);
    setPerformanceEnabled(true);
    setErrorTrackingEnabled(true);
    saveConsent(true);
    setShowConsent(false);
  };

  const handleRejectAll = () => {
    setConsented(false);
    setAnalyticsEnabled(false);
    setPerformanceEnabled(false);
    setErrorTrackingEnabled(false);
    saveConsent(false);
    setShowConsent(false);
  };

  const handleSavePreferences = () => {
    const anyEnabled = analyticsEnabled || performanceEnabled || errorTrackingEnabled;
    setConsented(anyEnabled);
    saveConsent(anyEnabled);
    setShowConsent(false);
  };

  const saveConsent = (consented: boolean) => {
    localStorage.setItem('analytics_consent', consented.toString());
    localStorage.setItem('analytics_consent_timestamp', Date.now().toString());
    localStorage.setItem('analytics_preferences', JSON.stringify({
      analytics: analyticsEnabled,
      performance: performanceEnabled,
      errorTracking: errorTrackingEnabled
    }));
    
    analytics.setTrackingConsent(consented);
    onConsentChange?.(consented);

    // Track consent decision (if analytics enabled)
    if (consented && analyticsEnabled) {
      analytics.track('consent_given', {
        event_category: 'privacy',
        event_label: 'analytics_consent',
        custom_parameters: {
          analytics_enabled: analyticsEnabled,
          performance_enabled: performanceEnabled,
          error_tracking_enabled: errorTrackingEnabled
        }
      });
    }
  };

  const resetConsent = () => {
    localStorage.removeItem('analytics_consent');
    localStorage.removeItem('analytics_consent_timestamp');
    localStorage.removeItem('analytics_preferences');
    setShowConsent(true);
    setConsented(false);
    setAnalyticsEnabled(false);
    setPerformanceEnabled(false);
    setErrorTrackingEnabled(false);
  };

  if (!showConsent && !consented) {
    return null;
  }

  return (
    <>
      {/* Consent Banner */}
      <Collapse in={showConsent}>
        <Box
          sx={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            p: 2,
            backgroundColor: 'background.paper',
            borderTop: 1,
            borderColor: 'divider',
            boxShadow: 3
          }}
        >
          <Card elevation={0}>
            <CardContent sx={{ pb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <Privacy color="primary" sx={{ mt: 0.5 }} />
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    🍪 We Value Your Privacy
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    ECTRACC uses analytics to improve your experience and help us build better sustainability features. 
                    We never sell your data or track you across other websites.
                  </Typography>

                  <Collapse in={showDetails}>
                    <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Choose what you're comfortable with:
                      </Typography>
                      
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={analyticsEnabled}
                              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">
                                <Analytics sx={{ fontSize: 16, mr: 1 }} />
                                Usage Analytics
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Help us understand which features you use most
                              </Typography>
                            </Box>
                          }
                        />
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={performanceEnabled}
                              onChange={(e) => setPerformanceEnabled(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">
                                <Speed sx={{ fontSize: 16, mr: 1 }} />
                                Performance Monitoring
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Help us make the app faster and more reliable
                              </Typography>
                            </Box>
                          }
                        />
                        
                        <FormControlLabel
                          control={
                            <Switch
                              checked={errorTrackingEnabled}
                              onChange={(e) => setErrorTrackingEnabled(e.target.checked)}
                              color="primary"
                            />
                          }
                          label={
                            <Box>
                              <Typography variant="body2">
                                <BugReport sx={{ fontSize: 16, mr: 1 }} />
                                Error Reporting
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                Help us fix bugs and improve stability
                              </Typography>
                            </Box>
                          }
                        />
                      </Box>

                      <Box sx={{ mt: 2 }}>
                        <Chip
                          label="✅ No personal data collection"
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                        <Chip
                          label="✅ No cross-site tracking"
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                        <Chip
                          label="✅ Data stays anonymous"
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      </Box>
                    </Box>
                  </Collapse>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleAcceptAll}
                      size="small"
                    >
                      Accept All
                    </Button>
                    
                    <Button
                      variant="outlined"
                      onClick={handleRejectAll}
                      size="small"
                    >
                      Reject All
                    </Button>
                    
                    {showDetails && (
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleSavePreferences}
                        size="small"
                      >
                        Save Preferences
                      </Button>
                    )}
                    
                    <IconButton
                      onClick={() => setShowDetails(!showDetails)}
                      size="small"
                      sx={{ ml: 'auto' }}
                    >
                      {showDetails ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Collapse>

      {/* Privacy Settings (for settings page) */}
      {consented && !showConsent && (
        <Card sx={{ mt: 2 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Privacy color="primary" />
              <Typography variant="h6">Privacy & Analytics</Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              You've consented to help us improve ECTRACC. You can change these settings anytime.
            </Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2">
                Analytics Status: {analytics.isTrackingActive() ? 
                  <Chip label="Active" color="success" size="small" /> : 
                  <Chip label="Disabled" color="default" size="small" />
                }
              </Typography>
              
              <Button
                variant="outlined"
                size="small"
                onClick={resetConsent}
              >
                Change Settings
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AnalyticsConsent;
