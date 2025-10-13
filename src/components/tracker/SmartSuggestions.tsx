import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Grid,
  useTheme,
  alpha
} from '@mui/material';
import { 
  TrendingUp,
  EmojiNature as Eco
} from '@mui/icons-material';

interface Suggestion {
  name: string;
  amount: number;
  carbon: number;
  unit: string;
  category: string;
}

interface SmartSuggestionsProps {
  category: string;
  onSelect: (suggestion: Suggestion) => void;
  currentItem?: string;
}

export default function SmartSuggestions({ 
  category, 
  onSelect, 
  currentItem 
}: SmartSuggestionsProps) {
  const theme = useTheme();

  const suggestions = useMemo(() => {
    const allSuggestions: Record<string, Suggestion[]> = {
      food: [
        { name: 'Beef (100g)', amount: 100, carbon: 51000, unit: 'g', category: 'food' },
        { name: 'Chicken (100g)', amount: 100, carbon: 2800, unit: 'g', category: 'food' },
        { name: 'Milk (1 pint)', amount: 568, carbon: 600, unit: 'ml', category: 'food' },
        { name: 'Banana (1 medium)', amount: 1, carbon: 110, unit: 'item', category: 'food' },
        { name: 'Apple (1 medium)', amount: 1, carbon: 30, unit: 'item', category: 'food' },
        { name: 'Bread (1 slice)', amount: 1, carbon: 480, unit: 'item', category: 'food' },
        { name: 'Coffee (1 cup)', amount: 1, carbon: 87, unit: 'item', category: 'food' },
        { name: 'Eggs (1 large)', amount: 1, carbon: 340, unit: 'item', category: 'food' }
      ],
      transport: [
        { name: 'Car - Petrol (1 km)', amount: 1, carbon: 180, unit: 'km', category: 'transport' },
        { name: 'Car - Electric (1 km)', amount: 1, carbon: 50, unit: 'km', category: 'transport' },
        { name: 'Bus (1 km)', amount: 1, carbon: 89, unit: 'km', category: 'transport' },
        { name: 'Train (1 km)', amount: 1, carbon: 41, unit: 'km', category: 'transport' },
        { name: 'Flight - Domestic (1 km)', amount: 1, carbon: 255, unit: 'km', category: 'transport' },
        { name: 'Bike/Walk (1 km)', amount: 1, carbon: 0, unit: 'km', category: 'transport' }
      ],
      energy: [
        { name: 'Electricity (1 kWh)', amount: 1, carbon: 820, unit: 'kWh', category: 'energy' },
        { name: 'Natural Gas (1 kWh)', amount: 1, carbon: 200, unit: 'kWh', category: 'energy' },
        { name: 'Heating Oil (1 liter)', amount: 1, carbon: 2500, unit: 'liter', category: 'energy' },
        { name: 'Gasoline (1 liter)', amount: 1, carbon: 3420, unit: 'liter', category: 'energy' }
      ],
      shopping: [
        { name: 'Cotton T-shirt', amount: 1, carbon: 2400, unit: 'item', category: 'shopping' },
        { name: 'Jeans (cotton)', amount: 1, carbon: 1600, unit: 'item', category: 'shopping' },
        { name: 'Smartphone', amount: 1, carbon: 70000, unit: 'item', category: 'shopping' },
        { name: 'Laptop', amount: 1, carbon: 300000, unit: 'item', category: 'shopping' },
        { name: 'Plastic bottle (1L)', amount: 1, carbon: 400, unit: 'item', category: 'shopping' }
      ],
      misc: [
        { name: 'Paper coffee cup', amount: 1, carbon: 11, unit: 'item', category: 'misc' },
        { name: 'Aluminum can', amount: 1, carbon: 170, unit: 'item', category: 'misc' },
        { name: 'Newspaper (daily)', amount: 1, carbon: 220, unit: 'item', category: 'misc' },
        { name: 'Plastic carrier bag', amount: 1, carbon: 10, unit: 'item', category: 'misc' }
      ]
    };

    return allSuggestions[category] || [];
  }, [category]);

  const formatCarbon = (carbon: number) => {
    if (carbon < 1000) return `${carbon}g CO₂e`;
    return `${(carbon / 1000).toFixed(1)}kg CO₂e`;
  };

  const getCarbonColor = (carbon: number) => {
    if (carbon < 100) return theme.palette.success.main;
    if (carbon < 1000) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <TrendingUp color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Popular {category.charAt(0).toUpperCase() + category.slice(1)} Items
          </Typography>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Click any item to auto-fill your form
        </Typography>

        <Grid container spacing={1}>
          {suggestions.map((suggestion, index) => (
            <Grid size={{ xs: 12, sm: 6 }} key={index}>
              <Chip
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {suggestion.name}
                    </Typography>
                    <Box
                      sx={{
                        px: 1,
                        py: 0.25,
                        borderRadius: 1,
                        backgroundColor: alpha(getCarbonColor(suggestion.carbon), 0.1),
                        color: getCarbonColor(suggestion.carbon),
                        fontSize: '0.75rem',
                        fontWeight: 600
                      }}
                    >
                      {formatCarbon(suggestion.carbon)}
                    </Box>
                  </Box>
                }
                onClick={() => onSelect(suggestion)}
                variant="outlined"
                sx={{
                  width: '100%',
                  height: 'auto',
                  py: 1,
                  px: 2,
                  justifyContent: 'flex-start',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease-in-out',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                    borderColor: theme.palette.primary.main,
                    transform: 'translateY(-1px)',
                    boxShadow: theme.shadows[2]
                  },
                  '&:active': {
                    transform: 'translateY(0)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2
                  },
                  '& .MuiChip-label': {
                    width: '100%',
                    textAlign: 'left'
                  }
                }}
              />
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}
