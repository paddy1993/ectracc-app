import React, { forwardRef, useId } from 'react';
import { 
  TextField, 
  TextFieldProps, 
  FormHelperText, 
  useTheme,
  Box,
  Typography
} from '@mui/material';
import { Error, CheckCircle } from '@mui/icons-material';
import { useAccessibility } from '../../contexts/AccessibilityContext';

interface AccessibleTextFieldProps extends Omit<TextFieldProps, 'error' | 'helperText'> {
  error?: boolean;
  errorMessage?: string;
  successMessage?: string;
  helperText?: string;
  required?: boolean;
  ariaDescribedBy?: string;
  announceErrors?: boolean;
  announceSuccess?: boolean;
}

const AccessibleTextField = forwardRef<HTMLDivElement, AccessibleTextFieldProps>(({
  error = false,
  errorMessage,
  successMessage,
  helperText,
  required = false,
  ariaDescribedBy,
  announceErrors = true,
  announceSuccess = true,
  label,
  id,
  ...props
}, ref) => {
  const theme = useTheme();
  const { announceToScreenReader } = useAccessibility();
  const generatedId = useId();
  const fieldId = id || generatedId;
  
  // Generate IDs for ARIA relationships
  const errorId = `${fieldId}-error`;
  const helperId = `${fieldId}-helper`;
  const successId = `${fieldId}-success`;
  
  // Determine which helper text to show
  const hasError = Boolean(error && errorMessage);
  const hasSuccess = !error && successMessage;
  const hasHelper = !hasError && !hasSuccess && helperText;
  
  // Build aria-describedby
  const ariaDescribedByIds = [
    ariaDescribedBy,
    hasError ? errorId : null,
    hasSuccess ? successId : null,
    hasHelper ? helperId : null
  ].filter(Boolean).join(' ');

  // Announce errors and success messages
  React.useEffect(() => {
    if (hasError && announceErrors) {
      announceToScreenReader(`Error: ${errorMessage}`, 'assertive');
    }
  }, [hasError, errorMessage, announceErrors, announceToScreenReader]);

  React.useEffect(() => {
    if (hasSuccess && announceSuccess) {
      announceToScreenReader(`Success: ${successMessage}`, 'polite');
    }
  }, [hasSuccess, successMessage, announceSuccess, announceToScreenReader]);

  // Enhanced label with required indicator
  const enhancedLabel = required && label ? `${label} *` : label;

  return (
    <Box sx={{ width: '100%' }}>
      <TextField
        ref={ref}
        {...props}
        id={fieldId}
        label={enhancedLabel}
        error={hasError}
        required={required}
        inputProps={{
          ...props.inputProps,
          'aria-describedby': ariaDescribedByIds || undefined,
          'aria-invalid': hasError ? true : undefined,
          'aria-required': required ? true : undefined
        }}
        sx={{
          width: '100%',
          '& .MuiOutlinedInput-root': {
            '&:focus-within': {
              outline: `2px solid ${theme.palette.primary.main}`,
              outlineOffset: '1px'
            },
            '&.Mui-focused': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.primary.main,
                borderWidth: '2px'
              }
            },
            '&.Mui-error': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderColor: theme.palette.error.main,
                borderWidth: '2px'
              }
            }
          },
          '& .MuiInputLabel-root': {
            '&.Mui-focused': {
              color: theme.palette.primary.main
            },
            '&.Mui-error': {
              color: theme.palette.error.main
            }
          },
          // High contrast mode support
          '@media (prefers-contrast: high)': {
            '& .MuiOutlinedInput-root': {
              '& .MuiOutlinedInput-notchedOutline': {
                borderWidth: '2px'
              }
            }
          },
          ...props.sx
        }}
      />
      
      {/* Error Message */}
      {hasError && (
        <FormHelperText
          id={errorId}
          error
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 1,
            fontSize: '0.875rem',
            fontWeight: 500
          }}
        >
          <Error sx={{ fontSize: 16, mr: 0.5 }} />
          {errorMessage}
        </FormHelperText>
      )}
      
      {/* Success Message */}
      {hasSuccess && (
        <FormHelperText
          id={successId}
          sx={{
            display: 'flex',
            alignItems: 'center',
            mt: 1,
            fontSize: '0.875rem',
            fontWeight: 500,
            color: theme.palette.success.main
          }}
        >
          <CheckCircle sx={{ fontSize: 16, mr: 0.5 }} />
          {successMessage}
        </FormHelperText>
      )}
      
      {/* Helper Text */}
      {hasHelper && (
        <FormHelperText
          id={helperId}
          sx={{
            mt: 1,
            fontSize: '0.875rem'
          }}
        >
          {helperText}
        </FormHelperText>
      )}
      
      {/* Required Field Indicator */}
      {required && (
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            mt: 0.5,
            color: 'text.secondary',
            fontSize: '0.75rem'
          }}
        >
          * Required field
        </Typography>
      )}
    </Box>
  );
});

AccessibleTextField.displayName = 'AccessibleTextField';

export default AccessibleTextField;
