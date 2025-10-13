import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Snackbar
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack,
  Add as AddIcon,
  QrCodeScanner,
  EmojiNature as Eco,
  LocalFireDepartment as CaloriesIcon,
  Clear
} from '@mui/icons-material';
import { Product } from '../types';
import productApi, { ProductApiService } from '../services/productApi';
import AddToFootprintModal from '../components/AddToFootprintModal';

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

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [alternatives, setAlternatives] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [alternativesLoading, setAlternativesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Add to footprint modal state
  const [addToFootprintModalOpen, setAddToFootprintModalOpen] = useState(false);
  const [footprintSuccessMessage, setFootprintSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError('Product ID not provided');
      setLoading(false);
      return;
    }

    loadProduct(id);
  }, [id]);

  const loadProduct = async (productId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Try to get random products first (no search query required)
      let foundProduct = null;
      
      try {
        const randomResult = await productApi.getRandomProducts(100);
        foundProduct = randomResult.data.find(p => p.id === productId);
      } catch (randomError) {
        console.log('Random products failed, trying search approach');
      }
      
      // If not found in random products, try a broad search
      if (!foundProduct) {
        try {
          const searchResult = await productApi.searchProducts({ q: 'milk', limit: 100 });
          foundProduct = searchResult.data.find(p => p.id === productId);
        } catch (searchError) {
          console.log('Search failed, trying another approach');
        }
      }
      
      // If still not found, try searching for common terms
      if (!foundProduct) {
        const commonTerms = ['food', 'product', 'organic', 'natural'];
        for (const term of commonTerms) {
          try {
            const searchResult = await productApi.searchProducts({ q: term, limit: 100 });
            foundProduct = searchResult.data.find(p => p.id === productId);
            if (foundProduct) break;
          } catch (error) {
            continue;
          }
        }
      }
      
      if (!foundProduct) {
        setError('Product not found. The product may have been removed or the link is invalid.');
        return;
      }

      setProduct(foundProduct);
      
      // Load alternatives
      loadAlternatives(productId);
    } catch (error: any) {
      setError(error.message || 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const loadAlternatives = async (productId: string) => {
    setAlternativesLoading(true);
    try {
      // TODO: Implement getProductAlternatives method
      // const alts = await productApi.getProductAlternatives(productId);
      setAlternatives([]);
    } catch (error) {
      console.error('Failed to load alternatives:', error);
    } finally {
      setAlternativesLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleAddToFootprint = () => {
    setAddToFootprintModalOpen(true);
  };

  const handleFootprintModalClose = () => {
    setAddToFootprintModalOpen(false);
  };

  const handleFootprintSuccess = (entry: any) => {
    setFootprintSuccessMessage(`Added ${entry.product_name} to your footprint!`);
  };

  const handleScanAnother = () => {
    navigate('/scanner');
  };

  const handleLogToFootprint = () => {
    if (!product) return;
    
    // Navigate to tracker with pre-filled product data
    const params = new URLSearchParams({
      barcode: product.code || '',
      name: product.product_name,
      carbon: (product.carbon_footprint || 0).toString(),
      category: 'food' // Default category, user can change
    });
    navigate(`/tracker?${params.toString()}`);
  };

  const handleAlternativeClick = (alternative: Product) => {
    navigate(`/products/${alternative.id}`);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4, textAlign: 'center' }}>
        <CircularProgress size={48} />
        <Typography variant="body1" sx={{ mt: 2 }}>
          Loading product details...
        </Typography>
      </Container>
    );
  }

  if (error || !product) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error || 'Product not found'}
        </Alert>
        <Button variant="outlined" onClick={handleBack} startIcon={<ArrowBack />}>
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
          Product Details
        </Typography>
      </Box>

      {/* Main Product Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 3 }}>
          {/* Product Name & Brand */}
          <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600 }}>
            {product.product_name}
          </Typography>
          
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {product.brands.join(', ')}
          </Typography>

          {/* Categories */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Categories:
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {product.categories.map((category, index) => (
                <Chip
                  key={index}
                  label={category}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>

          {/* Carbon Impact */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {/* Carbon Footprint */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Eco sx={{ fontSize: 32, color: 'success.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Carbon Footprint
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'success.main' }}>
                    {ProductApiService.formatCarbonFootprint(product.carbon_footprint)}
                  </Typography>
                  {product.carbon_footprint && (
                    <Typography variant="caption" color="text.secondary">
                      per 100g
                    </Typography>
                  )}
                  {product.source_database && (
                    <Box sx={{ mt: 1 }}>
                      <Chip
                        label={`${getSourceIcon(product.source_database)} ${getSourceLabel(product.source_database)}`}
                        size="small"
                        sx={{
                          bgcolor: getSourceColor(product.source_database),
                          color: 'white',
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>

            {/* Carbon Footprint per KG */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Card variant="outlined">
                <CardContent sx={{ textAlign: 'center' }}>
                  <Eco sx={{ fontSize: 32, color: 'info.main', mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    Carbon per KG
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, color: 'info.main' }}>
                    {product.carbon_footprint ? 
                      ProductApiService.formatCarbonFootprint(product.carbon_footprint * 10) : 
                      'Not available'
                    }
                  </Typography>
                  {product.carbon_footprint && (
                    <Typography variant="caption" color="text.secondary">
                      per kilogram
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Barcode */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Barcode:
            </Typography>
            <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
              {product.code}
            </Typography>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              color="success"
              size="large"
              startIcon={<AddIcon />}
              onClick={handleAddToFootprint}
              sx={{ minWidth: 200 }}
            >
              Add to My Footprint
            </Button>
            <Button
              variant="outlined"
              size="large"
              startIcon={<QrCodeScanner />}
              onClick={handleScanAnother}
            >
              Scan Another
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Nutrition Information */}
      {product.nutrition_info && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
              <CaloriesIcon sx={{ mr: 1 }} />
              Nutrition Information (per 100g)
            </Typography>
            
            <TableContainer>
              <Table size="small">
                <TableBody>
                  {product.nutrition_info.energy_100g && (
                    <TableRow>
                      <TableCell>Energy</TableCell>
                      <TableCell align="right">
                        {(product.nutrition_info.energy_100g / 4.184).toFixed(0)} kcal 
                        ({product.nutrition_info.energy_100g}kJ)
                      </TableCell>
                    </TableRow>
                  )}
                  {product.nutrition_info.fat_100g !== undefined && (
                    <TableRow>
                      <TableCell>Fat</TableCell>
                      <TableCell align="right">{product.nutrition_info.fat_100g}g</TableCell>
                    </TableRow>
                  )}
                  {product.nutrition_info.saturated_fat_100g !== undefined && (
                    <TableRow>
                      <TableCell sx={{ pl: 4 }}>- of which saturated</TableCell>
                      <TableCell align="right">{product.nutrition_info.saturated_fat_100g}g</TableCell>
                    </TableRow>
                  )}
                  {product.nutrition_info.carbohydrates_100g !== undefined && (
                    <TableRow>
                      <TableCell>Carbohydrates</TableCell>
                      <TableCell align="right">{product.nutrition_info.carbohydrates_100g}g</TableCell>
                    </TableRow>
                  )}
                  {product.nutrition_info.sugars_100g !== undefined && (
                    <TableRow>
                      <TableCell sx={{ pl: 4 }}>- of which sugars</TableCell>
                      <TableCell align="right">{product.nutrition_info.sugars_100g}g</TableCell>
                    </TableRow>
                  )}
                  {product.nutrition_info.proteins_100g !== undefined && (
                    <TableRow>
                      <TableCell>Protein</TableCell>
                      <TableCell align="right">{product.nutrition_info.proteins_100g}g</TableCell>
                    </TableRow>
                  )}
                  {product.nutrition_info.salt_100g !== undefined && (
                    <TableRow>
                      <TableCell>Salt</TableCell>
                      <TableCell align="right">{product.nutrition_info.salt_100g}g</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Suggested Alternatives */}
      {alternatives.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Suggested Alternatives
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Similar products with better environmental impact
            </Typography>
            
            <Grid container spacing={2}>
              {alternatives.map((alternative) => (
                <Grid size={{ xs: 12, sm: 6 }} key={alternative.id}>
                  <Card
                    variant="outlined"
                    sx={{
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      '&:hover': {
                        boxShadow: 2,
                        transform: 'translateY(-2px)'
                      }
                    }}
                    onClick={() => handleAlternativeClick(alternative)}
                  >
                    <CardContent>
                      <Typography variant="subtitle1" gutterBottom noWrap>
                        {alternative.product_name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {alternative.brands.join(', ')}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Chip
                          label={alternative.ecoscore_grade}
                          size="small"
                                                  sx={{
                          bgcolor: ProductApiService.getEcoScoreColor(alternative.ecoscore_grade),
                            color: 'white'
                          }}
                        />
                        {alternative.carbon_footprint && (
                          <Chip
                            label={ProductApiService.formatCarbonFootprint(alternative.carbon_footprint)}
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      )}
      
      {alternativesLoading && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <CircularProgress size={24} />
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Loading alternatives...
          </Typography>
        </Box>
      )}

      {/* Add to Footprint Modal */}
      <AddToFootprintModal
        open={addToFootprintModalOpen}
        onClose={handleFootprintModalClose}
        product={product}
        onSuccess={handleFootprintSuccess}
      />

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
