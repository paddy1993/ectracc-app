import React from 'react';
import { Box, Chip, Typography, useTheme } from '@mui/material';
import { Clear } from '@mui/icons-material';

interface FilterChip {
  id: string;
  label: string;
  value: string | string[] | number[];
  onRemove: () => void;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}

interface FilterChipsProps {
  filters: FilterChip[];
  onClearAll?: () => void;
  title?: string;
}

export default function FilterChips({ filters, onClearAll, title = "Active Filters" }: FilterChipsProps) {
  const theme = useTheme();

  if (filters.length === 0) {
    return null;
  }

  const formatValue = (value: string | string[] | number[]): string => {
    if (Array.isArray(value)) {
      if (value.length === 0) return '';
      if (value.length === 1) return value[0].toString();
      if (value.length <= 3) return value.join(', ');
      return `${value.slice(0, 2).join(', ')} +${value.length - 2} more`;
    }
    return value.toString();
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
          {title} ({filters.length})
        </Typography>
        {onClearAll && filters.length > 1 && (
          <Chip
            label="Clear All"
            size="small"
            variant="outlined"
            onClick={onClearAll}
            sx={{ 
              fontSize: '0.75rem',
              height: 24,
              '&:hover': {
                backgroundColor: theme.palette.error.light + '20',
                borderColor: theme.palette.error.main
              }
            }}
          />
        )}
      </Box>
      
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {filters.map((filter) => {
          const displayValue = formatValue(filter.value);
          if (!displayValue) return null;

          return (
            <Chip
              key={filter.id}
              label={`${filter.label}: ${displayValue}`}
              onDelete={filter.onRemove}
              deleteIcon={<Clear />}
              size="small"
              color={filter.color || 'primary'}
              variant="filled"
              sx={{
                maxWidth: 200,
                '& .MuiChip-label': {
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2
                }
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
