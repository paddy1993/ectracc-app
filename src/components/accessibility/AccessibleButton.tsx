import React, { forwardRef } from 'react';
import { Button, ButtonProps, CircularProgress, useTheme } from '@mui/material';
import { useAccessibility, useKeyboardNavigation } from '../../contexts/AccessibilityContext';

interface AccessibleButtonProps extends Omit<ButtonProps, 'onClick'> {
  onClick?: (event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => void;
  loading?: boolean;
  loadingText?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  announceOnClick?: string;
  preventDoubleClick?: boolean;
}

const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(({
  onClick,
  loading = false,
  loadingText = 'Loading...',
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  announceOnClick,
  preventDoubleClick = true,
  disabled,
  children,
  startIcon,
  endIcon,
  ...props
}, ref) => {
  const theme = useTheme();
  const { announceToScreenReader } = useAccessibility();
  
  const [isClicking, setIsClicking] = React.useState(false);

  const handleClick = async (event: React.MouseEvent<HTMLButtonElement> | React.KeyboardEvent<HTMLButtonElement>) => {
    if (loading || disabled) return;
    
    // Prevent double clicks if enabled
    if (preventDoubleClick && isClicking) return;
    
    if (preventDoubleClick) {
      setIsClicking(true);
      setTimeout(() => setIsClicking(false), 300);
    }

    // Announce action to screen readers
    if (announceOnClick) {
      announceToScreenReader(announceOnClick, 'polite');
    }

    // Call the original onClick handler
    if (onClick) {
      await onClick(event);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick(event);
    }
  };

  // Determine the effective disabled state
  const isDisabled = disabled || loading || (preventDoubleClick && isClicking);

  // Determine ARIA label
  const effectiveAriaLabel = loading ? loadingText : ariaLabel;

  // Determine icons
  const effectiveStartIcon = loading ? <CircularProgress size={16} color="inherit" /> : startIcon;
  const effectiveEndIcon = loading ? undefined : endIcon;

  return (
    <Button
      ref={ref}
      {...props}
      disabled={isDisabled}
      onClick={handleClick}
      onKeyDown={handleKeyPress}
      startIcon={effectiveStartIcon}
      endIcon={effectiveEndIcon}
      aria-label={effectiveAriaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-busy={loading}
      sx={{
        minHeight: '44px',
        minWidth: '44px',
        position: 'relative',
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: '2px',
          boxShadow: `0 0 0 4px ${theme.palette.primary.main}40`
        },
        '&:disabled': {
          cursor: loading ? 'wait' : 'not-allowed'
        },
        // High contrast mode support
        '@media (prefers-contrast: high)': {
          border: '2px solid',
          '&:hover:not(:disabled)': {
            backgroundColor: 'rgba(0, 0, 0, 0.04)'
          }
        },
        // Reduced motion support
        '@media (prefers-reduced-motion: reduce)': {
          transition: 'none'
        },
        '@media (prefers-reduced-motion: no-preference)': {
          transition: 'all 0.2s ease-in-out',
          '&:hover:not(:disabled)': {
            transform: 'translateY(-1px)'
          },
          '&:active': {
            transform: 'translateY(0)'
          }
        },
        ...props.sx
      }}
    >
      {loading ? loadingText : children}
    </Button>
  );
});

AccessibleButton.displayName = 'AccessibleButton';

export default AccessibleButton;
