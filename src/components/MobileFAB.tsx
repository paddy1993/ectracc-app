import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Fab,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  useTheme,
  useMediaQuery,
  Box
} from '@mui/material';
import {
  QrCodeScanner,
  Add,
  Search,
  Calculate,
  Close
} from '@mui/icons-material';
import { getAppEnvironment } from '../utils/offlineSync';
import { useAuth } from '../contexts/AuthContext';

interface MobileFABProps {
  variant?: 'simple' | 'speedDial';
}

export default function MobileFAB({ variant = 'speedDial' }: MobileFABProps) {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [speedDialOpen, setSpeedDialOpen] = useState(false);
  const { profile } = useAuth();
  
  const appEnvironment = getAppEnvironment();

  // Only show on mobile or in native app
  if (!isMobile && appEnvironment === 'web') {
    return null;
  }

  // Don't show FAB until user has completed profile setup
  if (!profile) {
    return null;
  }

  const actions = [
    {
      icon: <QrCodeScanner />,
      name: 'Scan Product',
      action: () => navigate('/scanner')
    },
    {
      icon: <Calculate />,
      name: 'Manual Entry',
      action: () => navigate('/tracker')
    },
    {
      icon: <Search />,
      name: 'Search Products',
      action: () => navigate('/products/search')
    }
  ];

  const handleSpeedDialToggle = () => {
    setSpeedDialOpen(!speedDialOpen);
  };

  const handleSpeedDialClose = () => {
    setSpeedDialOpen(false);
  };

  const handleActionClick = (action: () => void) => {
    action();
    handleSpeedDialClose();
  };

  if (variant === 'simple') {
    return (
      <Fab
        color="primary"
        aria-label="scan product"
        onClick={() => navigate('/scanner')}
        data-testid="mobile-fab"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000,
          boxShadow: 3
        }}
      >
        <QrCodeScanner />
      </Fab>
    );
  }

  return (
    <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 1000 }}>
      <SpeedDial
        ariaLabel="Quick Actions"
        icon={<SpeedDialIcon icon={<Add />} openIcon={<Close />} />}
        onClose={handleSpeedDialClose}
        onOpen={handleSpeedDialToggle}
        open={speedDialOpen}
        direction="up"
        sx={{
          '& .MuiSpeedDial-fab': {
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            }
          }
        }}
      >
        {actions.map((action) => (
          <SpeedDialAction
            key={action.name}
            icon={action.icon}
            tooltipTitle={action.name}
            tooltipOpen
            onClick={() => handleActionClick(action.action)}
            sx={{
              '& .MuiSpeedDialAction-fab': {
                bgcolor: theme.palette.background.paper,
                color: theme.palette.primary.main,
                '&:hover': {
                  bgcolor: theme.palette.primary.light,
                  color: theme.palette.primary.contrastText,
                }
              }
            }}
          />
        ))}
      </SpeedDial>
    </Box>
  );
}

// Hook for controlling FAB visibility
export function useMobileFAB() {
  const [showFAB, setShowFAB] = useState(true);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const hideFAB = () => setShowFAB(false);
  const showFABButton = () => setShowFAB(true);

  return {
    showFAB: showFAB && isMobile,
    hideFAB,
    showFABButton
  };
}



