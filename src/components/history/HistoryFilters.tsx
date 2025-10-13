import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  TextField,
  IconButton,
  Collapse,
  useTheme,
  useMediaQuery,
  Drawer,
  Button
} from '@mui/material';
import {
  FilterList,
  Clear,
  TuneRounded,
  Close
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

export interface HistoryFilters {
  period: 'day' | 'week' | 'month';
  category: string;
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  sortBy: 'date' | 'carbon' | 'name';
  sortOrder: 'asc' | 'desc';
}

interface HistoryFiltersProps {
  filters: HistoryFilters;
  onFiltersChange: (filters: HistoryFilters) => void;
  categories: string[];
  totalEntries: number;
  filteredEntries: number;
}

export default function HistoryFilters({
  filters,
  onFiltersChange,
  categories,
  totalEntries,
  filteredEntries
}: HistoryFiltersProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const handleFilterChange = (key: keyof HistoryFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      period: 'week',
      category: '',
      dateRange: { start: null, end: null },
      sortBy: 'date',
      sortOrder: 'desc'
    });
  };

  const hasActiveFilters = filters.category || filters.dateRange.start || filters.dateRange.end;

  const FilterContent = () => (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Period Toggle */}
      <Box>
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
          Time Period
        </Typography>
        <ToggleButtonGroup
          value={filters.period}
          exclusive
          onChange={(_, value) => value && handleFilterChange('period', value)}
          size="small"
          fullWidth={isMobile}
        >
          <ToggleButton value="day">Daily</ToggleButton>
          <ToggleButton value="week">Weekly</ToggleButton>
          <ToggleButton value="month">Monthly</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Category Filter */}
      <FormControl size="small" fullWidth>
        <InputLabel>Category</InputLabel>
        <Select
          value={filters.category}
          label="Category"
          onChange={(e) => handleFilterChange('category', e.target.value)}
        >
          <MenuItem value="">All Categories</MenuItem>
          {categories.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Advanced Filters Toggle */}
      <Button
        variant="text"
        onClick={() => setAdvancedOpen(!advancedOpen)}
        startIcon={<TuneRounded />}
        sx={{ alignSelf: 'flex-start' }}
      >
        Advanced Filters
      </Button>

      {/* Advanced Filters */}
      <Collapse in={advancedOpen}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {/* Date Range */}
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <DatePicker
                label="Start Date"
                value={filters.dateRange.start}
                onChange={(date) => handleFilterChange('dateRange', { ...filters.dateRange, start: date })}
                slotProps={{ textField: { size: 'small' } }}
              />
              <DatePicker
                label="End Date"
                value={filters.dateRange.end}
                onChange={(date) => handleFilterChange('dateRange', { ...filters.dateRange, end: date })}
                slotProps={{ textField: { size: 'small' } }}
              />
            </Box>
          </LocalizationProvider>

          {/* Sort Options */}
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
            <FormControl size="small">
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy}
                label="Sort By"
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              >
                <MenuItem value="date">Date Added</MenuItem>
                <MenuItem value="carbon">Carbon Footprint</MenuItem>
                <MenuItem value="name">Product Name</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small">
              <InputLabel>Order</InputLabel>
              <Select
                value={filters.sortOrder}
                label="Order"
                onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
              >
                <MenuItem value="desc">Descending</MenuItem>
                <MenuItem value="asc">Ascending</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Collapse>

      {/* Active Filters & Results */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {hasActiveFilters && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary">
              Active filters:
            </Typography>
            
            {filters.category && (
              <Chip
                label={`Category: ${filters.category}`}
                size="small"
                onDelete={() => handleFilterChange('category', '')}
                deleteIcon={<Clear />}
              />
            )}
            
            {filters.dateRange.start && (
              <Chip
                label={`From: ${filters.dateRange.start.toLocaleDateString()}`}
                size="small"
                onDelete={() => handleFilterChange('dateRange', { ...filters.dateRange, start: null })}
                deleteIcon={<Clear />}
              />
            )}
            
            {filters.dateRange.end && (
              <Chip
                label={`To: ${filters.dateRange.end.toLocaleDateString()}`}
                size="small"
                onDelete={() => handleFilterChange('dateRange', { ...filters.dateRange, end: null })}
                deleteIcon={<Clear />}
              />
            )}

            <Button
              size="small"
              onClick={clearFilters}
              startIcon={<Clear />}
              sx={{ ml: 'auto' }}
            >
              Clear All
            </Button>
          </Box>
        )}

        <Typography variant="caption" color="text.secondary">
          Showing {filteredEntries} of {totalEntries} entries
        </Typography>
      </Box>
    </Box>
  );

  if (isMobile) {
    return (
      <>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            History
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {hasActiveFilters && (
              <Chip
                label={`${filteredEntries} filtered`}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
            
            <IconButton
              onClick={() => setMobileFiltersOpen(true)}
              sx={{
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2
                }
              }}
            >
              <FilterList />
            </IconButton>
          </Box>
        </Box>

        <Drawer
          anchor="bottom"
          open={mobileFiltersOpen}
          onClose={() => setMobileFiltersOpen(false)}
          PaperProps={{
            sx: {
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '80vh'
            }
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Filter History
              </Typography>
              <IconButton onClick={() => setMobileFiltersOpen(false)}>
                <Close />
              </IconButton>
            </Box>
            
            <FilterContent />
            
            <Button
              variant="contained"
              fullWidth
              onClick={() => setMobileFiltersOpen(false)}
              sx={{ mt: 3 }}
            >
              Apply Filters
            </Button>
          </Box>
        </Drawer>
      </>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Filter & Sort
          </Typography>
          
          {hasActiveFilters && (
            <Chip
              label={`${filteredEntries} of ${totalEntries} entries`}
              size="small"
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
        
        <FilterContent />
      </CardContent>
    </Card>
  );
}
