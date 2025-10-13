import React from 'react';
import { 
  Box, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  ListItemIcon,
  Typography,
  Chip,
  useTheme
} from '@mui/material';
import { Search, TrendingUp } from '@mui/icons-material';
import { Product } from '../../types';

interface SearchSuggestionsProps {
  suggestions: Product[];
  loading: boolean;
  onSelect: (product: Product) => void;
  query: string;
}

export default function SearchSuggestions({ 
  suggestions, 
  loading, 
  onSelect, 
  query 
}: SearchSuggestionsProps) {
  const theme = useTheme();

  if (loading) {
    return (
      <Box
        sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 1300,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          boxShadow: theme.shadows[4],
          p: 2
        }}
      >
        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
          Searching...
        </Typography>
      </Box>
    );
  }

  if (suggestions.length === 0) {
    return null;
  }

  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <Box component="span" key={index} sx={{ fontWeight: 600, color: 'primary.main' }}>
          {part}
        </Box>
      ) : (
        part
      )
    );
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: '100%',
        left: 0,
        right: 0,
        zIndex: 1300,
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        boxShadow: theme.shadows[4],
        maxHeight: 400,
        overflow: 'auto'
      }}
    >
      <Box sx={{ 
        px: 2,
        py: 1,
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          Product Suggestions
        </Typography>
      </Box>

      <List sx={{ py: 0 }}>
        {suggestions.map((product, index) => (
          <ListItem key={product.id} disablePadding>
            <ListItemButton 
              onClick={() => onSelect(product)}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: theme.palette.action.hover
                },
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: -2
                }
              }}
            >
              <ListItemIcon sx={{ minWidth: 36 }}>
                <Search fontSize="small" color="action" />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography variant="body2">
                      {highlightMatch(product.product_name || 'Unknown Product', query)}
                    </Typography>
                    {product.carbon_footprint && (
                      <Chip
                        label={`${(product.carbon_footprint * 1000).toFixed(0)}g CO₂e`}
                        size="small"
                        color="primary"
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', height: 20 }}
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    {product.categories && product.categories.length > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        {product.categories[0]}
                      </Typography>
                    )}
                    {product.brands && product.brands.length > 0 && (
                      <>
                        <Typography variant="caption" color="text.secondary">•</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {product.brands[0]}
                        </Typography>
                      </>
                    )}
                  </Box>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );
}
