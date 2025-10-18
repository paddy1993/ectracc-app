import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  EmojiNature as Eco,
  TrendingUp,
  Assessment,
  Flag as GoalIcon,
  Lightbulb,
  Speed,
  Accessibility,
  Smartphone
} from '@mui/icons-material';

// Import enhanced components
import EnhancedKPICard from '../components/ui/EnhancedKPICard';
import EnhancedBottomTabs from '../components/layout/EnhancedBottomTabs';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import logger from '../utils/logger';

export default function EnhancedUIDemo() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [enableAnimations, setEnableAnimations] = useState(true);
  const [enableHaptics, setEnableHaptics] = useState(true);
  const [showBottomNav, setShowBottomNav] = useState(false);

  const demoKPIData = [
    {
      icon: <Eco />,
      label: 'Carbon Saved',
      value: 142.5,
      unit: 'kg CO₂e',
      trend: 'down' as const,
      trendPercentage: -15.2,
      progress: 85,
      target: 200,
      tone: 'success' as const,
      description: 'Total carbon footprint reduction this month'
    },
    {
      icon: <TrendingUp />,
      label: 'Improvement',
      value: 23.8,
      unit: '%',
      trend: 'up' as const,
      trendPercentage: 8.4,
      tone: 'info' as const,
      description: 'Your sustainability improvement rate'
    },
    {
      icon: <Assessment />,
      label: 'Products Tracked',
      value: 47,
      previousValue: 42,
      trend: 'up' as const,
      trendPercentage: 11.9,
      tone: 'default' as const,
      description: 'Number of products in your footprint tracking'
    },
    {
      icon: <GoalIcon />,
      label: 'Monthly Goal',
      value: 'On Track',
      progress: 72,
      target: 100,
      tone: 'warning' as const,
      description: 'Progress towards your monthly sustainability goal'
    }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 2, mb: 10 }}>
      {/* Header */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 2 }}>
          🎨 Enhanced UI Components Demo
        </Typography>
        <Typography variant="h6" color="text.secondary" paragraph>
          Experience the new ECTRACC interface with modern design, animations, and cross-platform optimizations
        </Typography>
        
        {/* Feature highlights */}
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', flexWrap: 'wrap', mb: 3 }}>
          <Chip icon={<Lightbulb />} label="Animated KPIs" color="primary" />
          <Chip icon={<Speed />} label="Performance Optimized" color="secondary" />
          <Chip icon={<Accessibility />} label="WCAG Compliant" color="success" />
          <Chip icon={<Smartphone />} label="Mobile First" color="info" />
        </Box>
      </Box>

      {/* Demo Controls */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Demo Controls
          </Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enableAnimations}
                    onChange={(e) => setEnableAnimations(e.target.checked)}
                  />
                }
                label="Enable Animations"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={enableHaptics}
                    onChange={(e) => setEnableHaptics(e.target.checked)}
                  />
                }
                label="Enable Haptics"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setShowOnboarding(true)}
                fullWidth
              >
                Show Onboarding
              </Button>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Button
                variant="outlined"
                onClick={() => setShowBottomNav(!showBottomNav)}
                fullWidth
              >
                {showBottomNav ? 'Hide' : 'Show'} Bottom Nav
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Enhanced KPI Cards Demo */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          Enhanced KPI Cards
        </Typography>
        <Grid container spacing={3}>
          {demoKPIData.map((kpi, index) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={index}>
              <EnhancedKPICard
                {...kpi}
                animate={enableAnimations}
                onClick={() => {
                  if (enableHaptics && 'vibrate' in navigator) {
                    navigator.vibrate(10);
                  }
                  logger.log(`Clicked ${kpi.label}`);
                }}
              />
            </Grid>
          ))}
        </Grid>
      </Box>

      <Divider sx={{ my: 4 }} />

      {/* Features Overview */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
          New Features & Improvements
        </Typography>
        
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary">
                  🎯 Enhanced KPI Cards
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Animated number counting with smooth transitions
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Progress rings for goal tracking
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Trend indicators with semantic colors
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Hover descriptions and tooltips
                  </Typography>
                  <Typography component="li" variant="body2">
                    Mobile-optimized touch targets
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="secondary">
                  📱 Mobile Enhancements
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Haptic feedback on interactions
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Swipe gestures between tabs
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Auto-hide navigation on scroll
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Floating action button for primary actions
                  </Typography>
                  <Typography component="li" variant="body2">
                    Safe area support for notched devices
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="success.main">
                  ♿ Accessibility Features
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    WCAG AAA compliant color contrasts
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Screen reader optimized content
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Keyboard navigation support
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Reduced motion preferences
                  </Typography>
                  <Typography component="li" variant="body2">
                    High contrast mode support
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, md: 6 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom color="info.main">
                  🚀 Performance Optimizations
                </Typography>
                <Box component="ul" sx={{ pl: 2, m: 0 }}>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Lazy loading of heavy components
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Optimized animation performance
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Efficient state management
                  </Typography>
                  <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                    Memory usage optimization
                  </Typography>
                  <Typography component="li" variant="body2">
                    Bundle size reduction
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>

      {/* Implementation Status */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Implementation Status
        </Typography>
        <Typography variant="body2" paragraph>
          This demo showcases the enhanced UI components that are ready for integration into your ECTRACC application.
          All components are production-ready and include comprehensive TypeScript support.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="✅ Enhanced KPI Cards" size="small" color="success" />
          <Chip label="✅ Color System" size="small" color="success" />
          <Chip label="✅ Onboarding Flow" size="small" color="success" />
          <Chip label="✅ Bottom Navigation" size="small" color="success" />
          <Chip label="🔄 Integration Guide" size="small" color="warning" />
        </Box>
      </Alert>

      {/* Enhanced Onboarding Flow */}
      <OnboardingFlow
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          setShowOnboarding(false);
          alert('Onboarding completed! 🎉');
        }}
        showProgress={true}
        allowSkip={true}
      />

      {/* Enhanced Bottom Navigation (conditionally rendered) */}
      {showBottomNav && (
        <EnhancedBottomTabs
          enableHaptics={enableHaptics}
          enableGestures={true}
          showLabels={true}
          onTabChange={(index, path) => {
            logger.log(`Tab changed to: ${path} (index: ${index})`);
          }}
        />
      )}
    </Container>
  );
}
