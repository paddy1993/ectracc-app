import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  Info as InfoIcon,
  Send as SubmitIcon
} from '@mui/icons-material';
import pendingProductApi, { PendingProductSubmission } from '../../services/pendingProductApi';

interface ProductSubmissionFormProps {
  open: boolean;
  onClose: () => void;
  onSubmitted: (submissionId: string) => void;
  initialData: {
    product_name: string;
    barcode?: string;
    carbon_footprint: number;
    user_footprint_entry_id?: string;
  };
}

const ProductSubmissionForm: React.FC<ProductSubmissionFormProps> = ({
  open,
  onClose,
  onSubmitted,
  initialData
}) => {
  const [formData, setFormData] = useState({
    product_name: initialData.product_name,
    barcode: initialData.barcode || '',
    brands: [] as string[],
    categories: [] as string[],
    carbon_footprint: initialData.carbon_footprint,
    carbon_footprint_source: '',
    carbon_footprint_justification: ''
  });

  const [brandInput, setBrandInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddBrand = () => {
    if (brandInput.trim() && !formData.brands.includes(brandInput.trim())) {
      setFormData(prev => ({
        ...prev,
        brands: [...prev.brands, brandInput.trim()]
      }));
      setBrandInput('');
    }
  };

  const handleRemoveBrand = (brand: string) => {
    setFormData(prev => ({
      ...prev,
      brands: prev.brands.filter(b => b !== brand)
    }));
  };

  const handleAddCategory = () => {
    if (categoryInput.trim() && !formData.categories.includes(categoryInput.trim())) {
      setFormData(prev => ({
        ...prev,
        categories: [...prev.categories, categoryInput.trim()]
      }));
      setCategoryInput('');
    }
  };

  const handleRemoveCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.filter(c => c !== category)
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const submission: PendingProductSubmission = {
        product_name: formData.product_name,
        barcode: formData.barcode || undefined,
        brands: formData.brands,
        categories: formData.categories,
        carbon_footprint: formData.carbon_footprint,
        carbon_footprint_source: formData.carbon_footprint_source,
        carbon_footprint_justification: formData.carbon_footprint_justification,
        user_footprint_entry_id: initialData.user_footprint_entry_id
      };

      const result = await pendingProductApi.submitProduct(submission);
      onSubmitted(result.id);
      onClose();
    } catch (error) {
      console.error('Error submitting product:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit product for review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = 
    formData.product_name.trim().length > 0 &&
    formData.carbon_footprint > 0 &&
    formData.carbon_footprint_source.trim().length >= 5 &&
    formData.carbon_footprint_justification.trim().length >= 10;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { minHeight: '60vh' }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <InfoIcon color="primary" />
          <Typography variant="h6">
            Submit Product for Review
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Alert severity="info" sx={{ mb: 3 }}>
          This product doesn't exist in our database. Help us expand our catalog by providing 
          information about its carbon footprint. Your submission will be reviewed by our team 
          before being made available to other users.
        </Alert>

        <Box display="flex" flexDirection="column" gap={3}>
          {/* Product Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Product Information
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Product Name"
                value={formData.product_name}
                onChange={(e) => setFormData(prev => ({ ...prev, product_name: e.target.value }))}
                required
                fullWidth
              />

              <TextField
                label="Barcode (optional)"
                value={formData.barcode}
                onChange={(e) => setFormData(prev => ({ ...prev, barcode: e.target.value }))}
                placeholder="e.g., 1234567890123"
                fullWidth
              />

              {/* Brands */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Brands (optional)
                </Typography>
                <Box display="flex" gap={1} mb={1}>
                  <TextField
                    size="small"
                    placeholder="Enter brand name"
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
                  />
                  <Button onClick={handleAddBrand} disabled={!brandInput.trim()}>
                    Add
                  </Button>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {formData.brands.map((brand) => (
                    <Chip
                      key={brand}
                      label={brand}
                      onDelete={() => handleRemoveBrand(brand)}
                      size="small"
                    />
                  ))}
                </Box>
              </Box>

              {/* Categories */}
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Categories (optional)
                </Typography>
                <Box display="flex" gap={1} mb={1}>
                  <TextField
                    size="small"
                    placeholder="Enter category"
                    value={categoryInput}
                    onChange={(e) => setCategoryInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <Button onClick={handleAddCategory} disabled={!categoryInput.trim()}>
                    Add
                  </Button>
                </Box>
                <Box display="flex" flexWrap="wrap" gap={1}>
                  {formData.categories.map((category) => (
                    <Chip
                      key={category}
                      label={category}
                      onDelete={() => handleRemoveCategory(category)}
                      size="small"
                      variant="outlined"
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider />

          {/* Carbon Footprint Information */}
          <Box>
            <Typography variant="h6" gutterBottom>
              Carbon Footprint Information
            </Typography>
            
            <Box display="flex" flexDirection="column" gap={2}>
              <TextField
                label="Carbon Footprint (kg CO₂e)"
                type="number"
                value={formData.carbon_footprint}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  carbon_footprint: parseFloat(e.target.value) || 0 
                }))}
                required
                inputProps={{ min: 0, step: 0.01 }}
                fullWidth
              />

              <TextField
                label="Carbon Footprint Source"
                value={formData.carbon_footprint_source}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  carbon_footprint_source: e.target.value 
                }))}
                placeholder="e.g., Product packaging, company website, research study"
                required
                fullWidth
                helperText="Where did you find this carbon footprint information?"
              />

              <TextField
                label="Calculation Justification"
                value={formData.carbon_footprint_justification}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  carbon_footprint_justification: e.target.value 
                }))}
                placeholder="Explain how this carbon footprint was calculated or why you believe it's accurate"
                required
                multiline
                rows={4}
                fullWidth
                helperText="Provide details about the calculation method, scope, or reasoning (minimum 10 characters)"
              />
            </Box>
          </Box>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={!isValid || isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={20} /> : <SubmitIcon />}
        >
          {isSubmitting ? 'Submitting...' : 'Submit for Review'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ProductSubmissionForm;
