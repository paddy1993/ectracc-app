import React from 'react';
import { 
  Box, 
  Button, 
  Paper,
  Typography,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Slide
} from '@mui/material';
import { 
  Save as SaveIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import BadgePill from '../ui/BadgePill';

interface StickyCTAProps {
  onCalculate: () => void;
  onSubmit: () => void;
  canCalculate: boolean;
  canSubmit: boolean;
  isCalculated: boolean;
  isSubmitting: boolean;
  carbonTotal: string | number;
  itemName: string;
}

export default function StickyCTA({
  onCalculate,
  onSubmit,
  canCalculate,
  canSubmit,
  isCalculated,
  isSubmitting,
  carbonTotal,
  itemName
}: StickyCTAProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (!isMobile) {
    return null; // Only show on mobile
  }

  const formatCarbon = (carbon: string | number) => {
    if (!carbon) return 0;
    const numCarbon = typeof carbon === 'string' ? parseFloat(carbon) : carbon;
    return isNaN(numCarbon) ? 0 : numCarbon / 1000; // Convert to kg
  };

  const showCalculateButton = !isCalculated && canCalculate;
  const showSubmitButton = isCalculated && canSubmit;

  if (!showCalculateButton && !showSubmitButton) {
    return null;
  }

  return (
    <Slide direction="up" in={true} mountOnEnter unmountOnExit>
      <Paper
        elevation={8}
        sx={{
          position: 'fixed',
          bottom: 64, // Above bottom navigation
          left: 16,
          right: 16,
          zIndex: 1200,
          borderRadius: 3,
          overflow: 'hidden',
          // Safe area for mobile devices
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <Box sx={{ p: 2 }}>
          {/* Preview Info */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" color="text.secondary" noWrap sx={{ flex: 1, mr: 2 }}>
              {itemName || 'Enter item details above'}
            </Typography>
            
            {carbonTotal && (
              <BadgePill
                value={formatCarbon(carbonTotal)}
                size="small"
                variant="success"
                showIcon={false}
              />
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            {showCalculateButton && (
              <Button
                variant="outlined"
                startIcon={<CalculateIcon />}
                onClick={onCalculate}
                fullWidth
                size="large"
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  fontWeight: 600,
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2
                  }
                }}
              >
                Calculate CO₂
              </Button>
            )}

            {showSubmitButton && (
              <Button
                variant="contained"
                startIcon={isSubmitting ? <CircularProgress size={20} /> : <SaveIcon />}
                onClick={onSubmit}
                disabled={isSubmitting}
                fullWidth
                size="large"
                sx={{
                  borderRadius: 2,
                  py: 1.5,
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  boxShadow: theme.shadows[4],
                  '&:hover': {
                    boxShadow: theme.shadows[8],
                    transform: 'translateY(-1px)'
                  },
                  '&:active': {
                    transform: 'translateY(0)'
                  },
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.light}`,
                    outlineOffset: 2
                  },
                  transition: 'all 0.2s ease-in-out'
                }}
              >
                {isSubmitting ? 'Tracking...' : 'Track Footprint'}
              </Button>
            )}
          </Box>
        </Box>
      </Paper>
    </Slide>
  );
}
