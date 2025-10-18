import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Alert,
  useTheme,
  useMediaQuery,
  Fab,
  IconButton,
  Grid
} from '@mui/material';
import { ArrowBack, Add } from '@mui/icons-material';
import userFootprintApi, { UserFootprintEntry, UserFootprintHistory } from '../services/userFootprintApi';
import analytics, { EVENTS } from '../services/analytics';
import SkeletonLoader from '../components/SkeletonLoader';
import { 
  useOptimizedApiCall, 
  useVirtualScrolling, 
  useIntersectionObserver,
  performanceCache 
} from '../hooks/usePerformanceOptimization';
import EnhancedChart from '../components/history/EnhancedChart';
import ExportActions from '../components/history/ExportActions';
import HistoryEntry from '../components/history/HistoryEntry';
import HistoryFilters, { HistoryFilters as FilterType } from '../components/history/HistoryFilters';
import EmptyState from '../components/ui/EmptyState';
import logger from '../utils/logger';

export default function HistoryPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Track page view
  useEffect(() => {
    analytics.trackPageView('History');
  }, []);
  
  const [filters, setFilters] = useState<FilterType>({
    period: 'week',
    category: '',
    dateRange: { start: null, end: null },
    sortBy: 'date',
    sortOrder: 'desc'
  });
  
  // Optimized API calls with caching
  const {
    data: entriesData,
    loading: entriesLoading,
    error: entriesError,
    refresh: refreshEntries
  } = useOptimizedApiCall(
    () => userFootprintApi.getEntries({ 
      limit: 500,
      start_date: filters.dateRange.start?.toISOString(),
      end_date: filters.dateRange.end?.toISOString(),
      sort_by: filters.sortBy,
      sort_order: filters.sortOrder
    }),
    `history-entries-${JSON.stringify(filters)}`,
    [filters],
    { ttl: 2 * 60 * 1000, immediate: true }
  );

  const {
    data: historyData,
    loading: historyLoading,
    error: historyError
  } = useOptimizedApiCall(
    () => userFootprintApi.getHistory({ period: filters.period, limit: 30 }),
    `history-data-${filters.period}`,
    [filters.period],
    { ttl: 2 * 60 * 1000, immediate: true }
  );

  const allEntries = entriesData || [];
  const loading = entriesLoading || historyLoading;
  const error = entriesError || historyError;

  // Filter entries based on current filters
  const filteredEntries = useMemo(() => {
    let filtered = [...allEntries];

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(entry => 
        (entry as any).category === filters.category
      );
    }

    // Date range filter (additional client-side filtering if needed)
    if (filters.dateRange.start) {
      filtered = filtered.filter(entry => 
        new Date(entry.date_added) >= filters.dateRange.start!
      );
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(entry => 
        new Date(entry.date_added) <= filters.dateRange.end!
      );
    }

    return filtered;
  }, [allEntries, filters]);

  // Get unique categories for filter options
  const availableCategories = useMemo(() => {
    const categories = new Set<string>();
    allEntries.forEach(entry => {
      const category = (entry as any).category;
      if (category) categories.add(category);
    });
    return Array.from(categories).sort();
  }, [allEntries]);

  // Virtual scrolling for large lists
  const ITEM_HEIGHT = isMobile ? 120 : 140;
  const CONTAINER_HEIGHT = isMobile ? 400 : 500;
  const {
    visibleItems: visibleEntries,
    totalHeight,
    offsetY,
    handleScroll
  } = useVirtualScrolling(filteredEntries, ITEM_HEIGHT, CONTAINER_HEIGHT);
  
  // Process entries into chart data based on period
  const processEntriesForChart = (entries: UserFootprintEntry[], period: 'day' | 'week' | 'month'): UserFootprintHistory[] => {
    if (!entries.length) return [];

    const groupedData: Record<string, { totalFootprint: number; entryCount: number; date: string }> = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date_added);
      let key = '';
      
      if (period === 'day') {
        // Group by day
        key = date.toISOString().split('T')[0];
      } else if (period === 'week') {
        // Group by week (start of week)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // Group by month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      }
      
      if (!groupedData[key]) {
        groupedData[key] = { totalFootprint: 0, entryCount: 0, date: key };
      }
      
      groupedData[key].totalFootprint += entry.carbon_footprint * entry.quantity;
      groupedData[key].entryCount += 1;
    });

    return Object.values(groupedData)
      .map(item => ({
        ...item,
        period: filters.period
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  // Use API history data if available, otherwise process entries (memoized for performance)
  const processedHistoryData = useMemo(() => {
    if (historyData && historyData.length > 0) {
      return historyData;
    }
    if (!filteredEntries.length) return [];
    return processEntriesForChart(filteredEntries, filters.period);
  }, [filteredEntries, filters.period, historyData]);

  // Format chart data for trend line
  const chartData = useMemo(() => {
    if (!processedHistoryData || processedHistoryData.length === 0) {
      return [];
    }
    
    return processedHistoryData.map(item => {
      const date = new Date(item.date);
      let periodLabel = '';
      
      if (filters.period === 'day') {
        // For daily: show "Week of Oct 5" format
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
        periodLabel = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      } else if (filters.period === 'week') {
        // For weekly: show "Oct 5" format
        periodLabel = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        // For monthly: show "Oct 2024" format
        periodLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      }
      
      return {
        period: periodLabel,
        carbon: Math.round((item.totalFootprint || 0) * 10) / 10,
        entries: item.entryCount || 0
      };
    });
  }, [processedHistoryData, filters.period]);

  // Calculate category breakdown from filtered entries
  const categoryData = useMemo(() => {
    const categoryBreakdown = filteredEntries.reduce((acc, entry) => {
      const category = (entry as any).category || 'Other';
      if (!acc[category]) {
        acc[category] = { total: 0, count: 0 };
      }
      const entryTotal = entry.carbon_footprint * entry.quantity;
      acc[category].total += entryTotal;
      acc[category].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const totalFootprint = filteredEntries.reduce((sum, e) => sum + (e.carbon_footprint * e.quantity), 0);
    
    return Object.entries(categoryBreakdown).map(([category, data]) => ({
      category,
      value: data.total,
      count: data.count,
      percentage: totalFootprint > 0 ? Math.round((data.total / totalFootprint) * 100) : 0
    }));
  }, [filteredEntries]);

  const handleDeleteEntry = async (entry: UserFootprintEntry) => {
    try {
      await userFootprintApi.deleteEntry(entry.id);
      analytics.trackProductDeleted(
        entry.id,
        entry.product_name || 'Manual Entry',
        entry.carbon_footprint * entry.quantity
      );
      
      // Refresh the entries data
      refreshEntries();
    } catch (error) {
      console.error('Failed to delete entry:', error);
      throw error; // Re-throw to let the component handle the error display
    }
  };

  const formatCarbonFootprint = (value: number) => {
    if (value === 0) return '0g CO₂e';
    if (value < 1000) return `${Math.round(value)}g CO₂e`;
    return `${(value / 1000).toFixed(1)}kg CO₂e`;
  };

  const handleExportComplete = (type: string) => {
    // Track export completion
    logger.log('Export completed:', type, filteredEntries.length, 'entries');
  };

  const handleChartExport = () => {
    // Implementation for chart export
    logger.log('Chart export requested');
  };

  const handleChartShare = () => {
    // Implementation for chart sharing
    logger.log('Chart share requested');
  };

  if (loading) {
    return <SkeletonLoader variant="history" count={10} />;
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 2, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {typeof error === 'string' ? error : 'Failed to load history data'}
        </Alert>
        <IconButton onClick={() => navigate('/dashboard')}>
          <ArrowBack />
        </IconButton>
      </Container>
    );
  }

  const hasData = filteredEntries.length > 0;

  return (
    <Container maxWidth="xl" sx={{ mt: isMobile ? 1 : 2, mb: 4, px: isMobile ? 2 : 3 }}>
      {/* Header */}
      {!isMobile && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            onClick={() => navigate('/dashboard')} 
            sx={{ 
              mr: 2,
              '&:focus-visible': {
                outline: `2px solid ${theme.palette.primary.main}`,
                outlineOffset: 2
              }
            }}
          >
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
            Tracking History
          </Typography>
          
          {hasData && (
            <ExportActions
              entries={filteredEntries}
              chartData={chartData}
              categoryData={categoryData}
              onExportComplete={handleExportComplete}
            />
          )}
        </Box>
      )}

      {/* Filters */}
      <HistoryFilters
        filters={filters}
        onFiltersChange={setFilters}
        categories={availableCategories}
        totalEntries={allEntries.length}
        filteredEntries={filteredEntries.length}
      />

      {!hasData ? (
        <EmptyState
          title="No tracking history yet"
          description="Start tracking products to see your carbon footprint history and trends."
          actionLabel="Track a Product"
          onAction={() => navigate('/search')}
          secondaryActionLabel="Manual Entry"
          onSecondaryAction={() => navigate('/track')}
          variant="history"
        />
      ) : (
        <>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3 }}>
            {/* Charts */}
            <Box sx={{ flex: { xs: '1', lg: '2' } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <EnhancedChart
                  type="line"
                  data={chartData}
                  title="Carbon Footprint Trend"
                  period={filters.period}
                  onExport={handleChartExport}
                  onShare={handleChartShare}
                  height={isMobile ? 250 : 300}
                />
              </Box>
            </Box>

            {/* Category Breakdown */}
            <Box sx={{ flex: { xs: '1', lg: '1' } }}>
              <EnhancedChart
                type="pie"
                data={categoryData}
                title="Category Breakdown"
                period={filters.period}
                onExport={handleChartExport}
                onShare={handleChartShare}
                height={isMobile ? 250 : 300}
              />
            </Box>
          </Box>

          {/* Entries List */}
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
              Recent Entries ({filteredEntries.length})
            </Typography>
            
            {/* Virtual Scrolled List */}
            <Box
              sx={{
                height: CONTAINER_HEIGHT,
                overflow: 'auto',
                position: 'relative'
              }}
              onScroll={handleScroll}
            >
              <Box sx={{ height: totalHeight, position: 'relative' }}>
                <Box sx={{ transform: `translateY(${offsetY}px)` }}>
                  {visibleEntries.map((entry, index) => (
                    <HistoryEntry
                      key={entry.id}
                      entry={entry}
                      onDelete={handleDeleteEntry}
                      formatCarbonFootprint={formatCarbonFootprint}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>
        </>
      )}

      {/* Mobile FAB */}
      {isMobile && (
        <Fab
          color="primary"
          sx={{
            position: 'fixed',
            bottom: 80, // Above bottom navigation
            right: 16,
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.contrastText}`,
              outlineOffset: 2
            }
          }}
          onClick={() => navigate('/search')}
        >
          <Add />
        </Fab>
      )}
    </Container>
  );
}
