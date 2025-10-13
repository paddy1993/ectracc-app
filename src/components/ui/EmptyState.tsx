import React from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { EmojiNature as Eco, Search, Add, Timeline, ScannerOutlined } from '@mui/icons-material';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  variant?: 'default' | 'dashboard' | 'search' | 'history' | 'scan';
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  variant = 'default'
}: EmptyStateProps) {
  const theme = useTheme();

  const getDefaultIcon = () => {
    switch (variant) {
      case 'dashboard':
        return <Eco sx={{ fontSize: 64, color: 'text.secondary' }} />;
      case 'search':
        return <Search sx={{ fontSize: 64, color: 'text.secondary' }} />;
      case 'history':
        return <Timeline sx={{ fontSize: 64, color: 'text.secondary' }} />;
      case 'scan':
        return <ScannerOutlined sx={{ fontSize: 64, color: 'text.secondary' }} />;
      default:
        return <Add sx={{ fontSize: 64, color: 'text.secondary' }} />;
    }
  };

  const displayIcon = icon || getDefaultIcon();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        py: 6,
        px: 3,
        minHeight: 300
      }}
    >
      <Box sx={{ mb: 3, opacity: 0.7 }}>
        {displayIcon}
      </Box>
      
      <Typography 
        variant="h6" 
        component="h3"
        gutterBottom
        sx={{ 
          fontWeight: 600,
          color: 'text.primary',
          mb: 1
        }}
      >
        {title}
      </Typography>
      
      <Typography 
        variant="body2" 
        color="text.secondary"
        sx={{ 
          mb: 4,
          maxWidth: 400,
          lineHeight: 1.6
        }}
      >
        {description}
      </Typography>

      {(onAction || onSecondaryAction) && (
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
          {onAction && actionLabel && (
            <Button
              variant="contained"
              onClick={onAction}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                // Accessibility
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2
                }
              }}
            >
              {actionLabel}
            </Button>
          )}
          
          {onSecondaryAction && secondaryActionLabel && (
            <Button
              variant="outlined"
              onClick={onSecondaryAction}
              sx={{
                borderRadius: 2,
                px: 3,
                py: 1,
                fontWeight: 600,
                textTransform: 'none',
                // Accessibility
                '&:focus-visible': {
                  outline: `2px solid ${theme.palette.primary.main}`,
                  outlineOffset: 2
                }
              }}
            >
              {secondaryActionLabel}
            </Button>
          )}
        </Box>
      )}
    </Box>
  );
}
