import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Fab,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  CameraAlt as CameraIcon,
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
  Flip as FlipIcon,
  Close as CloseIcon,
  CheckCircle as SuccessIcon,
  QrCodeScanner as ScanIcon
} from '@mui/icons-material';
import { BrowserMultiFormatReader } from '@zxing/browser';

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [hasFlash, setHasFlash] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isLoading, setIsLoading] = useState(true);
  const [scanningActive, setScanningActive] = useState(false);
  const [lastScanAttempt, setLastScanAttempt] = useState<number>(0);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [detectedBarcode, setDetectedBarcode] = useState<string>('');

  // Start camera
  const startCamera = async () => {
    try {
      setIsLoading(true);
      setError('');

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play();
      }

      // Check for flash capability
      const videoTrack = mediaStream.getVideoTracks()[0];
      const capabilities = videoTrack.getCapabilities();
      setHasFlash('torch' in capabilities);

      setIsLoading(false);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Unable to access camera. Please check permissions.');
      setIsLoading(false);
    }
  };

  // Toggle flash
  const toggleFlash = async () => {
    if (stream && hasFlash) {
      const videoTrack = stream.getVideoTracks()[0];
      try {
        await videoTrack.applyConstraints({
          advanced: [{ torch: !flashEnabled } as any]
        });
        setFlashEnabled(!flashEnabled);
      } catch (err) {
        console.error('Error toggling flash:', err);
      }
    }
  };

  // Switch camera
  const switchCamera = () => {
    setFacingMode(facingMode === 'user' ? 'environment' : 'user');
  };

  // Initialize ZXing code reader
  const initializeCodeReader = () => {
    if (!codeReaderRef.current) {
      codeReaderRef.current = new BrowserMultiFormatReader();
    }
    return codeReaderRef.current;
  };

  // Real barcode detection using ZXing
  const startBarcodeDetection = async () => {
    if (!videoRef.current) return;

    const codeReader = initializeCodeReader();
    setScanningActive(true);
    setDetectedBarcode('');
    setScanProgress(0);

    try {
      // Use ZXing's continuous decode method
      const result = await codeReader.decodeOnceFromVideoDevice(undefined, videoRef.current);
      
      if (result) {
        setDetectedBarcode(result.getText());
        
        // Haptic feedback for successful scan
        if ('vibrate' in navigator) {
          navigator.vibrate([100, 50, 100]);
        }

        // Brief delay to show success state
        setTimeout(() => {
          onScan(result.getText());
          setScanningActive(false);
        }, 800);
      }
    } catch (err) {
      console.error('Error during barcode detection:', err);
      setError('No barcode detected. Please try again or ensure the barcode is clearly visible.');
      setScanningActive(false);
    }
  };

  // Start scanning
  const startScanning = () => {
    setError(''); // Clear any previous errors
    setLastScanAttempt(Date.now());
    
    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate(100);
    }

    startBarcodeDetection();
  };

  // Initialize camera on mount
  useEffect(() => {
    startCamera();
    
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      // Clean up code reader
      if (codeReaderRef.current) {
        codeReaderRef.current = null;
      }
    };
  }, [facingMode]);

  // Handle video loaded
  const handleVideoLoaded = () => {
    setIsLoading(false);
  };

  if (error) {
    return (
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center"
        height="100vh"
        p={3}
      >
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={startCamera}>
          Try Again
        </Button>
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
    >
      {/* Close button */}
      {onClose && (
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
          }}
        >
          <CloseIcon />
        </IconButton>
      )}

      {/* Camera controls */}
      <Box
        position="absolute"
        top={16}
        right={16}
        zIndex={10}
        display="flex"
        flexDirection="column"
        gap={1}
      >
        {hasFlash && (
          <IconButton
            onClick={toggleFlash}
            sx={{
              bgcolor: flashEnabled ? 'primary.main' : 'rgba(0,0,0,0.5)',
              color: 'white',
              '&:hover': { bgcolor: flashEnabled ? 'primary.dark' : 'rgba(0,0,0,0.7)' }
            }}
          >
            {flashEnabled ? <FlashOnIcon /> : <FlashOffIcon />}
          </IconButton>
        )}
        
        <IconButton
          onClick={switchCamera}
          sx={{
            bgcolor: 'rgba(0,0,0,0.5)',
            color: 'white',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' }
          }}
        >
          <FlipIcon />
        </IconButton>
      </Box>

      {/* Video element */}
      <Box flex={1} position="relative" display="flex" alignItems="center" justifyContent="center">
        {isLoading && (
          <Box position="absolute" zIndex={5}>
            <CircularProgress color="primary" />
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

        {/* Scanning overlay */}
        <Box
          position="absolute"
          sx={{
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: 300,
            height: 200,
            border: '2px solid',
            borderColor: detectedBarcode ? 'success.main' : 
              scanningActive ? 'primary.main' : 
              'rgba(255,255,255,0.5)',
            borderRadius: 2,
            zIndex: 5,
            animation: scanningActive ? 'pulse 1s infinite' : 'none',
            '@keyframes pulse': {
              '0%': { borderColor: 'primary.main' },
              '50%': { borderColor: 'primary.light' },
              '100%': { borderColor: 'primary.main' }
            }
          }}
        >
          {/* Scanning progress */}
          {scanningActive && (
            <LinearProgress
              variant="determinate"
              value={scanProgress}
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 4,
                borderRadius: '0 0 8px 8px'
              }}
            />
          )}

          {/* Status indicator */}
          <Box
            sx={{
              position: 'absolute',
              top: -32,
              left: 0,
              right: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {detectedBarcode ? (
              <Chip
                icon={<SuccessIcon />}
                label={`Found: ${detectedBarcode}`}
                color="success"
                size="small"
                sx={{ bgcolor: 'success.main', color: 'white' }}
              />
            ) : (
              <Typography
                variant="caption"
                color="white"
                sx={{
                  bgcolor: 'rgba(0,0,0,0.7)',
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 0.5
                }}
              >
                {scanningActive ? (
                  <>
                    <ScanIcon sx={{ fontSize: 14 }} />
                    Scanning... {Math.round(scanProgress)}%
                  </>
                ) : (
                  'Position barcode in frame'
                )}
              </Typography>
            )}
          </Box>

          {/* Corner brackets for better visual guidance */}
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              left: 8,
              width: 20,
              height: 20,
              borderTop: '3px solid white',
              borderLeft: '3px solid white'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 20,
              height: 20,
              borderTop: '3px solid white',
              borderRight: '3px solid white'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              left: 8,
              width: 20,
              height: 20,
              borderBottom: '3px solid white',
              borderLeft: '3px solid white'
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 8,
              right: 8,
              width: 20,
              height: 20,
              borderBottom: '3px solid white',
              borderRight: '3px solid white'
            }}
          />
        </Box>
      </Box>

      {/* Bottom controls */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        p={3}
        bgcolor="rgba(0,0,0,0.8)"
        display="flex"
        flexDirection="column"
        alignItems="center"
        gap={2}
      >
        {/* Scan instructions */}
        <Typography
          variant="body2"
          color="white"
          textAlign="center"
          sx={{ maxWidth: 300 }}
        >
          {detectedBarcode ? (
            'Barcode detected! Processing...'
          ) : scanningActive ? (
            'Keep the barcode steady in the frame'
          ) : error ? (
            'Tap to try again'
          ) : (
            'Tap the camera button to scan a barcode'
          )}
        </Typography>

        {/* Scan button */}
        <Fab
          color={detectedBarcode ? "success" : "primary"}
          size="large"
          onClick={startScanning}
          disabled={isLoading || scanningActive || !!detectedBarcode}
          sx={{ 
            position: 'relative',
            transform: scanningActive ? 'scale(0.9)' : 'scale(1)',
            transition: 'transform 0.2s ease'
          }}
        >
          {detectedBarcode ? (
            <SuccessIcon />
          ) : scanningActive ? (
            <CircularProgress size={28} color="inherit" />
          ) : (
            <CameraIcon />
          )}
        </Fab>

        {/* Error display */}
        {error && !scanningActive && (
          <Alert 
            severity="warning" 
            sx={{ 
              bgcolor: 'rgba(255,152,0,0.1)', 
              color: 'white',
              '& .MuiAlert-icon': { color: 'warning.main' },
              maxWidth: 300,
              fontSize: '0.875rem'
            }}
          >
            {error}
          </Alert>
        )}
      </Box>

      {/* Hidden canvas for image processing */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </Box>
  );
};

export default CameraScanner;
