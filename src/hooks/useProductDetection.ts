import { useState, useCallback } from 'react';
import productApi from '../services/productApi';
import pendingProductApi from '../services/pendingProductApi';

interface ProductDetectionResult {
  exists: boolean;
  product?: any;
  pendingSubmission?: any;
  isLoading: boolean;
  error: string | null;
}

export const useProductDetection = () => {
  const [detectionResult, setDetectionResult] = useState<ProductDetectionResult>({
    exists: false,
    isLoading: false,
    error: null
  });

  const checkProduct = useCallback(async (productName: string, barcode?: string) => {
    if (!productName.trim()) {
      setDetectionResult({
        exists: false,
        isLoading: false,
        error: null
      });
      return;
    }

    setDetectionResult(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    try {
      console.log('🔍 [PRODUCT DETECTION] Checking product:', productName, barcode);

      // First, check if product exists by barcode
      if (barcode) {
        try {
          const barcodeResult = await productApi.getProductByBarcode(barcode);
          if (barcodeResult.success && barcodeResult.data) {
            console.log('✅ [PRODUCT DETECTION] Found product by barcode:', barcodeResult.data.product_name);
            setDetectionResult({
              exists: true,
              product: barcodeResult.data,
              isLoading: false,
              error: null
            });
            return;
          }
        } catch (error) {
          console.log('📝 [PRODUCT DETECTION] Product not found by barcode, checking by name');
        }
      }

      // If not found by barcode, search by name
      try {
        const searchResult = await productApi.searchProducts({ 
          q: productName, 
          limit: 5 
        });
        if (searchResult.data && searchResult.data.length > 0) {
          // Check for exact or close matches
          const exactMatch = searchResult.data.find(p => 
            p.product_name.toLowerCase() === productName.toLowerCase()
          );
          
          const closeMatch = searchResult.data.find(p => 
            p.product_name.toLowerCase().includes(productName.toLowerCase()) ||
            productName.toLowerCase().includes(p.product_name.toLowerCase())
          );

          const foundProduct = exactMatch || closeMatch;
          
          if (foundProduct) {
            console.log('✅ [PRODUCT DETECTION] Found product by name:', foundProduct.product_name);
            setDetectionResult({
              exists: true,
              product: foundProduct,
              isLoading: false,
              error: null
            });
            return;
          }
        }
      } catch (error) {
        console.log('📝 [PRODUCT DETECTION] Product not found by name search');
      }

      // Check if user has already submitted this product
      try {
        const pendingCheck = await pendingProductApi.checkProductExists(barcode, productName);
        if (pendingCheck.exists && pendingCheck.pendingSubmission) {
          console.log('⏳ [PRODUCT DETECTION] Found pending submission:', pendingCheck.pendingSubmission.id);
          setDetectionResult({
            exists: true,
            pendingSubmission: pendingCheck.pendingSubmission,
            isLoading: false,
            error: null
          });
          return;
        }
      } catch (error) {
        console.log('📝 [PRODUCT DETECTION] No pending submissions found');
      }

      // Product not found anywhere
      console.log('❌ [PRODUCT DETECTION] Product not found:', productName);
      setDetectionResult({
        exists: false,
        isLoading: false,
        error: null
      });

    } catch (error) {
      console.error('❌ [PRODUCT DETECTION] Error during detection:', error);
      setDetectionResult({
        exists: false,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to check product'
      });
    }
  }, []);

  const resetDetection = useCallback(() => {
    setDetectionResult({
      exists: false,
      isLoading: false,
      error: null
    });
  }, []);

  return {
    detectionResult,
    checkProduct,
    resetDetection
  };
};
