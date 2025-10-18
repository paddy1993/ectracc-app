import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  Divider
} from '@mui/material';
import {
  QrCodeScanner as ScannerIcon,
  ArrowBack as BackIcon,
  CheckCircle as SuccessIcon
} from '@mui/icons-material';
import CameraScanner from '../components/CameraScanner';
import productApi from '../services/productApi';
import notificationService from '../services/notificationService';
import logger from '../utils/logger';

const ScannerPage: React.FC = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedProduct, setScannedProduct] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Handle barcode scan result
  const handleScan = async (barcode: string) => {
    if (loading) return; // Prevent multiple simultaneous scans
    
    setLoading(true);
    setError('');
    setIsScanning(false); // Stop the scanner UI
    
    try {
      logger.log('🔍 Scanned barcode:', barcode);
      
      // Additional haptic feedback for successful scan
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100]);
      }

      // Look up product by barcode
      const response = await productApi.getProductByBarcode(barcode);
      
      if (response.success && response.data) {
        setScannedProduct(response.data);
        logger.log('✅ Product found:', response.data.product_name);
        
        // Show success notification
        // TODO: Fix notification service templates
        // await notificationService.showLocalNotification(
        //   notificationService.templates.productScanned.title,
        //   {
        //     body: `${response.data.product_name} - Carbon impact calculated!`,
        //     tag: notificationService.templates.productScanned.tag
        //   }
        // );
      } else {
        logger.log('❌ Product not found for barcode:', barcode);
        setError('Product not found in our database. Try scanning again or search manually.');
      }
    } catch (err) {
      console.error('❌ Error looking up product:', err);
      setError('Failed to look up product. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Start scanning
  const startScanning = () => {
    setIsScanning(true);
    setScannedProduct(null);
    setError('');
  };

  // Close scanner
  const closeScanner = () => {
    setIsScanning(false);
  };

  // Navigate to product details
  const viewProductDetails = () => {
    if (scannedProduct) {
      navigate(`/products/${scannedProduct.id}`, { 
        state: { product: scannedProduct } 
      });
    }
  };

  // Add to tracking
  const addToTracking = () => {
    if (scannedProduct) {
      // Navigate to tracker with pre-filled product data
      navigate('/tracker', { 
        state: { 
          product: scannedProduct,
          category: 'food',
          carbonFootprint: scannedProduct.carbon_footprint || 2.5
        } 
      });
    }
  };

  // Go back
  const goBack = () => {
    navigate(-1);
  };

  if (isScanning) {
    return (
      <CameraScanner
        onScan={handleScan}
        onClose={closeScanner}
        isScanning={loading}
      />
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <Button
          startIcon={<BackIcon />}
          onClick={goBack}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Product Scanner
        </Typography>
            </Box>

            {/* Instructions */}
      <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
        <ScannerIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          Automatic Barcode Scanner
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          Point your camera at a product barcode - scanning happens automatically when the barcode is properly aligned
        </Typography>
        
        <Button
          variant="contained"
          size="large"
          startIcon={<ScannerIcon />}
          onClick={startScanning}
          sx={{ mt: 2 }}
        >
          Start Camera Scanner
        </Button>
      </Paper>

      {/* Loading State */}
      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" py={4}>
          <CircularProgress sx={{ mr: 2 }} />
          <Typography>Looking up product...</Typography>
      </Box>
      )}

      {/* Error State */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Scanned Product Result */}
      {scannedProduct && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Box display="flex" alignItems="center" mb={2}>
            <SuccessIcon sx={{ color: 'success.main', mr: 1 }} />
            <Typography variant="h6" color="success.main">
              Product Found!
            </Typography>
          </Box>

          <Typography variant="h5" gutterBottom>
            {scannedProduct.product_name}
          </Typography>

          {scannedProduct.brands && scannedProduct.brands.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Brand:
              </Typography>
              {scannedProduct.brands.map((brand: string, index: number) => (
                <Chip key={index} label={brand} size="small" sx={{ mr: 1 }} />
              ))}
        </Box>
      )}

          {scannedProduct.categories && scannedProduct.categories.length > 0 && (
            <Box mb={2}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Categories:
              </Typography>
              {scannedProduct.categories.slice(0, 3).map((category: string, index: number) => (
                <Chip 
                  key={index} 
                  label={category} 
                  variant="outlined" 
                  size="small" 
                  sx={{ mr: 1, mb: 1 }} 
                />
              ))}
            </Box>
          )}


          <Divider sx={{ my: 2 }} />

          {/* Action Buttons */}
          <Box display="flex" gap={2} flexWrap="wrap">
            <Button
              variant="contained"
              onClick={addToTracking}
              sx={{ flex: 1, minWidth: 140 }}
            >
              Add to Tracking
            </Button>
            <Button
              variant="outlined"
              onClick={viewProductDetails}
              sx={{ flex: 1, minWidth: 140 }}
            >
              View Details
            </Button>
          </Box>

          {/* Scan Another Button */}
          <Button
            variant="text"
            startIcon={<ScannerIcon />}
            onClick={startScanning}
            fullWidth
            sx={{ mt: 2 }}
          >
            Scan Another Product
          </Button>
        </Paper>
      )}

      {/* Enhanced Tips */}
      <Paper sx={{ p: 3, bgcolor: 'grey.50' }}>
        <Typography variant="h6" gutterBottom>
          Auto-Scanning Tips
        </Typography>
        <Box component="ul" sx={{ pl: 2, m: 0 }}>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Automatic Detection:</strong> No need to tap - scanning starts automatically when barcode is aligned
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Steady Position:</strong> Hold your phone steady and keep the barcode centered in the frame
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Good Lighting:</strong> Ensure adequate lighting or use the flash toggle for better results
            </Typography>
          </li>
          <li>
            <Typography variant="body2" paragraph>
              <strong>Distance:</strong> Position your phone 4-8 inches away from the barcode for optimal focus
            </Typography>
          </li>
          <li>
            <Typography variant="body2">
              <strong>Multiple Formats:</strong> Supports UPC, EAN, Code 128, and other common barcode formats
            </Typography>
          </li>
        </Box>
      </Paper>
    </Box>
  );
};

export default ScannerPage;