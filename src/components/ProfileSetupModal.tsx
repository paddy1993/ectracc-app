import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  RadioGroup,
  Radio,
  Avatar,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  Slide,
  Paper,
  LinearProgress,
  Fade,
  Grow
} from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { Person, PhotoCamera, CheckCircle } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import analytics, { EVENTS, USER_PROPERTIES } from '../services/analytics';

interface ProfileSetupForm {
  display_name: string;
}

interface ProfileSetupModalProps {
  open: boolean;
  onClose?: () => void;
}

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Simplified profile setup - just name and avatar for now

export default function ProfileSetupModal({ open, onClose }: ProfileSetupModalProps) {
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  
  const [formData, setFormData] = useState<ProfileSetupForm>({
    display_name: ''
  });

  const steps = ['Basic Info', 'Complete Setup'];

  const handleInputChange = (field: keyof ProfileSetupForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError(null);
  };

  // Simplified handlers for basic profile setup

  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.display_name.trim()) {
        setError('Please enter your name');
        return;
      }
    }

    setError(null);
    setCurrentStep(prev => prev + 1);
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    console.log('🔄 [PROFILE MODAL] Starting profile submission...');
    
    if (!user) {
      console.error('❌ [PROFILE MODAL] No user found');
      setError('User not found. Please sign in again.');
      return;
    }

    if (!formData.display_name.trim()) {
      console.error('❌ [PROFILE MODAL] Missing required fields');
      setError('Please enter your name');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const profileData = {
        user_id: user.id,
        full_name: formData.display_name.trim(), // Map display_name to full_name for Supabase
        avatar_url: avatarUrl || undefined
        // Note: country and sustainability_goal removed until table schema is updated
      };

      console.log('📝 [PROFILE MODAL] Updating profile with data:', profileData);
      const { error: updateError } = await updateProfile(profileData);
      
      if (updateError) {
        console.error('❌ [PROFILE MODAL] Profile update error:', updateError);
        setError(updateError);
        return;
      }

      console.log('✅ [PROFILE MODAL] Profile updated successfully!');
      
      // Track profile completion
      analytics.track(EVENTS.PROFILE_COMPLETED, {
        full_name: profileData.full_name,
        completion_method: 'modal'
      });
      
      // Update user properties
      analytics.setUserProperties({
        [USER_PROPERTIES.DISPLAY_NAME]: profileData.full_name
      });
      
      // Show success state
      setSuccess(true);
      
      // Close modal after showing success for 2 seconds
      setTimeout(() => {
        if (onClose) {
          onClose();
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ [PROFILE MODAL] Profile setup error:', error);
      setError(error.message || 'Failed to set up profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Avatar
                src={avatarUrl}
                sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
              >
                <Person sx={{ fontSize: 40 }} />
              </Avatar>
              <IconButton color="primary" component="label">
                <PhotoCamera />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        setAvatarUrl(e.target?.result as string);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </IconButton>
            </Box>
            
            <TextField
              fullWidth
              label="Your Name"
              value={formData.display_name}
              onChange={handleInputChange('display_name')}
              margin="normal"
              required
              placeholder="How should we call you?"
              helperText="This will be displayed on your profile"
            />
          </Box>
        );

      case 1:
        return (
          <Box sx={{ textAlign: 'center' }}>
            {success ? (
              <Box>
                <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Profile Complete!
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Welcome to ECTRACC, {formData.display_name}! 🎉
                </Typography>
              </Box>
            ) : (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Ready to get started?
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Let's complete your profile and start tracking your carbon footprint!
                </Typography>
                
                <Paper elevation={1} sx={{ p: 2, mb: 3, textAlign: 'left' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Profile Summary:
                  </Typography>
                  <Typography variant="body2">
                    <strong>Name:</strong> {formData.display_name}
                  </Typography>
                </Paper>
              </Box>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      disableEscapeKeyDown
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 1 }}>
        <Typography variant="h5" component="div">
          Complete Your Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Help us personalize your ECTRACC experience
        </Typography>
        
        {/* Progress indicator */}
        <Box sx={{ mt: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={(currentStep / (steps.length - 1)) * 100}
            sx={{ 
              height: 6, 
              borderRadius: 3,
              backgroundColor: 'grey.200',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                backgroundColor: 'primary.main'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Step {currentStep + 1} of {steps.length}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 2 }}>
        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Fade in={!!error}>
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </Fade>
        )}

        <Fade in={true} key={currentStep} timeout={300}>
          <Box>
            {getStepContent(currentStep)}
          </Box>
        </Fade>
      </DialogContent>

      {!success && (
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleBack}
            disabled={currentStep === 0 || isSubmitting}
          >
            Back
          </Button>
          
          <Box sx={{ flex: 1 }} />
          
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
            >
              {isSubmitting ? 'Saving...' : 'Complete Profile'}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              variant="contained"
              disabled={isSubmitting}
            >
              Next
            </Button>
          )}
        </DialogActions>
      )}
    </Dialog>
  );
}
