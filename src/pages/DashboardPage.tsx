import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  LinearProgress,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add as AddIcon,
  Search,
  TrendingUp,
  EmojiNature as Eco,
  Flag as GoalIcon,
  History as HistoryIcon,
  QrCodeScanner,
  Assessment
} from '@mui/icons-material';
import StatCard from '../components/ui/StatCard';
import KPIGroup from '../components/ui/KPIGroup';
import BadgePill from '../components/ui/BadgePill';
import EmptyState from '../components/ui/EmptyState';
import { DashboardStats } from '../types';
import userFootprintApi, { UserFootprintEntry, UserFootprintSummary, UserFootprintHistory } from '../services/userFootprintApi';
import carbonApi from '../services/carbonApi';
import analytics, { EVENTS } from '../services/analytics';
import SkeletonLoader from '../components/SkeletonLoader';
import logger from '../utils/logger';
// ProfileSetupModal removed - users go directly to dashboard
import { 
  useOptimizedApiCall, 
  usePrefetch, 
  useIntersectionObserver,
  performanceCache 
} from '../hooks/usePerformanceOptimization';

// Lazy load the chart component for better initial load performance
const LazyLineChart = lazy(() => 
  import('recharts').then(module => ({
    default: ({ data, height = 220, ...props }: any) => (
      <module.ResponsiveContainer width="100%" height="100%">
        <module.LineChart data={data} {...props}>
          <module.CartesianGrid strokeDasharray="3 3" />
          <module.XAxis dataKey="date" />
          <module.YAxis />
          <module.Tooltip />
          <module.Line 
            type="monotone" 
            dataKey="carbon" 
            stroke="#2e7d32" 
            strokeWidth={2}
            dot={{ fill: '#2e7d32', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#2e7d32', strokeWidth: 2 }}
          />
        </module.LineChart>
      </module.ResponsiveContainer>
    )
  }))
);

type TimeFilter = 'day' | 'week' | 'month' | 'ytd' | 'year';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  // Track page view
  useEffect(() => {
    analytics.trackPageView('Dashboard');
  }, []);

  // Profile setup modal removed - users go directly to dashboard
  const [summary, setSummary] = useState<UserFootprintSummary | null>(null);
  const [allTimeSummary, setAllTimeSummary] = useState<UserFootprintSummary | null>(null);
  const [recentEntries, setRecentEntries] = useState<UserFootprintEntry[]>([]);
  const [historyData, setHistoryData] = useState<UserFootprintHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [retryCount, setRetryCount] = useState(0);
  
  // Performance optimizations
  const { prefetch } = usePrefetch();
  const { elementRef: chartRef, hasIntersected: chartVisible } = useIntersectionObserver();
  
  // Simple cache to avoid re-fetching same data (keeping existing for compatibility)
  const [dataCache, setDataCache] = useState<Map<string, { data: any; timestamp: number }>>(new Map());
  const CACHE_TTL = 1 * 60 * 1000; // Reduced to 1 minute for faster updates

  // Generate history data from entries for chart based on time filter
  const generateHistoryFromEntries = (entries: any[], filter: TimeFilter) => {
    if (!entries.length) return [];
    
    const now = new Date();
    let periods = [];
    let periodCount = 7;
    
    // Determine period count and type based on filter
    switch (filter) {
      case 'day':
        periodCount = 7; // Last 7 days
        break;
      case 'week':
        periodCount = 8; // Last 8 weeks
        break;
      case 'month':
        periodCount = 12; // Last 12 months
        break;
      case 'year':
        periodCount = 5; // Last 5 years
        break;
      default:
        periodCount = 7;
    }
    
    for (let i = periodCount - 1; i >= 0; i--) {
      const date = new Date(now);
      let dateStr = '';
      let periodEntries = [];
      
      switch (filter) {
        case 'day':
          date.setDate(now.getDate() - i);
          dateStr = date.toISOString().split('T')[0];
          periodEntries = entries.filter(entry => 
            entry.date_added && entry.date_added.startsWith(dateStr)
          );
          break;
          
        case 'week':
          date.setDate(now.getDate() - (i * 7));
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay()); // Start of week
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6); // End of week
          dateStr = weekStart.toISOString().split('T')[0];
          
          periodEntries = entries.filter(entry => {
            if (!entry.date_added) return false;
            const entryDate = new Date(entry.date_added);
            return entryDate >= weekStart && entryDate <= weekEnd;
          });
          break;
          
        case 'month':
          date.setMonth(now.getMonth() - i);
          date.setDate(1); // First day of month
          const monthStart = new Date(date);
          const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0); // Last day of month
          dateStr = monthStart.toISOString().split('T')[0];
          
          periodEntries = entries.filter(entry => {
            if (!entry.date_added) return false;
            const entryDate = new Date(entry.date_added);
            return entryDate >= monthStart && entryDate <= monthEnd;
          });
          break;
          
        case 'year':
          date.setFullYear(now.getFullYear() - i);
          date.setMonth(0, 1); // January 1st
          const yearStart = new Date(date);
          const yearEnd = new Date(date.getFullYear(), 11, 31); // December 31st
          dateStr = yearStart.toISOString().split('T')[0];
          
          periodEntries = entries.filter(entry => {
            if (!entry.date_added) return false;
            const entryDate = new Date(entry.date_added);
            return entryDate >= yearStart && entryDate <= yearEnd;
          });
          break;
          
        default:
          date.setDate(now.getDate() - i);
          dateStr = date.toISOString().split('T')[0];
          periodEntries = entries.filter(entry => 
            entry.date_added && entry.date_added.startsWith(dateStr)
          );
      }
      
      const totalFootprint = periodEntries.reduce((sum, entry) => 
        sum + (entry.carbon_footprint * entry.quantity), 0
      );
      
      periods.push({
        date: dateStr,
        totalFootprint,
        entryCount: periodEntries.length
      });
    }
    
    return periods;
  };

  // Prepare chart data from history data (memoized for performance)
  const chartData = React.useMemo(() => {
    if (!historyData || historyData.length === 0) return [];
    
    return historyData.map((dataPoint) => {
      const date = new Date(dataPoint.date);
      let label = '';
      
      switch (timeFilter) {
        case 'day':
          label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          break;
        case 'week':
          label = `Week ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          break;
        case 'month':
          label = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          break;
        case 'year':
          label = date.getFullYear().toString();
          break;
        default:
          label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short' }),
        date: label,
        carbon: Math.round((dataPoint.totalFootprint || 0) * 100) / 100, // Round to 2 decimals
        entries: dataPoint.entryCount || 0
      };
    });
  }, [historyData, timeFilter]);

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

  // Get goal display based on time filter
  const getGoalDisplay = () => {
    switch (timeFilter) {
      case 'day':
        return { label: 'Daily Goal', period: 'day' };
      case 'week':
        return { label: 'Weekly Goal', period: 'week' };
      case 'month':
        return { label: 'Monthly Goal', period: 'month' };
      case 'year':
        return { label: 'Annual Goal', period: 'year' };
      default:
        return { label: 'Weekly Goal', period: 'week' };
    }
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check performance cache first
        const cacheKey = `dashboard-${timeFilter}`;
        const performanceCached = performanceCache.get(cacheKey);
        
        if (performanceCached) {
          logger.log('⚡ Using performance cached dashboard data');
          setSummary(performanceCached.summaryData);
          setRecentEntries(performanceCached.entriesData || []);
          setHistoryData(performanceCached.historyDataResult || []);
          setLoading(false);
          return;
        }
        
        // Check legacy cache
        const cached = dataCache.get(cacheKey);
        const now = Date.now();
        
        if (cached && (now - cached.timestamp) < CACHE_TTL) {
          // Use cached data for instant loading
          const { summaryData, entriesData, historyDataResult } = cached.data;
          setSummary(summaryData);
          setRecentEntries(entriesData || []);
          setHistoryData(historyDataResult || []);
          setLoading(false);
          return;
        }

        // Load all data in parallel for much faster performance
        const startTime = Date.now();
        
        const [summaryResult, entriesResult, allTimeSummaryResult] = await Promise.allSettled([
          userFootprintApi.getSummary(timeFilter),
          userFootprintApi.getEntries({ limit: 10, sort_by: 'date_added', sort_order: 'desc' }),
          userFootprintApi.getSummary('all')
        ]);
        
        // Generate history data from entries for better performance
        const entriesForHistory = entriesResult.status === 'fulfilled' 
          ? entriesResult.value || [] 
          : [];
        const historyDataResult = generateHistoryFromEntries(entriesForHistory, timeFilter);

        // Process results with fallbacks for failed requests
        const summaryData = summaryResult.status === 'fulfilled' 
          ? summaryResult.value 
          : { totalFootprint: 0, totalEntries: 0, avgFootprint: 0, timeframe: timeFilter || 'week' };
          
        const entriesData = entriesResult.status === 'fulfilled'
          ? entriesResult.value || []
          : [];
          
        const allTimeSummaryData = allTimeSummaryResult.status === 'fulfilled'
          ? allTimeSummaryResult.value
          : { totalFootprint: 0, totalEntries: 0, avgFootprint: 0, maxFootprint: 0, minFootprint: 0, timeframe: 'all' };

        const loadTime = Date.now() - startTime;
        if (loadTime > 1000) {
          logger.log(`⚠️ Dashboard loaded slowly: ${loadTime}ms`);
        }
        
        // Cache the loaded data in both caches
        const cacheData = { summaryData, entriesData, historyDataResult };
        
        // Performance cache (more efficient)
        performanceCache.set(cacheKey, cacheData, CACHE_TTL);
        
        // Legacy cache (for compatibility)
        const newCache = new Map(dataCache);
        newCache.set(cacheKey, {
          data: cacheData,
          timestamp: now
        });
        setDataCache(newCache);
        
        setSummary({
          ...summaryData,
          maxFootprint: (summaryData as any).maxFootprint || 0,
          minFootprint: (summaryData as any).minFootprint || 0
        });
        setAllTimeSummary({
          ...allTimeSummaryData,
          maxFootprint: (allTimeSummaryData as any).maxFootprint || 0,
          minFootprint: (allTimeSummaryData as any).minFootprint || 0
        });
        setRecentEntries(entriesData || []);
        setHistoryData(historyDataResult?.map(item => ({
          ...item,
          period: timeFilter
        })) || []);
        
        // Prefetch other time filters for instant switching
        const otherFilters = ['day', 'week', 'month', 'year'].filter(f => f !== timeFilter);
        otherFilters.forEach(filter => {
          prefetch(
            `dashboard-${filter}`,
            async () => {
              const [summaryRes, entriesRes] = await Promise.allSettled([
                userFootprintApi.getSummary(filter as TimeFilter),
                userFootprintApi.getEntries({ limit: 50 })
              ]);
              
              const summary = summaryRes.status === 'fulfilled' ? summaryRes.value : null;
              const entries = entriesRes.status === 'fulfilled' ? entriesRes.value : [];
              const history = generateHistoryFromEntries(entries || [], filter as TimeFilter);
              
              return { summaryData: summary, entriesData: entries, historyDataResult: history };
            },
            CACHE_TTL
          );
        });
      } catch (error: any) {
        console.error('Failed to load dashboard data:', error);
        
        // Retry logic for transient errors
        if (retryCount < 2 && !error.message?.includes('Authorization')) {
          logger.log(`Retrying dashboard load (attempt ${retryCount + 1}/3)...`);
          setTimeout(() => {
            setRetryCount(prev => prev + 1);
            // Trigger a reload by changing a state that will cause useEffect to re-run
            setError(null);
            setLoading(true);
            loadDashboardData();
          }, 1000 * (retryCount + 1)); // Exponential backoff
          return;
        }
        
        // Set fallback data to prevent complete failure
        setSummary({
          totalFootprint: 0,
          totalEntries: 0,
          avgFootprint: 0,
          maxFootprint: 0,
          minFootprint: 0,
          timeframe: timeFilter
        });
        setRecentEntries([]);
        setHistoryData([]);
        
        // Set a more helpful error message
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          setError('Unable to connect to the server. Please check your internet connection and try again.');
        } else if (error.message?.includes('Authorization')) {
          setError('Your session has expired. Please log in again.');
        } else {
          setError('Something went wrong while loading your data. Please try again.');
        }
      } finally {
        setLoading(false);
        // Reset retry count on successful completion or final failure
        if (retryCount > 0) {
          setRetryCount(0);
        }
      }
    };

    loadDashboardData();
  }, [timeFilter]); // Reload when time filter changes

  // Quick actions - Primary: Scan, Secondary: Manual Entry
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

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.round((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return <SkeletonLoader variant="dashboard" />;
  }

  const handleRetry = () => {
    setError(null);
    setLoading(true);
    setRetryCount(0);
    // Trigger a fresh load by changing timeFilter briefly
    const currentFilter = timeFilter;
    setTimeFilter('day');
    setTimeout(() => setTimeFilter(currentFilter), 100);
  };

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 1, mb: 2 }}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={handleRetry}
              disabled={loading}
            >
              {loading ? 'Retrying...' : 'Retry'}
            </Button>
          }
        >
          {error}
        </Alert>
        
        {/* Show fallback empty state */}
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Eco sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Unable to Load Dashboard
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            We're having trouble loading your data. Please try again.
          </Typography>
          <Button 
            variant="contained" 
            onClick={handleRetry}
            disabled={loading}
            sx={{ mt: 2 }}
          >
            {loading ? 'Retrying...' : 'Try Again'}
        </Button>
        </Box>
      </Container>
    );
  }

  // Always show dashboard layout - only check if we have summary data
  const hasData = summary !== null;
  const hasEntries = summary && summary.totalEntries > 0;
  const hasAllTimeEntries = allTimeSummary && allTimeSummary.totalEntries > 0;
  
  // Get appropriate empty state message based on time filter and history
  const getEmptyStateMessage = () => {
    if (!hasAllTimeEntries) {
      // User has never tracked any products
      return {
        title: "Welcome to Your Carbon Footprint Journey!",
        description: "You haven't tracked any products yet. Start building your carbon footprint awareness by scanning a barcode or adding your first product manually."
      };
    }
    
    // User has tracked products before, but not in current time period
    const timeLabels = {
      'day': 'today',
      'week': 'this week',
      'month': 'this month',
      'ytd': 'this year',
      'year': 'this year'
    };
    
    const timeLabel = timeLabels[timeFilter] || 'in this period';
    
    return {
      title: "Welcome to Your Carbon Footprint Journey!",
      description: `You haven't tracked any products ${timeLabel}. Build your carbon footprint awareness by scanning a barcode or adding a product manually.`
    };
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 1, mb: 2 }}>
        {/* Header */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
            Carbon Footprint Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Track the carbon footprint of the products you buy and work towards your sustainability goals
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
            <ToggleButton value="day" aria-label="day">
              Day
            </ToggleButton>
            <ToggleButton value="week" aria-label="week">
              Week
            </ToggleButton>
            <ToggleButton value="month" aria-label="month">
              Month
            </ToggleButton>
            <ToggleButton value="ytd" aria-label="year to date">
              YTD
            </ToggleButton>
            <ToggleButton value="year" aria-label="year">
              Year
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {/* Empty State for New Users */}
      {!hasEntries && (() => {
        const emptyStateMsg = getEmptyStateMessage();
        return (
          <EmptyState
            variant="dashboard"
            title={emptyStateMsg.title}
            description={emptyStateMsg.description}
            actionLabel="Scan Barcode"
            onAction={() => navigate('/products/search?scan=true')}
            secondaryActionLabel="Manual Entry"
            onSecondaryAction={() => navigate('/tracker')}
          />
        );
      })()}

      {/* Main Dashboard Content - Only show when user has entries */}
      {hasEntries && (
        <>
          {/* Main Stats Grid - Using new KPIGroup component */}
          <Box sx={{ mb: 3 }}>
            <KPIGroup
              columns={4}
              spacing={2}
              items={[
                {
                  id: 'current-footprint',
                  icon: <Eco />,
                  label: getDisplayValues().label,
                  value: userFootprintApi.formatCarbonFootprint(getDisplayValues().current),
                  tone: 'success'
                },
                {
                  id: 'average-footprint',
                  icon: <TrendingUp />,
                  label: 'Average per Entry',
                  value: userFootprintApi.formatCarbonFootprint(summary?.avgFootprint || 0),
                  tone: 'default'
                },
                {
                  id: 'goal-progress',
                  icon: <GoalIcon />,
                  label: getGoalDisplay().label,
                  value: 'Set Goal',
                  sub: 'Track your progress',
                  tone: 'warn',
                  onClick: () => navigate('/history')
                },
                {
                  id: 'total-entries',
                  icon: <Assessment />,
                  label: 'Total Entries',
                  value: (summary?.totalEntries || 0).toString(),
                  sub: 'Products tracked',
                  tone: 'default',
                  onClick: () => navigate('/history')
                }
              ]}
            />
          </Box>

      {/* Main Content Grid */}
      <Grid container spacing={2}>
        {/* Quick Actions */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Quick Actions
              </Typography>
              <Grid container spacing={1.5}>
                {quickActions.map((action) => (
                  <Grid 
                    size={{ xs: action.isPrimary ? 12 : 6 }} 
                    key={action.label}
                  >
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
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ height: 'fit-content' }}>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Recent Products
              </Typography>
              {recentEntries.length > 0 ? (
                <List sx={{ maxHeight: 240, overflow: 'auto', py: 0 }}>
                  {recentEntries.map((entry, index) => (
                    <React.Fragment key={entry.id}>
                      <ListItem sx={{ px: 0 }}>
                        <ListItemIcon>
                          <Eco sx={{ color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText
                          primary={entry.product_name}
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                              <BadgePill
                                value={entry.total_footprint}
                                size="small"
                                variant="default"
                                showIcon={true}
                              />
                              <Chip
                                label={`${entry.quantity} ${entry.unit}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontSize: '0.7rem' }}
                              />
                              <Typography variant="caption" color="text.secondary">
                                {formatTimeAgo(entry.date_added)}
                              </Typography>
                            </Box>
                          }
                        />
                      </ListItem>
                      {index < recentEntries.length - 1 && <Divider />}
                    </React.Fragment>
                  ))}
                </List>
              ) : (
                <EmptyState
                  variant="search"
                  title="No entries yet"
                  description="Start tracking your carbon footprint by scanning products or adding manual entries"
                  actionLabel="Scan Barcode"
                  onAction={() => navigate('/products/search?scan=true')}
                />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Trend Chart */}
        {hasData && chartData.length > 0 && (
          <Grid size={{ xs: 12 }}>
            <Card>
            <CardContent sx={{ py: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Recent Activity Trend
                </Typography>
                <Box ref={chartRef} sx={{ height: 280, mt: 1 }}>
                  {chartVisible ? (
                    <Suspense fallback={<SkeletonLoader variant="chart" />}>
                      <LazyLineChart 
                        data={chartData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      />
                    </Suspense>
                  ) : (
                    <SkeletonLoader variant="chart" />
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

      </Grid>
        </>
      )}
    </Container>
  );
}
