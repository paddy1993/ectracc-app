import React from 'react';
import {
  Box,
  Typography,
  Chip,
  LinearProgress,
  keyframes
} from '@mui/material';
import {
  CheckCircle as SuccessIcon,
  QrCodeScanner as ScanIcon,
  CameraAlt as CameraIcon
} from '@mui/icons-material';

interface ScannerOverlayProps {
  isScanning: boolean;
  detectedBarcode?: string;
  scanAttempts?: number;
  showGuides?: boolean;
}

// Scanning animation
const scanningAnimation = keyframes`
  0% { 
    transform: translateY(-100%);
    opacity: 0.8;
  }
  50% { 
    transform: translateY(0%);
    opacity: 1;
  }
  100% { 
    transform: translateY(100%);
    opacity: 0.8;
  }
`;

const pulseAnimation = keyframes`
  0% { 
    borderColor: rgba(25, 118, 210, 0.8);
    boxShadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  50% { 
    borderColor: rgba(25, 118, 210, 1);
    boxShadow: 0 0 0 8px rgba(25, 118, 210, 0.1);
  }
  100% { 
    borderColor: rgba(25, 118, 210, 0.8);
    boxShadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
`;

const successAnimation = keyframes`
  0% { 
    borderColor: rgba(46, 125, 50, 1);
    boxShadow: 0 0 0 0 rgba(46, 125, 50, 0.6);
  }
  50% { 
    borderColor: rgba(46, 125, 50, 1);
    boxShadow: 0 0 0 12px rgba(46, 125, 50, 0.2);
  }
  100% { 
    borderColor: rgba(46, 125, 50, 1);
    boxShadow: 0 0 0 0 rgba(46, 125, 50, 0.6);
  }
`;

export default function ScannerOverlay({
  isScanning,
  detectedBarcode,
  scanAttempts = 0,
  showGuides = true
}: ScannerOverlayProps) {
  const hasDetectedBarcode = !!detectedBarcode;

  return (
    <Box
      position="absolute"
      sx={{
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '85%',
        maxWidth: 320,
        height: 200,
        zIndex: 5
      }}
    >
      {/* Main scanning frame */}
      <Box
        sx={{
          width: '100%',
          height: '100%',
          border: '3px solid',
          borderColor: hasDetectedBarcode ? 'success.main' : 
            isScanning ? 'primary.main' : 
            'rgba(255,255,255,0.6)',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          animation: hasDetectedBarcode ? `${successAnimation} 0.6s ease-in-out` :
            isScanning ? `${pulseAnimation} 2s infinite` : 'none',
          transition: 'border-color 0.3s ease'
        }}
      >
        {/* Scanning line animation */}
        {isScanning && !hasDetectedBarcode && (
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              height: '2px',
              bgcolor: 'primary.main',
              boxShadow: '0 0 8px rgba(25, 118, 210, 0.8)',
              animation: `${scanningAnimation} 2s linear infinite`,
              zIndex: 2
            }}
          />
        )}

        {/* Corner guides */}
        {showGuides && (
          <>
            {/* Top left */}
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                left: 12,
                width: 24,
                height: 24,
                borderTop: '4px solid white',
                borderLeft: '4px solid white',
                borderRadius: '4px 0 0 0'
              }}
            />
            {/* Top right */}
            <Box
              sx={{
                position: 'absolute',
                top: 12,
                right: 12,
                width: 24,
                height: 24,
                borderTop: '4px solid white',
                borderRight: '4px solid white',
                borderRadius: '0 4px 0 0'
              }}
            />
            {/* Bottom left */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 12,
                left: 12,
                width: 24,
                height: 24,
                borderBottom: '4px solid white',
                borderLeft: '4px solid white',
                borderRadius: '0 0 0 4px'
              }}
            />
            {/* Bottom right */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 12,
                right: 12,
                width: 24,
                height: 24,
                borderBottom: '4px solid white',
                borderRight: '4px solid white',
                borderRadius: '0 0 4px 0'
              }}
            />
          </>
        )}

        {/* Center crosshair for better targeting */}
        {isScanning && !hasDetectedBarcode && (
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '60%',
              height: '2px',
              bgcolor: 'rgba(255,255,255,0.8)',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotate(90deg)',
                width: '30px',
                height: '2px',
                bgcolor: 'rgba(255,255,255,0.8)'
              }
            }}
          />
        )}
      </Box>

      {/* Status indicator above frame */}
      <Box
        sx={{
          position: 'absolute',
          top: -40,
          left: 0,
          right: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {hasDetectedBarcode ? (
          <Chip
            icon={<SuccessIcon />}
            label={`Found: ${detectedBarcode.substring(0, 12)}${detectedBarcode.length > 12 ? '...' : ''}`}
            color="success"
            size="small"
            sx={{ 
              bgcolor: 'success.main', 
              color: 'white',
              fontWeight: 600,
              animation: `${successAnimation} 0.6s ease-in-out`
            }}
          />
        ) : (
          <Typography
            variant="caption"
            color="white"
            sx={{
              bgcolor: 'rgba(0,0,0,0.8)',
              px: 2,
              py: 1,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              fontWeight: 500,
              backdropFilter: 'blur(4px)'
            }}
          >
            {isScanning ? (
              <>
                <ScanIcon sx={{ fontSize: 16, animation: 'rotate 2s linear infinite' }} />
                Auto-scanning... {scanAttempts > 0 && `(${scanAttempts} attempts)`}
              </>
            ) : (
              <>
                <CameraIcon sx={{ fontSize: 16 }} />
                Position barcode in frame
              </>
            )}
          </Typography>
        )}
      </Box>

      {/* Instructions below frame */}
      <Box
        sx={{
          position: 'absolute',
          bottom: -50,
          left: 0,
          right: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1
        }}
      >
        <Typography
          variant="body2"
          color="white"
          textAlign="center"
          sx={{
            bgcolor: 'rgba(0,0,0,0.7)',
            px: 2,
            py: 1,
            borderRadius: 2,
            maxWidth: 280,
            fontSize: '0.875rem',
            backdropFilter: 'blur(4px)'
          }}
        >
          {hasDetectedBarcode ? (
            'Barcode detected! Processing...'
          ) : isScanning ? (
            'Keep barcode steady and centered'
          ) : (
            'Align barcode within the frame to scan automatically'
          )}
        </Typography>

        {/* Progress indicator for scanning attempts */}
        {isScanning && scanAttempts > 0 && (
          <LinearProgress
            variant="indeterminate"
            sx={{
              width: '60%',
              height: 3,
              borderRadius: 1.5,
              bgcolor: 'rgba(255,255,255,0.2)',
              '& .MuiLinearProgress-bar': {
                bgcolor: 'primary.main'
              }
            }}
          />
        )}
      </Box>

      {/* CSS for rotation animation */}
      <style>
        {`
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </Box>
  );
}
