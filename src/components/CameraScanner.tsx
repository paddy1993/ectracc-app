import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Alert,
  CircularProgress
} from '@mui/material';
import { useContinuousScanner } from '../hooks/useContinuousScanner';
import ScannerOverlay from './scanner/ScannerOverlay';
import ScannerControls from './scanner/ScannerControls';
import {
  getOptimalCameraConstraints,
  analyzeCameraCapabilities,
  toggleCameraFlash,
  applyCameraFocus,
  validateBarcode,
  triggerHapticFeedback,
  checkCameraSupport,
  requestCameraPermission
} from '../utils/scannerUtils';

interface CameraScannerProps {
  onScan: (barcode: string) => void;
  onClose?: () => void;
  isScanning?: boolean;
}

const CameraScanner: React.FC<CameraScannerProps> = ({ 
  onScan, 
  onClose, 
  isScanning = false 
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isLoading, setIsLoading] = useState(true);
  const [detectedBarcode, setDetectedBarcode] = useState<string>('');
  const [cameraCapabilities, setCameraCapabilities] = useState<any>(null);

  // Handle successful barcode scan
  const handleBarcodeDetected = useCallback((barcode: string) => {
    // Validate the barcode
    if (!validateBarcode(barcode)) {
      console.debug('Invalid barcode detected:', barcode);
      return;
    }

    setDetectedBarcode(barcode);
    triggerHapticFeedback('success');
    
    // Brief delay to show success state, then call onScan
    setTimeout(() => {
      onScan(barcode);
    }, 800);
  }, [onScan]);

  // Handle scanning errors
  const handleScanError = useCallback((errorMessage: string) => {
    console.debug('Scan error:', errorMessage);
    // Don't show errors for common "not found" cases
    if (!errorMessage.includes('No MultiFormat Readers')) {
      setError(errorMessage);
    }
  }, []);

  // Initialize continuous scanner
  const {
    isScanning: isContinuousScanning,
    scanAttempts,
    startScanning,
    stopScanning,
    resetScanner
  } = useContinuousScanner({
    onScan: handleBarcodeDetected,
    onError: handleScanError,
    scanInterval: 150, // 6-7 FPS for good balance
    debounceTime: 2000 // 2 seconds between same barcode scans
  });

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      setIsLoading(true);
      setError('');

      // Check camera support first
      if (!checkCameraSupport()) {
        throw new Error('Camera not supported on this device');
      }

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      // Get optimal constraints
      const constraints = getOptimalCameraConstraints(facingMode);
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play();
      }

      // Analyze camera capabilities
      const capabilities = await analyzeCameraCapabilities(mediaStream);
      setCameraCapabilities(capabilities);
      setHasFlash(capabilities.hasFlash);

      setIsLoading(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown camera error';
      
      if (errorMessage.includes('Permission denied') || errorMessage.includes('NotAllowedError')) {
        setError('Camera permission denied. Please allow camera access and try again.');
      } else if (errorMessage.includes('NotFoundError')) {
        setError('No camera found on this device.');
      } else {
        setError('Unable to access camera. Please check permissions and try again.');
      }
      
      setIsLoading(false);
    }
  }, [facingMode, stream]);

  // Toggle flash
  const toggleFlash = useCallback(async () => {
    if (stream && hasFlash) {
      const success = await toggleCameraFlash(stream, !flashEnabled);
      if (success) {
        setFlashEnabled(!flashEnabled);
      }
    }
  }, [stream, hasFlash, flashEnabled]);

  // Switch camera
  const switchCamera = useCallback(() => {
    stopScanning(); // Stop scanning when switching cameras
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  }, [facingMode, stopScanning]);

  // Manual focus
  const handleFocus = useCallback(async () => {
    if (stream) {
      await applyCameraFocus(stream);
      triggerHapticFeedback('light');
    }
  }, [stream]);

  // Handle video loaded - start continuous scanning automatically
  const handleVideoLoaded = useCallback(() => {
    setIsLoading(false);
    
    // Start continuous scanning automatically when video is ready
    if (videoRef.current && !isContinuousScanning) {
      // Small delay to ensure video is fully ready
      setTimeout(() => {
        if (videoRef.current) {
          startScanning(videoRef.current);
        }
      }, 500);
    }
  }, [isContinuousScanning, startScanning]);

  // Initialize camera on mount and when facing mode changes
  useEffect(() => {
    startCamera();
    
    return () => {
      stopScanning();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode, startCamera, stopScanning]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      resetScanner();
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [resetScanner, stream]);

  // Error state
  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center"
        height="100vh"
        bgcolor="black"
        color="white"
        p={3}
      >
        <Alert 
          severity="error" 
          sx={{ 
            mb: 3,
            bgcolor: 'rgba(244, 67, 54, 0.1)',
            color: 'white',
            '& .MuiAlert-icon': { color: 'error.main' }
          }}
        >
          {error}
        </Alert>
        <Typography variant="body2" color="white" textAlign="center" sx={{ mb: 2 }}>
          Make sure camera permissions are enabled and try again.
        </Typography>
        <Box display="flex" gap={2}>
          <button 
            onClick={startCamera}
            style={{
              padding: '12px 24px',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          {onClose && (
            <button 
              onClick={onClose}
              style={{
                padding: '12px 24px',
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: 'white',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Close
            </button>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box 
      position="relative" 
      width="100%" 
      height="100vh" 
      bgcolor="black"
      display="flex"
      flexDirection="column"
      overflow="hidden"
    >
      {/* Scanner Controls */}
      <ScannerControls
        hasFlash={hasFlash}
        flashEnabled={flashEnabled}
        onToggleFlash={toggleFlash}
        onSwitchCamera={switchCamera}
        onClose={onClose}
        onFocus={cameraCapabilities?.supportsFocus ? handleFocus : undefined}
        disabled={isLoading}
      />

      {/* Video element */}
      <Box flex={1} position="relative" display="flex" alignItems="center" justifyContent="center">
        {isLoading && (
          <Box 
            position="absolute" 
            zIndex={5}
            display="flex"
            flexDirection="column"
            alignItems="center"
            gap={2}
          >
            <CircularProgress color="primary" size={48} />
            <Typography variant="body2" color="white">
              Starting camera...
            </Typography>
          </Box>
        )}
        
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedData={handleVideoLoaded}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        />

        {/* Enhanced Scanner Overlay */}
        <ScannerOverlay
          isScanning={isContinuousScanning}
          detectedBarcode={detectedBarcode}
          scanAttempts={scanAttempts}
          showGuides={true}
        />
      </Box>

      {/* Bottom status bar */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p={2}
        bgcolor="rgba(0,0,0,0.8)"
        sx={{ backdropFilter: 'blur(8px)' }}
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={1}
      >
        <Typography
          variant="body2"
          color="white"
          textAlign="center"
          sx={{ 
            maxWidth: 320,
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          {detectedBarcode ? (
            '✅ Barcode detected! Processing product...'
          ) : isContinuousScanning ? (
            '📱 Scanning automatically - keep barcode centered and steady'
          ) : isLoading ? (
            '⏳ Preparing camera...'
          ) : (
            '🎯 Position barcode in the frame to scan automatically'
          )}
        </Typography>

        {/* Scanning indicator */}
        {isContinuousScanning && !detectedBarcode && (
          <Box
            sx={{
              width: '60%',
              height: 2,
              bgcolor: 'rgba(255,255,255,0.2)',
              borderRadius: 1,
              overflow: 'hidden',
              position: 'relative'
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                height: '100%',
                width: '30%',
                bgcolor: 'primary.main',
                borderRadius: 1,
                animation: 'scanning 2s linear infinite',
                '@keyframes scanning': {
                  '0%': { left: '-30%' },
                  '100%': { left: '100%' }
                }
              }}
            />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default CameraScanner;
