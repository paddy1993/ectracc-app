import React from 'react';
import {
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CheckCircle,
  RadioButtonUnchecked
} from '@mui/icons-material';
import { 
  validatePassword, 
  getPasswordStrengthLabel, 
  getPasswordStrengthColor,
  PasswordStrength 
} from '../utils/passwordValidation';

interface PasswordStrengthIndicatorProps {
  password: string;
  showDetails?: boolean;
  compact?: boolean;
}

const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  showDetails = false,
  compact = false
}) => {
  const validation: PasswordStrength = validatePassword(password);

  if (!password && !showDetails) {
    return null;
  }

  const strengthLabel = getPasswordStrengthLabel(validation.score);
  const strengthColor = getPasswordStrengthColor(validation.score);
  const progressValue = (validation.score / 4) * 100;

  const requirements = [
    { key: 'minLength', label: 'At least 8 characters', met: validation.requirements.minLength },
    { key: 'hasUppercase', label: 'One uppercase letter (A-Z)', met: validation.requirements.hasUppercase },
    { key: 'hasLowercase', label: 'One lowercase letter (a-z)', met: validation.requirements.hasLowercase },
    { key: 'hasNumber', label: 'One number (0-9)', met: validation.requirements.hasNumber },
    { key: 'hasSpecialChar', label: 'One special character (!@#$%...)', met: validation.requirements.hasSpecialChar },
    { key: 'notCommon', label: 'Not a common password', met: validation.requirements.notCommon }
  ];

  if (compact) {
    return (
      <Box sx={{ mt: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
          <LinearProgress
            variant="determinate"
            value={progressValue}
            sx={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                backgroundColor: strengthColor,
                borderRadius: 2
              }
            }}
          />
          <Typography
            variant="caption"
            sx={{ 
              color: strengthColor,
              fontWeight: 500,
              minWidth: 60,
              textAlign: 'right'
            }}
          >
            {strengthLabel}
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ mt: 1 }}>
      {/* Strength Indicator */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          data-testid="password-strength-bar"
          sx={{
            flex: 1,
            height: 6,
            borderRadius: 3,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              backgroundColor: strengthColor,
              borderRadius: 3
            }
          }}
        />
        <Typography
          variant="body2"
          data-testid="password-strength-label"
          sx={{ 
            color: strengthColor,
            fontWeight: 600,
            minWidth: 80,
            textAlign: 'right'
          }}
        >
          {strengthLabel}
        </Typography>
      </Box>

      {/* Requirements List - Always Visible */}
      {(showDetails || password) && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            Password Requirements:
          </Typography>
          <List dense sx={{ py: 0 }}>
            {requirements.map((req) => (
              <ListItem key={req.key} sx={{ py: 0.25, px: 0 }} data-testid={`password-requirement-${req.key}`}>
                <ListItemIcon sx={{ minWidth: 32 }}>
                  {req.met ? (
                    <CheckCircle 
                      fontSize="small" 
                      sx={{ color: 'success.main' }} 
                    />
                  ) : (
                    <RadioButtonUnchecked 
                      fontSize="small" 
                      sx={{ color: 'grey.400' }} 
                    />
                  )}
                </ListItemIcon>
                <ListItemText
                  primary={req.label}
                  primaryTypographyProps={{
                    variant: 'caption',
                    sx: {
                      color: req.met ? 'success.main' : 'text.secondary',
                      fontWeight: req.met ? 500 : 400
                    }
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}

    </Box>
  );
};

export default PasswordStrengthIndicator;
