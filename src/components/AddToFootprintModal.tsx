import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Nature as EcoIcon } from '@mui/icons-material';
import { Product } from '../types';
import userFootprintApi from '../services/userFootprintApi';
import analytics, { EVENTS } from '../services/analytics';

interface AddToFootprintModalProps {
  open: boolean;
  onClose: () => void;
  product: Product | null;
  onSuccess?: (entry: any) => void;
}

const commonUnits = [
  'item',
  'kg',
  'g',
  'liter',
  'ml',
  'pack',
  'bottle',
  'can',
  'box',
  'serving'
];

export default function AddToFootprintModal({
  open,
  onClose,
  product,
  onSuccess
}: AddToFootprintModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [unit, setUnit] = useState<string>('item');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setQuantity(1);
    setUnit('item');
    setError(null);
    onClose();
  };

  const handleAdd = async () => {
    if (!product) return;

    setLoading(true);
    setError(null);

    try {
      const entry = await userFootprintApi.addFromProduct({
        product_id: product.id,
        quantity,
        unit
      });

      // Track successful product addition
      analytics.trackProductAddedToFootprint(
        product.id,
        product.product_name,
        product.carbon_footprint || 0,
        quantity
      );

      onSuccess?.(entry);
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add product to footprint');
    } finally {
      setLoading(false);
    }
  };

  const totalFootprint = product ? (product.carbon_footprint || 0) * quantity : 0;

  return (
    <Dialog 
      open={open} 
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EcoIcon color="success" />
          <Typography variant="h6" component="span">
            Add to My Footprint
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {product && (
          <>
            {/* Product Info */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {product.product_name}
              </Typography>
              
              {product.brands.length > 0 && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Brand:{' '}
                  </Box>
                  {product.brands.slice(0, 2).join(', ')}
                </Typography>
              )}

              {/* Quantity Information */}
              {(product.quantity || (product.product_quantity && product.product_quantity_unit)) && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <Box component="span" sx={{ fontWeight: 600, color: 'text.primary' }}>
                    Package Size:{' '}
                  </Box>
                  {product.quantity || `${product.product_quantity} ${product.product_quantity_unit}`}
                </Typography>
              )}

              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={`🌱 ${userFootprintApi.formatCarbonFootprint(product.carbon_footprint || 0)} per item`}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    borderColor: 'success.main',
                    color: 'success.main'
                  }}
                />
                {product.carbon_footprint_source && (
                  <Chip
                    label={`Source: ${product.carbon_footprint_source}`}
                    size="small"
                    variant="outlined"
                    sx={{ 
                      borderColor: 'info.main',
                      color: 'info.main'
                    }}
                  />
                )}
              </Box>
            </Box>

            {/* Quantity Input */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Quantity
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(0.1, parseFloat(e.target.value) || 0.1))}
                  inputProps={{ 
                    min: 0.1, 
                    step: 0.1,
                    'aria-label': 'Quantity'
                  }}
                  sx={{ flex: 1 }}
                  size="small"
                />
                <FormControl sx={{ minWidth: 120 }} size="small">
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    label="Unit"
                  >
                    {commonUnits.map((unitOption) => (
                      <MenuItem key={unitOption} value={unitOption}>
                        {unitOption}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>

            {/* Carbon Footprint Details */}
            {product.carbon_footprint_details && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Carbon Footprint Breakdown
                </Typography>
                <Box sx={{ p: 1.5, bgcolor: 'grey.50', borderRadius: 1, border: '1px solid', borderColor: 'grey.200' }}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, fontSize: '0.8rem' }}>
                    {product.carbon_footprint_details.agriculture && (
                      <Typography variant="caption" color="text.secondary">
                        🌾 Agriculture: {userFootprintApi.formatCarbonFootprint(product.carbon_footprint_details.agriculture)}
                      </Typography>
                    )}
                    {product.carbon_footprint_details.processing && (
                      <Typography variant="caption" color="text.secondary">
                        🏭 Processing: {userFootprintApi.formatCarbonFootprint(product.carbon_footprint_details.processing)}
                      </Typography>
                    )}
                    {product.carbon_footprint_details.transportation && (
                      <Typography variant="caption" color="text.secondary">
                        🚚 Transport: {userFootprintApi.formatCarbonFootprint(product.carbon_footprint_details.transportation)}
                      </Typography>
                    )}
                    {product.carbon_footprint_details.packaging && (
                      <Typography variant="caption" color="text.secondary">
                        📦 Packaging: {userFootprintApi.formatCarbonFootprint(product.carbon_footprint_details.packaging)}
                      </Typography>
                    )}
                    {product.carbon_footprint_details.distribution && (
                      <Typography variant="caption" color="text.secondary">
                        🏪 Distribution: {userFootprintApi.formatCarbonFootprint(product.carbon_footprint_details.distribution)}
                      </Typography>
                    )}
                  </Box>
                  {product.carbon_footprint_reference && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
                      Reference: {product.carbon_footprint_reference}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Total Footprint Calculation */}
            <Box 
              sx={{ 
                p: 2, 
                bgcolor: 'success.50', 
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'success.200'
              }}
            >
              <Typography variant="subtitle2" color="success.dark" gutterBottom>
                Total Carbon Footprint
              </Typography>
              <Typography variant="h5" color="success.dark" fontWeight="bold">
                {userFootprintApi.formatCarbonFootprint(totalFootprint)}
              </Typography>
              <Typography variant="caption" color="success.dark">
                {quantity} {unit}{quantity !== 1 ? 's' : ''} × {userFootprintApi.formatCarbonFootprint(product.carbon_footprint || 0)} per item
              </Typography>
            </Box>

            {/* Error Display */}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button 
          onClick={handleClose}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          onClick={handleAdd}
          variant="contained"
          color="success"
          disabled={loading || !product}
          startIcon={loading ? <CircularProgress size={16} /> : <AddIcon />}
        >
          {loading ? 'Adding...' : 'Add to Footprint'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
