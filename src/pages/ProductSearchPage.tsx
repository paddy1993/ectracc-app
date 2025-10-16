import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  TextField,
  Card,
  CardContent,
  CardActionArea,
  CardActions,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Pagination,
  Alert,
  InputAdornment,
  IconButton,
  useTheme,
  useMediaQuery,
  Skeleton,
  Slider,
  FormControlLabel,
  Switch,
  Divider,
  Fade,
  Zoom,
  Snackbar,
  CircularProgress
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Search as SearchIcon,
  Clear,
  QrCodeScanner,
  EmojiNature as Eco,
  Add as AddIcon
} from '@mui/icons-material';
import FilterChips from '../components/ui/FilterChips';
import SheetFilters from '../components/filters/SheetFilters';
import SearchHistory from '../components/search/SearchHistory';
import SearchSuggestions from '../components/search/SearchSuggestions';
import EmptyState from '../components/ui/EmptyState';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { Product, ProductSearchParams } from '../types';
import productApi, { ProductApiService } from '../services/productApi';
import { useApp } from '../contexts/AppContext';
import analytics, { EVENTS } from '../services/analytics';
import SkeletonLoader from '../components/SkeletonLoader';
import { 
  useDebounce, 
  useOptimizedApiCall, 
  usePrefetch, 
  useIntersectionObserver,
  performanceCache 
} from '../hooks/usePerformanceOptimization';

// Lazy load the modal for better initial load performance
const AddToFootprintModal = lazy(() => import('../components/AddToFootprintModal'));

// Using optimized debounce hook from performance optimization

// Helper functions for source display
const getSourceIcon = (source: string): string => {
  switch (source) {
    case 'agribalyse': return '🔬';
    case 'manual_research': return '📚';
    case 'user_contributed': return '👥';
    case 'base_component': return '🧱';
    case 'estimated': return '📊';
    default: return '❓';
  }
};

const getSourceColor = (source: string): string => {
  switch (source) {
    case 'agribalyse': return '#1976d2'; // Blue
    case 'manual_research': return '#388e3c'; // Green
    case 'user_contributed': return '#f57c00'; // Orange
    case 'base_component': return '#7b1fa2'; // Purple
    case 'estimated': return '#616161'; // Grey
    default: return '#757575';
  }
};

const getSourceLabel = (source: string): string => {
  switch (source) {
    case 'agribalyse': return 'Agribalyse Database';
    case 'manual_research': return 'Research Studies';
    case 'user_contributed': return 'User Contributed';
    case 'base_component': return 'Base Component';
    case 'estimated': return 'Estimated';
    default: return 'Unknown Source';
  }
};

