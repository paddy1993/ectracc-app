import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Button,
  useTheme,
  Alert,
  Chip
} from '@mui/material';
import {
  Accessibility,
  Visibility,
  Speed,
  TextFields,
  Keyboard,
  VolumeUp,
  Contrast,
  RestartAlt
} from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';

export default function AccessibilitySettings() {
  const theme = useTheme();
  const {
    settings,
    updateSetting,
    resetSettings,
    isHighContrastMode,
    prefersReducedMotion,
    isKeyboardUser,
    announceToScreenReader
  } = useAccessibility();

  const handleSettingChange = (key: keyof typeof settings) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    updateSetting(key, newValue);
    
    // Announce changes to screen readers
    const settingNames = {
      highContrast: 'High contrast mode',
      reducedMotion: 'Reduced motion',
      largeText: 'Large text',
      keyboardNavigation: 'Keyboard navigation',
      screenReader: 'Screen reader support',
      focusVisible: 'Focus indicators',
      skipLinks: 'Skip links'
    };
    
    announceToScreenReader(
      `${settingNames[key]} ${newValue ? 'enabled' : 'disabled'}`,
      'polite'
    );
  };

  const handleReset = () => {
    resetSettings();
    announceToScreenReader('Accessibility settings reset to defaults', 'polite');
  };

  const systemPreferences = [
    { key: 'isHighContrastMode', label: 'System High Contrast', value: isHighContrastMode },
    { key: 'prefersReducedMotion', label: 'System Reduced Motion', value: prefersReducedMotion },
    { key: 'isKeyboardUser', label: 'Keyboard Navigation Detected', value: isKeyboardUser }
  ];

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Accessibility sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Accessibility Settings
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        These settings help customize ECTRACC for your accessibility needs. 
        Changes are automatically saved and applied across the application.
      </Alert>

      {/* System Preferences Detection */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Visibility sx={{ mr: 1 }} />
            System Preferences Detected
          </Typography>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {systemPreferences.map(({ key, label, value }) => (
              <Chip
                key={key}
                label={label}
                color={value ? 'success' : 'default'}
                variant={value ? 'filled' : 'outlined'}
                size="small"
              />
            ))}
          </Box>
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            ECTRACC automatically detects and respects your system accessibility preferences.
          </Typography>
        </CardContent>
      </Card>

      {/* Visual Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Contrast sx={{ mr: 1 }} />
            Visual Settings
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.highContrast}
                  onChange={handleSettingChange('highContrast')}
                  inputProps={{ 'aria-describedby': 'high-contrast-desc' }}
                />
              }
              label="High Contrast Mode"
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ ml: 4, mb: 2 }}
              id="high-contrast-desc"
            >
              Increases color contrast for better visibility
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.largeText}
                  onChange={handleSettingChange('largeText')}
                  inputProps={{ 'aria-describedby': 'large-text-desc' }}
                />
              }
              label="Large Text"
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ ml: 4, mb: 2 }}
              id="large-text-desc"
            >
              Increases text size throughout the application
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.focusVisible}
                  onChange={handleSettingChange('focusVisible')}
                  inputProps={{ 'aria-describedby': 'focus-desc' }}
                />
              }
              label="Enhanced Focus Indicators"
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ ml: 4 }}
              id="focus-desc"
            >
              Shows clear focus outlines for keyboard navigation
            </Typography>
          </FormGroup>
        </CardContent>
      </Card>

      {/* Motion Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Speed sx={{ mr: 1 }} />
            Motion Settings
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.reducedMotion}
                  onChange={handleSettingChange('reducedMotion')}
                  inputProps={{ 'aria-describedby': 'reduced-motion-desc' }}
                />
              }
              label="Reduced Motion"
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ ml: 4 }}
              id="reduced-motion-desc"
            >
              Reduces animations and transitions for users sensitive to motion
            </Typography>
          </FormGroup>
        </CardContent>
      </Card>

      {/* Navigation Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <Keyboard sx={{ mr: 1 }} />
            Navigation Settings
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.keyboardNavigation}
                  onChange={handleSettingChange('keyboardNavigation')}
                  inputProps={{ 'aria-describedby': 'keyboard-desc' }}
                />
              }
              label="Enhanced Keyboard Navigation"
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ ml: 4, mb: 2 }}
              id="keyboard-desc"
            >
              Optimizes the interface for keyboard-only navigation
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={settings.skipLinks}
                  onChange={handleSettingChange('skipLinks')}
                  inputProps={{ 'aria-describedby': 'skip-links-desc' }}
                />
              }
              label="Skip Links"
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ ml: 4 }}
              id="skip-links-desc"
            >
              Provides shortcuts to jump to main content areas
            </Typography>
          </FormGroup>
        </CardContent>
      </Card>

      {/* Screen Reader Settings */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <VolumeUp sx={{ mr: 1 }} />
            Screen Reader Settings
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.screenReader}
                  onChange={handleSettingChange('screenReader')}
                  inputProps={{ 'aria-describedby': 'screen-reader-desc' }}
                />
              }
              label="Screen Reader Optimizations"
            />
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ ml: 4 }}
              id="screen-reader-desc"
            >
              Enables additional announcements and optimizations for screen readers
            </Typography>
          </FormGroup>
        </CardContent>
      </Card>

      {/* Reset Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <RestartAlt sx={{ mr: 1 }} />
            Reset Settings
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Reset all accessibility settings to their default values.
          </Typography>
          
          <Button
            variant="outlined"
            onClick={handleReset}
            startIcon={<RestartAlt />}
            sx={{
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: '2px'
              }
            }}
          >
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>

      {/* Keyboard Shortcuts Info */}
      <Alert severity="info" sx={{ mt: 3 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          Keyboard Shortcuts:
        </Typography>
        <Typography variant="body2" component="div">
          • <strong>Tab</strong>: Navigate between interactive elements<br />
          • <strong>Enter/Space</strong>: Activate buttons and links<br />
          • <strong>Escape</strong>: Close dialogs and menus<br />
          • <strong>Arrow Keys</strong>: Navigate within components
        </Typography>
      </Alert>
    </Box>
  );
}
