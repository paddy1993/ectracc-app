import React from 'react';
import { 
  Card, 
  CardContent, 
  Typography, 
  Box, 
  Chip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import { 
  EmojiNature as Eco, 
  CheckCircle, 
  Warning,
  Info
} from '@mui/icons-material';
import BadgePill from '../ui/BadgePill';

interface LivePreviewProps {
  itemName: string;
  amount: string | number;
  unit: string;
  carbonTotal: string | number;
  category: string;
  brand?: string;
  isValid: boolean;
  isCalculated: boolean;
}

export default function LivePreview({
  itemName,
  amount,
  unit,
  carbonTotal,
  category,
  brand,
  isValid,
  isCalculated
}: LivePreviewProps) {
  const theme = useTheme();

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'food': return '🍎';
      case 'transport': return '🚗';
      case 'energy': return '⚡';
      case 'shopping': return '🛍️';
      case 'misc': return '📦';
      default: return '📦';
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'food': return theme.palette.success.main;
      case 'transport': return theme.palette.primary.main;
      case 'energy': return theme.palette.warning.main;
      case 'shopping': return theme.palette.secondary.main;
      case 'misc': return theme.palette.info.main;
      default: return theme.palette.grey[500];
    }
  };

  const formatAmount = (amt: string | number, unt: string) => {
    if (!amt) return '';
    const numAmount = typeof amt === 'string' ? parseFloat(amt) : amt;
    if (isNaN(numAmount)) return '';
    return `${numAmount} ${unt}${numAmount !== 1 ? 's' : ''}`;
  };

  const formatCarbon = (carbon: string | number) => {
    if (!carbon) return 0;
    const numCarbon = typeof carbon === 'string' ? parseFloat(carbon) : carbon;
    return isNaN(numCarbon) ? 0 : numCarbon / 1000; // Convert to kg
  };

  const getStatusIcon = () => {
    if (!itemName || !amount || !carbonTotal) {
      return <Info color="action" />;
    }
    if (isValid) {
      return <CheckCircle color="success" />;
    }
    return <Warning color="warning" />;
  };

  const getStatusMessage = () => {
    if (!itemName) return 'Enter an item name to get started';
    if (!amount) return 'Add amount and unit';
    if (!carbonTotal) return 'Calculate or enter carbon footprint';
    if (isValid) return 'Ready to track!';
    return 'Please check your inputs';
  };

  const getStatusColor = () => {
    if (!itemName || !amount || !carbonTotal) return 'info';
    if (isValid) return 'success';
    return 'warning';
  };

  return (
    <Card 
      sx={{ 
        position: 'sticky',
        top: 80,
        border: `2px solid ${isValid ? theme.palette.success.light : theme.palette.divider}`,
        backgroundColor: isValid 
          ? alpha(theme.palette.success.light, 0.05)
          : theme.palette.background.paper,
        transition: 'all 0.3s ease-in-out'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <Eco color="primary" />
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Live Preview
          </Typography>
        </Box>

        {/* Item Preview */}
        <Box sx={{ mb: 2 }}>
          <Typography 
            variant="h5" 
            sx={{ 
              fontWeight: 600,
              color: itemName ? 'text.primary' : 'text.secondary',
              mb: 1,
              minHeight: '2rem',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {itemName || 'Your Item Name'}
          </Typography>
          
          {brand && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              by {brand}
            </Typography>
          )}

          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
            <Chip
              icon={<span>{getCategoryIcon(category)}</span>}
              label={category.charAt(0).toUpperCase() + category.slice(1)}
              size="small"
              sx={{
                backgroundColor: alpha(getCategoryColor(category), 0.1),
                color: getCategoryColor(category),
                border: `1px solid ${getCategoryColor(category)}`
              }}
            />
            
            {amount && unit && (
              <Chip
                label={formatAmount(amount, unit)}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Carbon Footprint Display */}
        <Box sx={{ textAlign: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Carbon Footprint
          </Typography>
          
          <BadgePill
            value={formatCarbon(carbonTotal)}
            size="medium"
            variant={isValid ? 'success' : 'default'}
            showIcon={true}
          />
          
          {isCalculated && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
              ✨ Calculated automatically
            </Typography>
          )}
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Status */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getStatusIcon()}
          <Typography 
            variant="body2" 
            color={`${getStatusColor()}.main`}
            sx={{ fontWeight: 500 }}
          >
            {getStatusMessage()}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