export default function ProductSearchPage() {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [searchParams, setSearchParams] = useSearchParams();
  const { isOnline } = useApp();

  // Track page view
  useEffect(() => {
    analytics.trackPageView('Product Search');
  }, []);

  // State
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.getAll('category') || []
  );
  const [carbonFootprintRange, setCarbonFootprintRange] = useState<[number, number]>([
    parseFloat(searchParams.get('minCarbon') || '0'),
    parseFloat(searchParams.get('maxCarbon') || '10')
  ]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    searchParams.getAll('brand') || []
  );
  const [selectedSources, setSelectedSources] = useState<string[]>(
    searchParams.getAll('source') || []
  );
  const [sortBy, setSortBy] = useState<'relevance' | 'carbon_asc' | 'carbon_desc' | 'name_asc'>(
    (searchParams.get('sortBy') as any) || 'relevance'
  );
  const [page, setPage] = useState(parseInt(searchParams.get('page') || '1', 10));
  const [pageSize] = useState(20);

  const [products, setProducts] = useState<Product[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingFromCache, setLoadingFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Categories and brands now loaded via optimized API calls above
  const [lastSearchTime, setLastSearchTime] = useState<number>(0);
  
  // Add to footprint modal state
  const [addToFootprintModalOpen, setAddToFootprintModalOpen] = useState(false);
  const [selectedProductForFootprint, setSelectedProductForFootprint] = useState<Product | null>(null);
  const [footprintSuccessMessage, setFootprintSuccessMessage] = useState<string | null>(null);

  // Search enhancements
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<Product[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const { history, addToHistory, removeFromHistory, clearHistory } = useSearchHistory();

  // Debounced search query (reduced from 500ms to 300ms for faster response)
  const debouncedSearchQuery = useDebounce(searchQuery, 200); // Faster response
  
  // Separate debounced query for suggestions (faster)
  const debouncedSuggestionsQuery = useDebounce(searchQuery, 150);

  // Optimized categories and brands loading
  const {
    data: categoriesData,
    loading: categoriesLoading
  } = useOptimizedApiCall(
    () => productApi.getCategories(),
    'product-categories',
    [],
    { ttl: 10 * 60 * 1000, immediate: true } // 10 minutes cache
  );

  const {
    data: brandsData,
    loading: brandsLoading
  } = useOptimizedApiCall(
    () => productApi.getBrands(),
    'product-brands',
    [],
    { ttl: 10 * 60 * 1000, immediate: true } // 10 minutes cache
  );

  const availableCategories = categoriesData || [];
  const availableBrands = brandsData || [];

  // Load suggestions for typeahead
  useEffect(() => {
    if (!debouncedSuggestionsQuery.trim() || debouncedSuggestionsQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const loadSuggestions = async () => {
      setSuggestionsLoading(true);
      try {
        const result = await productApi.searchProducts({
          q: debouncedSuggestionsQuery,
          page: 1,
          limit: 5, // Only need a few suggestions
          sortBy: 'relevance'
        });
        setSuggestions(result.data.slice(0, 5));
      } catch (error) {
        // Silently fail for suggestions
        setSuggestions([]);
      } finally {
        setSuggestionsLoading(false);
      }
    };

    loadSuggestions();
  }, [debouncedSuggestionsQuery]);

  // Search products with performance tracking
  const searchProducts = useCallback(async (params: ProductSearchParams) => {
    const startTime = Date.now();
    setLoading(true);
    setLoadingFromCache(false);
    setError(null);

    try {
      // Check if this might be served from cache
      const paramString = JSON.stringify(params);
      const now = Date.now();
      if (lastSearchTime > 0 && now - lastSearchTime < 1000) {
        setLoadingFromCache(true);
      }

      const result = await productApi.searchProducts(params);
      const searchTime = Date.now() - startTime;
      
      setProducts(result.data);
      setTotal(result.meta.pagination.total);
      setTotalPages(result.meta.pagination.totalPages);
      setLastSearchTime(now);

      // Log performance metrics
      if (searchTime < 100) {
        console.log('🚀 Fast search (likely cached):', searchTime + 'ms');
      } else {
        console.log('🌐 Network search:', searchTime + 'ms');
      }
    } catch (error: any) {
      // Don't show error for cancelled requests (user typed new search)
      if (error.message === 'Request was cancelled') {
        console.log('🔄 Search request cancelled (new search started)');
        return;
      }
      
      setError(error.message || 'Failed to search products');
      setProducts([]);
      setTotal(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
      setLoadingFromCache(false);
    }
  }, []); // Remove lastSearchTime dependency to prevent infinite loop

  // Manual search function
  const handleSearch = useCallback(() => {
    const params: ProductSearchParams = {
      q: searchQuery || undefined,
      category: selectedCategories.length > 0 ? selectedCategories : undefined,
      brand: selectedBrands.length > 0 ? selectedBrands : undefined,
      minCarbon: carbonFootprintRange[0] > 0 ? carbonFootprintRange[0] : undefined,
      maxCarbon: carbonFootprintRange[1] < 10 ? carbonFootprintRange[1] : undefined,
      sortBy: sortBy !== 'relevance' ? sortBy : undefined,
      page: 1, // Reset to first page on new search
      limit: pageSize
    };

    // Update URL
    const newSearchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) {
          value.forEach(v => newSearchParams.append(key, String(v)));
        } else {
          newSearchParams.append(key, String(value));
        }
      }
    });
    setSearchParams(newSearchParams);

    // Reset page to 1 for new search
    setPage(1);
    
    // Track search
    analytics.trackProductSearch(searchQuery, {
      categories: selectedCategories,
      brands: selectedBrands,
      carbon_range: carbonFootprintRange,
      sort_by: sortBy
    }, 0); // Will update with actual count after search
    
    // Perform search
    searchProducts(params);
  }, [searchQuery, selectedCategories, selectedBrands, carbonFootprintRange, sortBy, pageSize, searchProducts, setSearchParams]);

  // Update URL when page changes (for pagination)
  useEffect(() => {
    if (page > 1) {
      const currentParams = new URLSearchParams(searchParams);
      currentParams.set('page', String(page));
      setSearchParams(currentParams);
      
      // Re-search with new page
      const params: ProductSearchParams = {
        q: searchQuery || undefined,
        category: selectedCategories.length > 0 ? selectedCategories : undefined,
        brand: selectedBrands.length > 0 ? selectedBrands : undefined,
        minCarbon: carbonFootprintRange[0] > 0 ? carbonFootprintRange[0] : undefined,
        maxCarbon: carbonFootprintRange[1] < 10 ? carbonFootprintRange[1] : undefined,
        sortBy: sortBy !== 'relevance' ? sortBy : undefined,
        page: page,
        limit: pageSize
      };
      searchProducts(params);
    }
  }, [page]);

  // Handlers
  const handlePageChange = (event: React.ChangeEvent<unknown>, newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Execute search with history tracking
  const executeSearch = useCallback((query: string = searchQuery) => {
    if (query.trim()) {
      addToHistory(query.trim());
    }
    setSearchFocused(false);
    setSuggestions([]);
    handleSearch();
  }, [searchQuery, addToHistory, handleSearch]);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) return; // Only search when debounce is complete
    
    const params: ProductSearchParams = {
      q: debouncedSearchQuery || undefined,
      category: selectedCategories.length > 0 ? selectedCategories : undefined,
      brand: selectedBrands.length > 0 ? selectedBrands : undefined,
      minCarbon: carbonFootprintRange[0] > 0 ? carbonFootprintRange[0] : undefined,
      maxCarbon: carbonFootprintRange[1] < 10 ? carbonFootprintRange[1] : undefined,
      sortBy: sortBy !== 'relevance' ? sortBy : undefined,
      page: 1,
      limit: pageSize
    };

    setPage(1);
    searchProducts(params);
  }, [debouncedSearchQuery, selectedCategories, selectedBrands, selectedSources, carbonFootprintRange, sortBy]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedSources([]);
    setCarbonFootprintRange([0, 10]);
    setSortBy('relevance');
    setPage(1);
  };

  // Filter management
  const activeFilters = useMemo(() => {
    const filters = [];
    
    if (selectedCategories.length > 0) {
      filters.push({
        id: 'categories',
        label: 'Categories',
        value: selectedCategories,
        onRemove: () => setSelectedCategories([]),
        color: 'primary' as const
      });
    }
    
    if (selectedBrands.length > 0) {
      filters.push({
        id: 'brands',
        label: 'Brands',
        value: selectedBrands,
        onRemove: () => setSelectedBrands([]),
        color: 'secondary' as const
      });
    }
    
    if (selectedSources.length > 0) {
      filters.push({
        id: 'sources',
        label: 'Sources',
        value: selectedSources,
        onRemove: () => setSelectedSources([]),
        color: 'success' as const
      });
    }
    
    if (carbonFootprintRange[0] > 0 || carbonFootprintRange[1] < 10) {
      filters.push({
        id: 'carbon-range',
        label: 'Carbon Range',
        value: [`${carbonFootprintRange[0]}-${carbonFootprintRange[1]} kg CO₂e`],
        onRemove: () => setCarbonFootprintRange([0, 10]),
        color: 'warning' as const
      });
    }
    
    return filters;
  }, [selectedCategories, selectedBrands, selectedSources, carbonFootprintRange]);

  // Haptic feedback for mobile interactions
  const triggerHapticFeedback = () => {
    if ('vibrate' in navigator && isMobile) {
      navigator.vibrate(50);
    }
  };

  const handleProductClick = (product: Product) => {
    // Track product view
    analytics.trackProductViewed(product.id, product.product_name, product.categories?.[0] || 'unknown');
    
    // For now, just open the add to footprint modal
    // In the future, this could navigate to a detailed product page
    triggerHapticFeedback();
    setSelectedProductForFootprint(product);
    setAddToFootprintModalOpen(true);
  };

  const handleAddToFootprint = (product: Product, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    triggerHapticFeedback();
    setSelectedProductForFootprint(product);
    setAddToFootprintModalOpen(true);
  };

  const handleFootprintModalClose = () => {
    setAddToFootprintModalOpen(false);
    setSelectedProductForFootprint(null);
  };

  const handleFootprintSuccess = (entry: any) => {
    setFootprintSuccessMessage(`Added ${entry.product_name} to your footprint!`);
  };

  const handleScannerClick = () => {
    navigate('/scanner');
  };

  // Calculate active filters count
  const getActiveFiltersCount = () => {
    let count = 0;
    if (selectedCategories.length > 0) count++;
    if (selectedBrands.length > 0) count++;
    if (selectedSources.length > 0) count++;
    if (carbonFootprintRange[0] > 0 || carbonFootprintRange[1] < 10) count++;
    if (sortBy !== 'relevance') count++;
    return count;
  };

  // Filter panel component
  const FilterPanel = () => (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Filters
      </Typography>
      
      {/* Filter Grid */}
      <Grid container spacing={3}>
        {/* Categories */}
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <FormControl fullWidth disabled={categoriesLoading}>
            <InputLabel>Categories</InputLabel>
            <Select
              multiple
              value={selectedCategories}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedCategories(typeof value === 'string' ? value.split(',') : value);
                setPage(1);
              }}
              label="Categories"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(Array.isArray(selected) ? selected : []).slice(0, 1).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                  {(Array.isArray(selected) ? selected : []).length > 1 && (
                    <Chip label={`+${(Array.isArray(selected) ? selected : []).length - 1}`} size="small" />
                  )}
                </Box>
              )}
            >
              {categoriesLoading ? (
                <MenuItem disabled>Loading categories...</MenuItem>
              ) : availableCategories.length === 0 ? (
                <MenuItem disabled>No categories available</MenuItem>
              ) : (
                (availableCategories || []).map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>

        {/* Brands */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth disabled={brandsLoading}>
            <InputLabel>Brands</InputLabel>
            <Select
              multiple
              value={selectedBrands}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedBrands(typeof value === 'string' ? value.split(',') : value);
                setPage(1);
              }}
              data-testid="brand-filter"
              label="Brands"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(Array.isArray(selected) ? selected : []).slice(0, 1).map((value) => (
                    <Chip key={value} label={value} size="small" />
                  ))}
                  {(Array.isArray(selected) ? selected : []).length > 1 && (
                    <Chip label={`+${(Array.isArray(selected) ? selected : []).length - 1}`} size="small" />
                  )}
                </Box>
              )}
            >
              {brandsLoading ? (
                <MenuItem disabled>Loading brands...</MenuItem>
              ) : availableBrands.length === 0 ? (
                <MenuItem disabled>No brands available</MenuItem>
              ) : (
                (availableBrands || []).slice(0, 50).map((brand) => (
                  <MenuItem key={brand} value={brand}>
                    {brand}
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </Grid>

        {/* Data Sources */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Data Source</InputLabel>
            <Select
              multiple
              value={selectedSources}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedSources(typeof value === 'string' ? value.split(',') : value);
                setPage(1);
              }}
              label="Data Source"
              renderValue={(selected) => (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {(Array.isArray(selected) ? selected : []).slice(0, 1).map((value) => (
                    <Chip 
                      key={value} 
                      label={`${getSourceIcon(value)} ${getSourceLabel(value).split(' ')[0]}`}
                      size="small"
                      sx={{
                        bgcolor: getSourceColor(value),
                        color: 'white'
                      }}
                    />
                  ))}
                  {(Array.isArray(selected) ? selected : []).length > 1 && (
                    <Chip label={`+${(Array.isArray(selected) ? selected : []).length - 1}`} size="small" />
                  )}
                </Box>
              )}
            >
              {['agribalyse', 'manual_research', 'base_component', 'user_contributed', 'estimated'].map((source) => (
                <MenuItem key={source} value={source}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{getSourceIcon(source)}</span>
                    <span>{getSourceLabel(source)}</span>
                  </Box>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Sort */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <FormControl fullWidth>
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setPage(1);
              }}
              label="Sort By"
            >
              <MenuItem value="relevance">🔍 Relevance</MenuItem>
              <MenuItem value="carbon_asc">📉 Low to High</MenuItem>
              <MenuItem value="carbon_desc">📈 High to Low</MenuItem>
              <MenuItem value="name_asc">🔤 A-Z</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Clear Filters */}
        <Grid size={{ xs: 12, sm: 6, md: 2 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={clearFilters}
            sx={{ height: '56px' }} // Match FormControl height
            disabled={getActiveFiltersCount() === 0}
          >
            Clear Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </Button>
        </Grid>
      </Grid>

      {/* Carbon Footprint Range - Full Width */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="body2" gutterBottom>
          Carbon Footprint Range (kg CO₂e)
        </Typography>
        <Slider
          value={carbonFootprintRange}
          onChange={(_, newValue) => {
            setCarbonFootprintRange(newValue as [number, number]);
            setPage(1);
          }}
          valueLabelDisplay="auto"
          valueLabelFormat={(value) => `${value} kg`}
          min={0}
          max={10}
          step={0.5}
          marks={[
            { value: 0, label: '0' },
            { value: 2.5, label: '2.5' },
            { value: 5, label: '5' },
            { value: 10, label: '10+' }
          ]}
        />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Typography variant="caption">
            {carbonFootprintRange[0]} kg CO₂e
          </Typography>
          <Typography variant="caption">
            {carbonFootprintRange[1] >= 10 ? '10+ kg CO₂e' : `${carbonFootprintRange[1]} kg CO₂e`}
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  // Product skeleton loader
  const ProductSkeleton = () => (
    <Card>
      <CardContent>
        <Skeleton variant="text" width="80%" height={24} />
        <Skeleton variant="text" width="60%" height={20} sx={{ mt: 1 }} />
        <Box sx={{ display: 'flex', gap: 1, mt: 1, mb: 1 }}>
          <Skeleton variant="rectangular" width={60} height={24} />
          <Skeleton variant="rectangular" width={80} height={24} />
        </Box>
        <Skeleton variant="text" width="40%" height={20} />
      </CardContent>
    </Card>
  );

  return (
    <Container maxWidth="xl" sx={{ mt: 1, mb: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, mb: 1 }}>
          Product Search
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Search for products and discover their environmental impact
        </Typography>
      </Box>
      {/* Enhanced Search Bar with Typeahead */}
      <Box sx={{ mb: 3, position: 'relative' }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ flex: 1, position: 'relative' }}>
            <TextField
              fullWidth
              placeholder="Search for products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => {
                // Delay hiding to allow clicks on suggestions
                setTimeout(() => setSearchFocused(false), 200);
              }}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  executeSearch();
                }
              }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton 
                      onClick={() => {
                        setSearchQuery('');
                        setSuggestions([]);
                      }} 
                      size="small"
                      sx={{
                        '&:focus-visible': {
                          outline: `2px solid ${theme.palette.primary.main}`,
                          outlineOffset: 2
                        }
                      }}
                    >
                      <Clear />
                    </IconButton>
                  </InputAdornment>
                )
              }}
              sx={{ 
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:focus-within': {
                    '& fieldset': {
                      borderColor: theme.palette.primary.main,
                      borderWidth: 2
                    }
                  }
                }
              }}
            />
            
            {/* Search History */}
            {searchFocused && !searchQuery && history.length > 0 && (
              <SearchHistory
                history={history}
                onSelect={(term) => {
                  setSearchQuery(term);
                  executeSearch(term);
                }}
                onRemove={removeFromHistory}
                onClear={clearHistory}
              />
            )}
            
            {/* Search Suggestions */}
            {searchFocused && searchQuery.length >= 2 && (
              <SearchSuggestions
                suggestions={suggestions}
                loading={suggestionsLoading}
                query={searchQuery}
                onSelect={(product) => {
                  setSearchQuery(product.product_name || '');
                  executeSearch(product.product_name || '');
                  handleProductClick(product);
                }}
              />
            )}
          </Box>
          
          {!isMobile && (
            <Button
              variant="contained"
              onClick={() => executeSearch()}
              disabled={loading}
              sx={{ 
                minWidth: 120,
                borderRadius: 2,
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2
                }
              }}
            >
              {loading ? <CircularProgress size={20} /> : 'Search'}
            </Button>
          )}
        </Box>
      </Box>
      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, justifyContent: 'center' }}>
        <Button
          variant="contained"
          color="success"
          startIcon={<QrCodeScanner />}
          onClick={handleScannerClick}
        >
          Scan Barcode
        </Button>
      </Box>
      {/* Filter Chips */}
      <FilterChips
        filters={activeFilters}
        onClearAll={clearFilters}
      />

      {/* Desktop Filters */}
      {!isMobile && (
        <Card sx={{ mb: 3 }}>
          <FilterPanel />
        </Card>
      )}

      {/* Mobile Filter Sheet */}
      <SheetFilters
        title="Product Filters"
        filterCount={activeFilters.length}
        onReset={clearFilters}
      >
        <FilterPanel />
      </SheetFilters>

      {/* Results Section */}
      <Box>
          {/* Results Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="text.secondary">
                {loading ? (
                  loadingFromCache ? 'Loading from cache...' : 'Searching...'
                ) : (
                  `${total.toLocaleString()} products found`
                )}
              </Typography>
              {!loading && products.length > 0 && lastSearchTime > 0 && (
                <Chip
                  label="⚡ Cached"
                  size="small"
                  variant="outlined"
                  sx={{ 
                    height: 20,
                    fontSize: '0.7rem',
                    color: 'success.main',
                    borderColor: 'success.main',
                    opacity: 0.8
                  }}
                />
              )}
            </Box>
            {!loading && products.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Page {page} of {totalPages}
              </Typography>
            )}
          </Box>

          {/* Offline Indicator */}
          {!isOnline && products.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              You're currently offline. Showing cached results from your last search.
            </Alert>
          )}

          {/* Error State */}
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Results Grid */}
          <Grid container spacing={2}>
            {loading ? (
              <Grid size={{ xs: 12 }}>
                <SkeletonLoader variant="product-search" count={8} />
              </Grid>
            ) : products.length === 0 ? (
              <Grid size={{ xs: 12 }}>
                <EmptyState
                  variant="search"
                  title="No products found"
                  description="Try adjusting your search terms or filters to find what you're looking for."
                  actionLabel="Clear Filters"
                  onAction={clearFilters}
                  secondaryActionLabel="Scan Barcode"
                  onSecondaryAction={handleScannerClick}
                />
              </Grid>
            ) : (
              // Enhanced product cards with animations
              (products.map((product, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={product.id}>
                  <Zoom
                    in={true}
                    timeout={200 + index * 50}
                    style={{ transitionDelay: `${index * 50}ms` }}
                  >
                    <Card 
                      sx={{ 
                        height: '100%', 
                        display: 'flex', 
                        flexDirection: 'column',
                        transition: 'all 0.2s ease-in-out',
                        cursor: 'pointer',
                        '&:hover': {
                          transform: isMobile ? 'none' : 'translateY(-4px)',
                          boxShadow: isMobile ? 2 : 4
                        },
                        '&:active': {
                          transform: 'scale(0.98)',
                          transition: 'transform 0.1s ease'
                        }
                      }}
                    >
                    <CardActionArea
                      onClick={() => handleProductClick(product)}
                      sx={{ 
                        flexGrow: 1,
                        p: 0,
                        '&:hover .product-title': {
                          color: 'primary.main'
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2.5 }}>
                        {/* Product Name */}
                        <Typography 
                          variant="h6" 
                          component="h3" 
                          className="product-title"
                          sx={{ 
                            mb: 1,
                            fontSize: '1.1rem',
                            fontWeight: 600,
                            lineHeight: 1.3,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '2.6rem',
                            transition: 'color 0.2s ease'
                          }}
                        >
                          {product.product_name}
                        </Typography>
                        
                        {/* Brand */}
                        {product.brands.length > 0 && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{ mb: 1.5, fontWeight: 500 }}
                          >
                            {product.brands.slice(0, 2).join(', ')}
                            {product.brands.length > 2 && ` +${product.brands.length - 2}`}
                          </Typography>
                        )}

                        {/* Eco Score and Carbon Footprint */}
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center' }}>
                          {product.ecoscore_grade && (
                            <Chip
                              label={`${product.ecoscore_grade.toUpperCase()} • ${ProductApiService.getEcoScoreLabel(product.ecoscore_grade)}`}
                              size="small"
                              sx={{
                                bgcolor: ProductApiService.getEcoScoreColor(product.ecoscore_grade),
                                color: 'white',
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}
                            />
                          )}
                          {product.carbon_footprint && (
                            <>
                              <Chip
                                label={`🌱 ${ProductApiService.formatCarbonFootprint(product.carbon_footprint)}`}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  borderColor: 'success.main',
                                  color: 'success.main',
                                  fontSize: '0.75rem'
                                }}
                              />
                              {product.source_database && (
                                <Chip
                                  label={getSourceIcon(product.source_database)}
                                  size="small"
                                  variant="outlined"
                                  sx={{ 
                                    borderColor: getSourceColor(product.source_database),
                                    color: getSourceColor(product.source_database),
                                    fontSize: '0.7rem',
                                    minWidth: 'auto',
                                    '& .MuiChip-label': { px: 0.5 }
                                  }}
                                  title={getSourceLabel(product.source_database)}
                                />
                              )}
                            </>
                          )}
                        </Box>

                        {/* Categories */}
                        <Typography 
                          variant="caption" 
                          color="text.secondary" 
                          component="div"
                          sx={{ 
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}
                        >
                          {product.categories.slice(0, 3).join(' • ')}
                          {product.categories.length > 3 && ` • +${product.categories.length - 3} more`}
                        </Typography>
                      </CardContent>
                    </CardActionArea>
                    
                    {/* Add to Footprint Button */}
                    <CardActions sx={{ pt: 0, px: 2.5, pb: 2 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        size="small"
                        startIcon={<AddIcon />}
                        onClick={(e) => handleAddToFootprint(product, e)}
                        sx={{
                          borderRadius: 2,
                          textTransform: 'none',
                          fontWeight: 600,
                          '&:hover': {
                            transform: 'translateY(-1px)',
                            boxShadow: 2
                          }
                        }}
                      >
                        Add to My Footprint
                      </Button>
                    </CardActions>
                  </Card>
                  </Zoom>
                </Grid>
              )))
            )}
          </Grid>

          {/* Enhanced Pagination */}
          {totalPages > 1 && (
            <Fade in={true} timeout={500}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                mt: 4,
                p: 2,
                borderRadius: 2,
                bgcolor: 'background.paper'
              }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, newPage) => {
                    triggerHapticFeedback();
                    handlePageChange(event, newPage);
                  }}
                  color="primary"
                  size={isMobile ? 'small' : 'medium'}
                  showFirstButton={!isMobile}
                  showLastButton={!isMobile}
                  siblingCount={isMobile ? 0 : 1}
                  boundaryCount={isMobile ? 1 : 2}
                  sx={{
                    '& .MuiPaginationItem-root': {
                      minWidth: isMobile ? 32 : 40,
                      height: isMobile ? 32 : 40,
                      margin: isMobile ? '0 2px' : '0 4px'
                    }
                  }}
                />
              </Box>
            </Fade>
          )}
      </Box>

      {/* Add to Footprint Modal */}
      {addToFootprintModalOpen && (
        <Suspense fallback={<div>Loading...</div>}>
          <AddToFootprintModal
            open={addToFootprintModalOpen}
            onClose={handleFootprintModalClose}
            product={selectedProductForFootprint}
            onSuccess={handleFootprintSuccess}
          />
        </Suspense>
      )}

      {/* Success Snackbar */}
      <Snackbar
        open={!!footprintSuccessMessage}
        autoHideDuration={4000}
        onClose={() => setFootprintSuccessMessage(null)}
        message={footprintSuccessMessage}
        action={
          <IconButton
            size="small"
            aria-label="close"
            color="inherit"
            onClick={() => setFootprintSuccessMessage(null)}
          >
            <Clear fontSize="small" />
          </IconButton>
        }
      />
    </Container>
  );
}
