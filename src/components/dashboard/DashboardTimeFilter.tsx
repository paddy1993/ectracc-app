import React from 'react';
import {
  ToggleButton,
  ToggleButtonGroup,
  Box,
  useTheme,
  useMediaQuery
} from '@mui/material';

export type TimeFilter = 'day' | 'week' | 'month' | 'ytd' | 'year';

interface DashboardTimeFilterProps {
  value: TimeFilter;
  onChange: (value: TimeFilter) => void;
  disabled?: boolean;
}

const timeFilterOptions = [
  { value: 'day' as TimeFilter, label: 'Today', shortLabel: '1D' },
  { value: 'week' as TimeFilter, label: 'This Week', shortLabel: '7D' },
  { value: 'month' as TimeFilter, label: 'This Month', shortLabel: '1M' },
  { value: 'ytd' as TimeFilter, label: 'Year to Date', shortLabel: 'YTD' },
  { value: 'year' as TimeFilter, label: 'This Year', shortLabel: '1Y' }
];

export default function DashboardTimeFilter({
  value,
  onChange,
  disabled = false
}: DashboardTimeFilterProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const handleChange = (
    event: React.MouseEvent<HTMLElement>,
    newValue: TimeFilter | null
  ) => {
    if (newValue !== null) {
      onChange(newValue);
    }
  };

  const getLabel = (option: typeof timeFilterOptions[0]) => {
    if (isMobile) {
      return option.shortLabel;
    }
    if (isTablet) {
      // Use shorter labels on tablet
      return option.value === 'ytd' ? 'YTD' : option.shortLabel;
    }
    return option.label;
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
      <ToggleButtonGroup
        value={value}
        exclusive
        onChange={handleChange}
        disabled={disabled}
        size={isMobile ? 'small' : 'medium'}
        sx={{
          '& .MuiToggleButton-root': {
            px: isMobile ? 1 : 2,
            py: isMobile ? 0.5 : 1,
            fontSize: isMobile ? '0.75rem' : '0.875rem',
            fontWeight: 500,
            textTransform: 'none',
            border: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.secondary,
            '&:hover': {
              backgroundColor: theme.palette.action.hover,
              color: theme.palette.text.primary
            },
            '&.Mui-selected': {
              backgroundColor: theme.palette.primary.main,
              color: theme.palette.primary.contrastText,
              '&:hover': {
                backgroundColor: theme.palette.primary.dark
              }
            },
            '&.Mui-disabled': {
              opacity: 0.5
            }
          }
        }}
      >
        {timeFilterOptions.map((option) => (
          <ToggleButton
            key={option.value}
            value={option.value}
            aria-label={option.label}
            title={option.label}
          >
            {getLabel(option)}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
    </Box>
  );
}
