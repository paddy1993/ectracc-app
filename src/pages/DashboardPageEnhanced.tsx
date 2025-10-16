import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Typography,
  Box,
  Button,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  EmojiNature as Eco,
  TrendingUp,
  Flag as GoalIcon,
  Assessment,
  Add as AddIcon,
  QrCodeScanner,
  History as HistoryIcon
} from '@mui/icons-material';

// Import the enhanced components
import EnhancedKPICard from '../components/ui/EnhancedKPICard';
import OnboardingFlow from '../components/onboarding/OnboardingFlow';
import EmptyState from '../components/ui/EmptyState';
import SkeletonLoader from '../components/SkeletonLoader';

// Import existing services
import userFootprintApi, { UserFootprintSummary } from '../services/userFootprintApi';
import analytics, { EVENTS } from '../services/analytics';

type TimeFilter = 'day' | 'week' | 'month' | 'ytd' | 'year';

export default function DashboardPageEnhanced() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  // State management
  const [summary, setSummary] = useState<UserFootprintSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Track page view
  useEffect(() => {
    analytics.trackPageView('Enhanced Dashboard');
  }, []);

  // Check if user needs onboarding
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding && user && !profile) {
      setShowOnboarding(true);
    }
  }, [user, profile]);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const summaryResult = await userFootprintApi.getSummary(timeFilter);
        setSummary(summaryResult);
      } catch (error: any) {
        console.error('Failed to load dashboard data:', error);
        setError('Unable to load your dashboard data. Please try again.');
        
        // Set fallback data
        setSummary({
          totalFootprint: 0,
          totalEntries: 0,
          avgFootprint: 0,
          maxFootprint: 0,
          minFootprint: 0,
          timeframe: timeFilter
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [timeFilter]);

  // Get display values based on time filter
  const getDisplayValues = () => {
    if (!summary) return { current: 0, label: 'No Data' };
    
    return { 
      current: summary.totalFootprint || 0, 
      label: summary.timeframe === 'day' ? 'Today' :
             summary.timeframe === 'week' ? 'This Week' :
             summary.timeframe === 'month' ? 'This Month' :
             summary.timeframe === 'ytd' ? 'Year to Date' :
             summary.timeframe === 'year' ? 'This Year' :
             'All Time'
    };
  };

  // Quick actions configuration
  const quickActions = [
    {
      label: 'Scan Barcode',
      icon: QrCodeScanner,
      color: 'primary' as const,
      path: '/products/search?scan=true',
      isPrimary: true
    },
    {
      label: 'Manual Entry',
      icon: AddIcon,
      color: 'secondary' as const,
      path: '/tracker',
      isPrimary: false
    },
    {
      label: 'View History',
      icon: HistoryIcon,
      color: 'success' as const,
      path: '/history',
      isPrimary: false
    }
  ];

  if (loading) {
    return <SkeletonLoader variant="dashboard" />;
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 1, mb: 2 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  const hasData = summary !== null;
  const hasEntries = summary && summary.totalEntries > 0;

  return (
    <>
      <Container maxWidth="xl" sx={{ mt: 1, mb: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Enhanced Carbon Footprint Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Track your carbon footprint with our enhanced interface and modern design
          </Typography>
          
          {/* Time Filter Controls */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <ToggleButtonGroup
              value={timeFilter}
              exclusive
              onChange={(_, newFilter) => {
                if (newFilter) {
                  analytics.track(EVENTS.TIME_FILTER_CHANGED, {
                    previous_filter: timeFilter,
                    new_filter: newFilter
                  });
                  setTimeFilter(newFilter);
                }
              }}
              aria-label="time filter"
              size="small"
            >
              <ToggleButton value="day" aria-label="day">Day</ToggleButton>
              <ToggleButton value="week" aria-label="week">Week</ToggleButton>
              <ToggleButton value="month" aria-label="month">Month</ToggleButton>
              <ToggleButton value="ytd" aria-label="year to date">YTD</ToggleButton>
              <ToggleButton value="year" aria-label="year">Year</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        </Box>

        {/* Empty State for New Users */}
        {!hasEntries && (
          <EmptyState
            variant="dashboard"
            title="Welcome to Your Enhanced Carbon Footprint Journey!"
            description="Experience our new and improved interface. Start by scanning a barcode or adding your first product manually."
            actionLabel="Scan Barcode"
            onAction={() => navigate('/products/search?scan=true')}
            secondaryActionLabel="Manual Entry"
            onSecondaryAction={() => navigate('/tracker')}
          />
        )}

        {/* Enhanced Dashboard Content */}
        {hasEntries && (
          <>
            {/* Enhanced KPI Cards Grid */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Your Impact Overview
              </Typography>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <EnhancedKPICard
                    icon={<Eco />}
                    label={getDisplayValues().label}
                    value={getDisplayValues().current}
                    unit="kg CO₂e"
                    trend="down"
                    trendPercentage={-8.5}
                    tone="success"
                    size="medium"
                    animate={true}
                    description="Your total carbon footprint for the selected period"
                  />
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <EnhancedKPICard
                    icon={<TrendingUp />}
                    label="Average per Entry"
                    value={summary?.avgFootprint || 0}
                    unit="kg CO₂e"
                    tone="default"
                    size="medium"
                    animate={true}
                    description="Average carbon footprint per product entry"
                  />
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <EnhancedKPICard
                    icon={<GoalIcon />}
                    label="Weekly Goal"
                    value="Set Goal"
                    progress={65}
                    target={50}
                    tone="warning"
                    size="medium"
                    onClick={() => navigate('/history')}
                    description="Set and track your sustainability goals"
                  />
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <EnhancedKPICard
                    icon={<Assessment />}
                    label="Total Entries"
                    value={summary?.totalEntries || 0}
                    previousValue={Math.max(0, (summary?.totalEntries || 0) - 3)}
                    trend="up"
                    trendPercentage={12.3}
                    tone="info"
                    size="medium"
                    onClick={() => navigate('/history')}
                    description="Total number of products you've tracked"
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Quick Actions Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action) => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={action.label}>
                    <Button
                      variant={action.isPrimary ? "contained" : "outlined"}
                      color={action.color}
                      startIcon={<action.icon />}
                      onClick={() => {
                        analytics.track(EVENTS.QUICK_ACTION_CLICKED, {
                          action_name: action.label,
                          action_path: action.path
                        });
                        navigate(action.path);
                      }}
                      fullWidth
                      size={action.isPrimary ? "large" : "medium"}
                      sx={{ 
                        py: action.isPrimary ? 1.5 : 1.2,
                        fontWeight: action.isPrimary ? 600 : 400,
                        fontSize: action.isPrimary ? '1.1rem' : '0.875rem'
                      }}
                    >
                      {action.label}
                    </Button>
                  </Grid>
                ))}
              </Grid>
            </Box>

            {/* Comparison with Original */}
            <Box sx={{ mb: 4, p: 3, bgcolor: 'background.paper', borderRadius: 2, border: 1, borderColor: 'divider' }}>
              <Typography variant="h6" gutterBottom>
                ✨ Enhanced Features Demo
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                This enhanced dashboard showcases the new UI improvements:
              </Typography>
              <Box component="ul" sx={{ pl: 2, m: 0 }}>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  🎯 <strong>Animated KPI Cards</strong> - Numbers count up, progress rings, trend indicators
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  🎨 <strong>Enhanced Colors</strong> - Semantic color system with better contrast
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  📱 <strong>Mobile Optimized</strong> - Better touch targets and responsive design
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 0.5 }}>
                  ♿ <strong>Accessibility</strong> - WCAG compliant with screen reader support
                </Typography>
                <Typography component="li" variant="body2">
                  🚀 <strong>Performance</strong> - Optimized animations and loading states
                </Typography>
              </Box>
              
              <Button
                variant="outlined"
                onClick={() => navigate('/dashboard')}
                sx={{ mt: 2 }}
              >
                Compare with Original Dashboard
              </Button>
            </Box>
          </>
        )}
      </Container>

      {/* Enhanced Onboarding Flow */}
      <OnboardingFlow
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
        onComplete={() => {
          localStorage.setItem('onboarding_completed', 'true');
          setShowOnboarding(false);
          // Show success message or navigate to a specific page
        }}
        showProgress={true}
        allowSkip={true}
      />
    </>
  );
}
