import React from 'react';
import { Fab, useTheme, useMediaQuery } from '@mui/material';
import { QrCodeScanner } from '@mui/icons-material';

interface ScanFabProps {
  onClick: () => void;
  disabled?: boolean;
}

export default function ScanFab({ onClick, disabled = false }: ScanFabProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Only show on mobile
  if (!isMobile) {
    return null;
  }

  return (
    <Fab
      color="primary"
      onClick={onClick}
      disabled={disabled}
      sx={{
        position: 'fixed',
        bottom: 80, // Above bottom navigation (56px) + margin
        right: 16,
        zIndex: 1200,
        width: 64,
        height: 64,
        boxShadow: theme.shadows[8],
        '&:hover': {
          transform: 'scale(1.1)',
          transition: 'transform 0.2s ease-in-out'
        },
        '&:active': {
          transform: 'scale(0.95)'
        },
        // Accessibility
        '&:focus-visible': {
          outline: `3px solid ${theme.palette.primary.light}`,
          outlineOffset: 2
        }
      }}
      aria-label="Scan barcode"
    >
      <QrCodeScanner sx={{ fontSize: 28 }} />
    </Fab>
  );
}
