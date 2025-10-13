import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Button,
  Divider,
  useTheme,
  useMediaQuery,
  Fab
} from '@mui/material';
import { Close, FilterList } from '@mui/icons-material';

interface SheetFiltersProps {
  children: React.ReactNode;
  title?: string;
  onApply?: () => void;
  onReset?: () => void;
  filterCount?: number;
}

export default function SheetFilters({ 
  children, 
  title = "Filters", 
  onApply, 
  onReset,
  filterCount = 0 
}: SheetFiltersProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [open, setOpen] = useState(false);

  // Only show on mobile
  if (!isMobile) {
    return <>{children}</>;
  }

  const handleApply = () => {
    onApply?.();
    setOpen(false);
  };

  const handleReset = () => {
    onReset?.();
  };

  return (
    <>
      {/* Filter FAB for mobile */}
      <Fab
        color="secondary"
        onClick={() => setOpen(true)}
        sx={{
          position: 'fixed',
          bottom: 140, // Above scan FAB and bottom nav
          right: 16,
          zIndex: 1200,
          width: 56,
          height: 56,
          '&:hover': {
            transform: 'scale(1.1)',
            transition: 'transform 0.2s ease-in-out'
          },
          '&:focus-visible': {
            outline: `3px solid ${theme.palette.secondary.light}`,
            outlineOffset: 2
          }
        }}
        aria-label={`Open filters${filterCount > 0 ? ` (${filterCount} active)` : ''}`}
      >
        <Box sx={{ position: 'relative' }}>
          <FilterList />
          {filterCount > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: -8,
                right: -8,
                backgroundColor: theme.palette.error.main,
                color: 'white',
                borderRadius: '50%',
                width: 20,
                height: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 600
              }}
            >
              {filterCount > 9 ? '9+' : filterCount}
            </Box>
          )}
        </Box>
      </Fab>

      {/* Bottom sheet drawer */}
      <Drawer
        anchor="bottom"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            height: '85vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            // Safe area for mobile devices
            paddingBottom: 'env(safe-area-inset-bottom)'
          }
        }}
      >
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
          {/* Header */}
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            p: 2,
            borderBottom: `1px solid ${theme.palette.divider}`
          }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {title}
              {filterCount > 0 && (
                <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  ({filterCount} active)
                </Typography>
              )}
            </Typography>
            <IconButton 
              onClick={() => setOpen(false)}
              sx={{
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2
                }
              }}
            >
              <Close />
            </IconButton>
          </Box>

          {/* Content */}
          <Box sx={{ 
            flex: 1, 
            overflow: 'auto',
            p: 2
          }}>
            {children}
          </Box>

          {/* Actions */}
          <Box sx={{ 
            p: 2, 
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.background.paper
          }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              {onReset && (
                <Button
                  variant="outlined"
                  onClick={handleReset}
                  sx={{ 
                    flex: 1,
                    '&:focus-visible': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2
                    }
                  }}
                >
                  Reset
                </Button>
              )}
              <Button
                variant="contained"
                onClick={handleApply}
                sx={{ 
                  flex: 2,
                  '&:focus-visible': {
                    outline: `2px solid ${theme.palette.primary.main}`,
                    outlineOffset: 2
                  }
                }}
              >
                Apply Filters
              </Button>
            </Box>
          </Box>
        </Box>
      </Drawer>
    </>
  );
}
