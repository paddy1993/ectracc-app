import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Divider,
  IconButton,
  Snackbar,
  useTheme,
  useMediaQuery
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack,
  Calculate as CalculateIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import LivePreview from '../components/tracker/LivePreview';
import StickyCTA from '../components/tracker/StickyCTA';
import SmartSuggestions from '../components/tracker/SmartSuggestions';
import EmptyState from '../components/ui/EmptyState';
import ProductSubmissionForm from '../components/tracker/ProductSubmissionForm';
import { TrackFootprintForm } from '../types';
import carbonApi from '../services/carbonApi';
import { useApp } from '../contexts/AppContext';
import { useProductDetection } from '../hooks/useProductDetection';

export default function TrackerPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isOnline } = useApp();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // Form state - using strings for controlled inputs
  const [formData, setFormData] = useState({
    manual_item: '',
    amount: '',
    carbon_total: '',
    category: 'food',
    unit: 'item',
    brand: ''
  });
  
  // Submit status state
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'submitting' | 'synced' | 'queued'>('idle');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Load pre-filled data from URL params (from product detail page)
  useEffect(() => {
    const barcode = searchParams.get('barcode');
    const name = searchParams.get('name');
    const carbon = searchParams.get('carbon');
    const category = searchParams.get('category');
    
    if (name || barcode) {
      setFormData(prev => ({
        ...prev,
        manual_item: name || '',
        carbon_total: carbon ? parseFloat(carbon).toString() : '',
        category: (category as any) || 'food',
        amount: '100' // Default 100g for products
      }));
      setCalculated(!!carbon);
    }
  }, [searchParams]);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [calculated, setCalculated] = useState(false);
  
  // Product detection and submission
  const { detectionResult, checkProduct, resetDetection } = useProductDetection();
  const [showSubmissionForm, setShowSubmissionForm] = useState(false);
  const [lastFootprintEntryId, setLastFootprintEntryId] = useState<string | null>(null);

  // Validation and preview logic
  const isValidForm = useMemo(() => {
    const hasName = formData.manual_item.trim().length > 0;
    const hasAmount = formData.amount && parseFloat(formData.amount) > 0;
    const hasCarbon = formData.carbon_total && parseFloat(formData.carbon_total) > 0;
    return hasName && hasAmount && hasCarbon;
  }, [formData]);

  const canCalculate = useMemo(() => {
    const hasName = formData.manual_item.trim().length > 0;
    const hasAmount = formData.amount && parseFloat(formData.amount) > 0;
    return hasName && hasAmount;
  }, [formData]);

  // Carbon footprint calculation presets (grams CO₂e per unit)
  const carbonPresets = {
    food: {
      // Meat & Protein
      'Pork (200g)': { amount: 200, carbon: 3800 },
      'Chicken (180g)': { amount: 180, carbon: 2800 },
      'Lamb (100g)': { amount: 100, carbon: 3900 },
      'Salmon (100g)': { amount: 100, carbon: 1400 },
      'Tuna (100g)': { amount: 100, carbon: 1800 },
      'Tofu (100g)': { amount: 100, carbon: 530 },
      'Carton of Eggs (6 large eggs)': { amount: 6, carbon: 2000 },
      
      // Dairy
      'Cow\'s Milk, global average (1 pint/16 oz)': { amount: 568, carbon: 1500 },
      'Cheddar cheese (60g)': { amount: 60, carbon: 520 },
      'Mozzarella (60g)': { amount: 60, carbon: 270 },
      
      // Fruits & Vegetables
      'Apple, local and seasonal (1 medium)': { amount: 180, carbon: 32 },
      'Banana (1 medium)': { amount: 120, carbon: 110 },
      'Avocado (1 medium)': { amount: 150, carbon: 150 },
      'Potatoes (100g)': { amount: 100, carbon: 130 },
      'Rice (100g)': { amount: 100, carbon: 400 },
      'Asparagus (250g)': { amount: 250, carbon: 270 },
      
      // Beverages
      'Black Coffee, instant (1 cup)': { amount: 240, carbon: 49 },
      'Latte (1 cup)': { amount: 240, carbon: 280 },
      'Black tea (1 cup)': { amount: 240, carbon: 22 },
      'Beer (1 pint)': { amount: 568, carbon: 500 },
      'Wine (125ml)': { amount: 125, carbon: 1100 },
      
      // Processed Foods
      'Loaf of bread, average (800g)': { amount: 800, carbon: 815 },
      'Ice cream (100g)': { amount: 100, carbon: 740 },
      'Strawberries (250g)': { amount: 250, carbon: 490 }
    },
    transport: {
      'Car - Petrol (1 km)': { amount: 1, carbon: 180 },
      'Car - Diesel (1 km)': { amount: 1, carbon: 165 },
      'Car - Electric (1 km)': { amount: 1, carbon: 50 },
      'Bus (1 km)': { amount: 1, carbon: 89 },
      'Train (1 km)': { amount: 1, carbon: 41 },
      'Flight - Domestic (1 km)': { amount: 1, carbon: 255 },
      'Flight - International (1 km)': { amount: 1, carbon: 195 },
      'Bike/Walk (1 km)': { amount: 1, carbon: 0 },
      
      // Vehicles (manufacturing)
      'Citroen C1 (new car)': { amount: 1, carbon: 4100000 },
      'Ford Mondeo (new car)': { amount: 1, carbon: 11600000 },
      'Toyota Prius (new car)': { amount: 1, carbon: 11700000 },
      'Range Rover Sport (new car)': { amount: 1, carbon: 35000000 }
    },
    energy: {
      'Electricity (1 kWh)': { amount: 1, carbon: 820 },
      'Natural Gas (1 kWh)': { amount: 1, carbon: 200 },
      'Heating Oil (1 liter)': { amount: 1, carbon: 2500 },
      'Gasoline (50 liters)': { amount: 50, carbon: 171000 },
      'Diesel (50 liters)': { amount: 50, carbon: 181000 },
      'LPG (50 liters)': { amount: 50, carbon: 158000 }
    },
    shopping: {
      // Clothing
      'Cotton T-shirt': { amount: 1, carbon: 2400 },
      'Jeans (cotton)': { amount: 1, carbon: 1600 },
      'Leather shoes': { amount: 1, carbon: 11400 },
      'Rubber shoes': { amount: 1, carbon: 8000 },
      
      // Electronics & Tech
      'Smartphone': { amount: 1, carbon: 70000 },
      'Laptop': { amount: 1, carbon: 300000 },
      'HP Chromebook (1kg)': { amount: 1, carbon: 3200 },
      
      // Materials & Items
      'Plastic carrier bag': { amount: 1, carbon: 10 },
      'Paper book': { amount: 1, carbon: 4500 },
      'Gold jewelry (£500)': { amount: 1, carbon: 2500000 },
      'Wool carpet (4m x 4m)': { amount: 1, carbon: 700000 }
    },
    misc: {
      'Plastic bottle (1L)': { amount: 1, carbon: 400 },
      'Paper coffee cup': { amount: 1, carbon: 11 },
      'Aluminum can': { amount: 1, carbon: 170 },
      'Newspaper (daily)': { amount: 1, carbon: 220 },
      'Letter (recycled paper)': { amount: 1, carbon: 2800 },
      'Letter (new paper)': { amount: 1, carbon: 5500 },
      'Cement (200g)': { amount: 200, carbon: 2400 },
      'Steel (1kg)': { amount: 1000, carbon: 2400 },
      'Plastic bottles (1kg)': { amount: 1000, carbon: 2400 }
    }
  };

  // Handle form field changes
  const handleInputChange = (field: keyof TrackFootprintForm) => (event: any) => {
    let value = event.target.value;
    
    // For numeric fields, keep as string to allow empty values, but validate on submit
    if (field === 'amount' || field === 'carbon_total') {
      // Allow empty string or valid numbers
      if (value === '' || (!isNaN(parseFloat(value)) && isFinite(value))) {
        // Keep as string for display, will convert to number on submit
        value = value;
      } else {
        return; // Don't update if invalid number
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (field === 'category') {
      setCalculated(false);
    }
    
    // Check for existing products when user types product name
    if (field === 'manual_item' && value.trim().length > 2) {
      // Debounce the product check
      setTimeout(() => {
        checkProduct(value.trim());
      }, 500);
    } else if (field === 'manual_item') {
      resetDetection();
    }
    
    if (error) setError(null);
    if (success) setSuccess(false);
  };

  // Apply a carbon preset
  const applyPreset = (itemName: string, preset: { amount: number; carbon: number }) => {
    setFormData(prev => ({
      ...prev,
      manual_item: itemName,
      amount: preset.amount.toString(),
      carbon_total: preset.carbon.toString()
    }));
    setCalculated(true);
  };

  // Handle smart suggestion selection
  const handleSuggestionSelect = (suggestion: { name: string; amount: number; carbon: number; unit: string; category: string }) => {
    setFormData(prev => ({
      ...prev,
      manual_item: suggestion.name,
      amount: suggestion.amount.toString(),
      carbon_total: suggestion.carbon.toString(),
      unit: suggestion.unit,
      category: suggestion.category
    }));
    setCalculated(true);
    setError(null);
  };

  // Calculate carbon footprint (simplified calculation for demo)
  const calculateCarbon = () => {
    if (!formData.manual_item.trim()) {
      setError('Please enter an item name');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Simple calculation based on category and amount
    let carbonPerUnit = 100; // Default 100g CO₂e per unit
    
    switch (formData.category) {
      case 'food':
        carbonPerUnit = 200; // 200g CO₂e per unit for food
        break;
      case 'transport':
        carbonPerUnit = 150; // 150g CO₂e per km
        break;
      case 'energy':
        carbonPerUnit = 500; // 500g CO₂e per kWh
        break;
      case 'shopping':
        carbonPerUnit = 5000; // 5kg CO₂e per item
        break;
      case 'misc':
        carbonPerUnit = 50; // 50g CO₂e per item
        break;
    }
    
    const calculatedCarbon = amount * carbonPerUnit;
    setFormData(prev => ({
      ...prev,
      carbon_total: Math.round(calculatedCarbon).toString()
    }));
    setCalculated(true);
  };

  // Submit the footprint entry
  const handleSubmit = async () => {
    if (!formData.manual_item.trim()) {
      setError('Please enter an item name');
      return;
    }

    const amount = parseFloat(formData.amount);
    if (!formData.amount || isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const carbonTotal = parseFloat(formData.carbon_total);
    if (!formData.carbon_total || isNaN(carbonTotal) || carbonTotal <= 0) {
      setError('Please calculate or enter a valid carbon footprint');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Convert string values to numbers for API
      const submitData: TrackFootprintForm = {
        manual_item: formData.manual_item,
        amount: parseFloat(formData.amount),
        carbon_total: parseFloat(formData.carbon_total),
        category: formData.category as any,
        unit: formData.unit,
        brand: formData.brand
      };
      
      const result = await carbonApi.trackFootprint(submitData);
      
      // Store the footprint entry ID for potential product submission
      if (result.id) {
        setLastFootprintEntryId(result.id);
      }
      
      // Check if request was queued for offline sync
      if (result.id?.startsWith('offline-')) {
        setSubmitStatus('queued');
        setSnackbarMessage('📡 Footprint queued for sync when online');
        setSnackbarOpen(true);
        
        // Clear form after short delay
        setTimeout(() => {
          setFormData({
            manual_item: '',
            amount: '',
            carbon_total: '',
            category: 'food',
            unit: 'item',
            brand: ''
          });
          setCalculated(false);
          setSubmitStatus('idle');
        }, 3000);
      } else {
        setSubmitStatus('synced');
        setSuccess(true);
        setSnackbarMessage('✅ Footprint logged successfully');
        setSnackbarOpen(true);
        
        // Check if product doesn't exist and offer submission
        if (!detectionResult.exists && !detectionResult.isLoading) {
          setTimeout(() => {
            setShowSubmissionForm(true);
          }, 1000);
        }
        
        // Reset form after successful submission
        setTimeout(() => {
          setFormData({
            manual_item: '',
            amount: '',
            carbon_total: '',
            category: 'food',
            unit: 'item',
            brand: ''
          });
          setCalculated(false);
          setSuccess(false);
          setSubmitStatus('idle');
          resetDetection();
        }, 2000);
      }
      
    } catch (error: any) {
      setError(error.message || 'Failed to track footprint');
      setSubmitStatus('idle');
    } finally {
      setLoading(false);
    }
  };

  // Handle product submission form
  const handleProductSubmitted = (submissionId: string) => {
    setSnackbarMessage('🎉 Product submitted for review! You\'ll be notified when it\'s approved.');
    setSnackbarOpen(true);
    setShowSubmissionForm(false);
    setLastFootprintEntryId(null);
  };

  const handleCloseSubmissionForm = () => {
    setShowSubmissionForm(false);
    setLastFootprintEntryId(null);
  };

  const currentPresets = carbonPresets[formData.category as keyof typeof carbonPresets] || {};

  return (
    <Container maxWidth="xl" sx={{ mt: 1, mb: isMobile ? 10 : 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <IconButton 
          onClick={() => navigate('/dashboard')} 
          sx={{ 
            mr: 1,
            '&:focus-visible': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: 2
            }
          }}
        >
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Manual Entry
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Calculate and track your carbon footprint for any product or activity
      </Typography>

      {/* Success Message */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Carbon footprint logged successfully! Your dashboard has been updated.
        </Alert>
      )}

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Smart Suggestions */}
      <SmartSuggestions
        category={formData.category}
        onSelect={handleSuggestionSelect}
        currentItem={formData.manual_item}
      />

      <Grid container spacing={3}>
        {/* Main Form */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add Manual Entry
              </Typography>

              {/* Item Name */}
              <TextField
                fullWidth
                label="Product or Item"
                value={formData.manual_item}
                onChange={handleInputChange('manual_item')}
                placeholder="e.g., Organic milk, Whole wheat bread, Bananas"
                margin="normal"
                required
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:focus-within': {
                      '& fieldset': {
                        borderColor: theme.palette.primary.main,
                        borderWidth: 2
                      }
                    }
                  }
                }}
              />

              {/* Product Detection Status */}
              {formData.manual_item.trim().length > 2 && (
                <Box sx={{ mt: 1, mb: 2 }}>
                  {detectionResult.isLoading && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Checking if product exists...
                      </Typography>
                    </Box>
                  )}
                  
                  {detectionResult.exists && detectionResult.product && (
                    <Alert severity="info" sx={{ py: 1 }}>
                      <Typography variant="body2">
                        <strong>Found existing product:</strong> {detectionResult.product.product_name}
                        <br />
                        <small>Carbon footprint: {detectionResult.product.carbon_footprint} kg CO₂e</small>
                      </Typography>
                    </Alert>
                  )}
                  
                  {detectionResult.exists && detectionResult.pendingSubmission && (
                    <Alert severity="warning" sx={{ py: 1 }}>
                      <Typography variant="body2">
                        <strong>Pending Review:</strong> You've already submitted this product for review.
                        <br />
                        <small>Status: {detectionResult.pendingSubmission.status}</small>
                      </Typography>
                    </Alert>
                  )}
                  
                  {!detectionResult.exists && !detectionResult.isLoading && formData.manual_item.trim().length > 2 && (
                    <Alert severity="info" sx={{ py: 1 }}>
                      <Typography variant="body2">
                        <strong>New Product:</strong> This product isn't in our database yet. 
                        After logging your footprint, you can help us by submitting it for review!
                      </Typography>
                    </Alert>
                  )}
                </Box>
              )}

              {/* Category */}
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={formData.category}
                  onChange={handleInputChange('category')}
                  label="Category"
                >
                  <MenuItem value="food">🍎 Food & Drinks</MenuItem>
                  <MenuItem value="transport">🚗 Transport</MenuItem>
                  <MenuItem value="energy">⚡ Energy & Utilities</MenuItem>
                  <MenuItem value="shopping">🛍️ Shopping</MenuItem>
                  <MenuItem value="misc">📦 Miscellaneous</MenuItem>
                </Select>
              </FormControl>

              {/* Brand */}
              <TextField
                fullWidth
                label="Brand (Optional)"
                value={formData.brand}
                onChange={handleInputChange('brand')}
                margin="normal"
                helperText="Enter the brand name if applicable"
              />

              {/* Amount and Unit */}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={handleInputChange('amount')}
                  required
                  inputProps={{ 
                    min: 0.1, 
                    step: 0.1,
                    placeholder: "0"
                  }}
                  placeholder="Enter amount"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:focus-within': {
                        '& fieldset': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2
                        }
                      }
                    }
                  }}
                />
                <FormControl sx={{ minWidth: 120 }} required>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={formData.unit}
                    onChange={handleInputChange('unit')}
                    label="Unit"
                  >
                    <MenuItem value="item">item</MenuItem>
                    <MenuItem value="kg">kg</MenuItem>
                    <MenuItem value="g">g</MenuItem>
                    <MenuItem value="liter">liter</MenuItem>
                    <MenuItem value="ml">ml</MenuItem>
                    <MenuItem value="pack">pack</MenuItem>
                    <MenuItem value="bottle">bottle</MenuItem>
                    <MenuItem value="can">can</MenuItem>
                    <MenuItem value="box">box</MenuItem>
                    <MenuItem value="serving">serving</MenuItem>
                    <MenuItem value="km">km</MenuItem>
                    <MenuItem value="mile">mile</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              {/* Carbon Total */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'end', mt: 2 }}>
                <TextField
                  fullWidth
                  label="Carbon Footprint (grams CO₂e)"
                  type="number"
                  value={formData.carbon_total}
                  onChange={handleInputChange('carbon_total')}
                  required
                  inputProps={{ 
                    min: 0, 
                    step: 1,
                    placeholder: "0"
                  }}
                  placeholder="Enter carbon footprint"
                  helperText={calculated ? "✨ Calculated automatically" : "Enter manually or calculate"}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '&:focus-within': {
                        '& fieldset': {
                          borderColor: theme.palette.primary.main,
                          borderWidth: 2
                        }
                      }
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  startIcon={<CalculateIcon />}
                  onClick={calculateCarbon}
                  sx={{ mb: 3 }}
                >
                  Calculate
                </Button>
              </Box>

              {/* Carbon Display */}
              {formData.carbon_total && parseFloat(formData.carbon_total) > 0 && (
                <Box sx={{ mt: 2, p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                  <Typography variant="h6" color="success.dark">
                    {(parseFloat(formData.carbon_total) / 1000).toFixed(2)}kg CO₂e
                  </Typography>
                  <Typography variant="body2" color="success.dark">
                    Estimated carbon footprint for this product
                  </Typography>
                </Box>
              )}

              {/* Submit Status Indicator */}
              {submitStatus === 'queued' && (
                <Alert severity="warning" sx={{ mt: 2 }}>
                  📡 This footprint will be synced when you're back online
                </Alert>
              )}
              
              {!isOnline && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  🔄 You're offline. Footprints will be queued for sync when connection is restored.
                </Alert>
              )}

              {/* Submit Button */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                  onClick={handleSubmit}
                  disabled={loading || !formData.manual_item.trim() || !formData.carbon_total || parseFloat(formData.carbon_total) <= 0}
                  size="large"
                >
                  {loading ? (submitStatus === 'submitting' ? 'Saving...' : 'Processing...') : 'Track Footprint'}
                </Button>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/dashboard')}
                  size="large"
                >
                  Cancel
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Live Preview - Desktop Only */}
        {!isMobile && (
          <Grid size={{ xs: 12, md: 4 }}>
            <LivePreview
              itemName={formData.manual_item}
              amount={formData.amount}
              unit={formData.unit}
              carbonTotal={formData.carbon_total}
              category={formData.category}
              brand={formData.brand}
              isValid={Boolean(isValidForm)}
              isCalculated={calculated}
            />
          </Grid>
        )}
      </Grid>

      {/* Mobile Sticky CTA */}
      <StickyCTA
        onCalculate={calculateCarbon}
        onSubmit={handleSubmit}
        canCalculate={Boolean(canCalculate)}
        canSubmit={Boolean(isValidForm)}
        isCalculated={calculated}
        isSubmitting={loading}
        carbonTotal={formData.carbon_total}
        itemName={formData.manual_item}
      />

      {/* Product Submission Form */}
      {showSubmissionForm && (
        <ProductSubmissionForm
          open={showSubmissionForm}
          onClose={handleCloseSubmissionForm}
          onSubmitted={handleProductSubmitted}
          initialData={{
            product_name: formData.manual_item,
            carbon_footprint: parseFloat(formData.carbon_total) || 0,
            user_footprint_entry_id: lastFootprintEntryId || undefined
          }}
        />
      )}

      {/* Snackbar for status messages */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Container>
  );
}
