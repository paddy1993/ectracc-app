import React from 'react';
import {
  Box,
  IconButton,
  Tooltip,
  Fade
} from '@mui/material';
import {
  FlashOn as FlashOnIcon,
  FlashOff as FlashOffIcon,
  Flip as FlipIcon,
  Close as CloseIcon,
  CameraAlt as FocusIcon
} from '@mui/icons-material';

interface ScannerControlsProps {
  hasFlash: boolean;
  flashEnabled: boolean;
  onToggleFlash: () => void;
  onSwitchCamera: () => void;
  onClose?: () => void;
  onFocus?: () => void;
  disabled?: boolean;
}

export default function ScannerControls({
  hasFlash,
  flashEnabled,
  onToggleFlash,
  onSwitchCamera,
  onClose,
  onFocus,
  disabled = false
}: ScannerControlsProps) {
  const buttonStyle = {
    bgcolor: 'rgba(0,0,0,0.6)',
    color: 'white',
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.2)',
    '&:hover': { 
      bgcolor: 'rgba(0,0,0,0.8)',
      transform: 'scale(1.05)'
    },
    '&:disabled': {
      bgcolor: 'rgba(0,0,0,0.3)',
      color: 'rgba(255,255,255,0.5)'
    },
    transition: 'all 0.2s ease'
  };

  const activeButtonStyle = {
    ...buttonStyle,
    bgcolor: 'primary.main',
    '&:hover': { 
      bgcolor: 'primary.dark',
      transform: 'scale(1.05)'
    }
  };

  return (
    <>
      {/* Close button (top left) */}
      {onClose && (
        <Fade in timeout={300}>
          <Box
            position="absolute"
            top={16}
            left={16}
            zIndex={10}
          >
            <Tooltip title="Close scanner" placement="right">
              <IconButton
                onClick={onClose}
                disabled={disabled}
                sx={buttonStyle}
                size="large"
              >
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Fade>
      )}

      {/* Camera controls (top right) */}
      <Fade in timeout={500}>
        <Box
          position="absolute"
          top={16}
          right={16}
          zIndex={10}
          display="flex"
          flexDirection="column"
          gap={1}
        >
          {/* Flash toggle */}
          {hasFlash && (
            <Tooltip 
              title={flashEnabled ? "Turn off flash" : "Turn on flash"} 
              placement="left"
            >
              <IconButton
                onClick={onToggleFlash}
                disabled={disabled}
                sx={flashEnabled ? activeButtonStyle : buttonStyle}
                size="large"
              >
                {flashEnabled ? <FlashOnIcon /> : <FlashOffIcon />}
              </IconButton>
            </Tooltip>
          )}
          
          {/* Camera switch */}
          <Tooltip title="Switch camera" placement="left">
            <IconButton
              onClick={onSwitchCamera}
              disabled={disabled}
              sx={buttonStyle}
              size="large"
            >
              <FlipIcon />
            </IconButton>
          </Tooltip>

          {/* Manual focus (if supported) */}
          {onFocus && (
            <Tooltip title="Focus camera" placement="left">
              <IconButton
                onClick={onFocus}
                disabled={disabled}
                sx={buttonStyle}
                size="large"
              >
                <FocusIcon />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Fade>
    </>
  );
}
