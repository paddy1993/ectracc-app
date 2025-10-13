import React from 'react';
import { Chip, useTheme } from '@mui/material';
import { EmojiNature as Eco } from '@mui/icons-material';

interface BadgePillProps {
  value: number;
  unit?: string;
  size?: 'small' | 'medium';
  variant?: 'default' | 'success' | 'warning' | 'error';
  showIcon?: boolean;
  onClick?: () => void;
}

export default function BadgePill({ 
  value, 
  unit = 'kg CO₂e',
  size = 'medium',
  variant = 'default',
  showIcon = true,
  onClick
}: BadgePillProps) {
  const theme = useTheme();

  const formatValue = (val: number): string => {
    if (val === 0) return '0';
    if (val < 0.01) return '<0.01';
    if (val < 1) return val.toFixed(2);
    if (val < 10) return val.toFixed(1);
    return Math.round(val).toString();
  };

  const getVariantColor = () => {
    switch (variant) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'primary';
    }
  };

  const getVariantStyles = () => {
    const baseStyles = {
      fontWeight: 600,
      fontSize: size === 'small' ? '0.75rem' : '0.875rem',
      '& .MuiChip-icon': {
        fontSize: size === 'small' ? '1rem' : '1.125rem'
      }
    };

    switch (variant) {
      case 'success':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.success.light + '30',
          color: theme.palette.success.dark,
          border: `1px solid ${theme.palette.success.light}`
        };
      case 'warning':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.warning.light + '30',
          color: theme.palette.warning.dark,
          border: `1px solid ${theme.palette.warning.light}`
        };
      case 'error':
        return {
          ...baseStyles,
          backgroundColor: theme.palette.error.light + '30',
          color: theme.palette.error.dark,
          border: `1px solid ${theme.palette.error.light}`
        };
      default:
        return {
          ...baseStyles,
          backgroundColor: theme.palette.primary.light + '20',
          color: theme.palette.primary.dark,
          border: `1px solid ${theme.palette.primary.light}`
        };
    }
  };

  const displayValue = `${formatValue(value)} ${unit}`;

  return (
    <Chip
      icon={showIcon ? <Eco /> : undefined}
      label={displayValue}
      size={size}
      color={getVariantColor() as any}
      variant="outlined"
      onClick={onClick}
      sx={{
        ...getVariantStyles(),
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? {
          transform: 'scale(1.05)',
          transition: 'transform 0.2s ease-in-out'
        } : {},
        // Accessibility
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2
        }
      }}
      aria-label={`Carbon footprint: ${displayValue}`}
    />
  );
}
