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
  country: string;
  sustainability_goal: string;
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

// Country options (same as ProfileSetupPage)
const englishSpeakingCountries = [
  'United States', 'United Kingdom', 'Canada', 'Australia', 'New Zealand', 'Ireland'
];

const otherCountries = [
  'Germany', 'France', 'Spain', 'Italy', 'Netherlands', 'Belgium', 'Switzerland',
  'Austria', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Poland', 'Czech Republic',
  'Portugal', 'Greece', 'Hungary', 'Romania', 'Bulgaria', 'Croatia', 'Slovenia',
  'Slovakia', 'Estonia', 'Latvia', 'Lithuania', 'Luxembourg', 'Malta', 'Cyprus',
  'Japan', 'South Korea', 'Singapore', 'Hong Kong', 'Taiwan', 'India', 'China',
  'Brazil', 'Mexico', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela',
  'South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Egypt', 'Morocco', 'Tunisia',
  'Israel', 'Turkey', 'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain',
  'Russia', 'Ukraine', 'Belarus', 'Kazakhstan', 'Uzbekistan', 'Georgia',
  'Thailand', 'Vietnam', 'Philippines', 'Indonesia', 'Malaysia', 'Myanmar',
  'Cambodia', 'Laos', 'Bangladesh', 'Pakistan', 'Sri Lanka', 'Nepal',
  'Afghanistan', 'Iran', 'Iraq', 'Jordan', 'Lebanon', 'Syria', 'Yemen',
  'Oman', 'Ethiopia', 'Tanzania', 'Uganda', 'Rwanda', 'Botswana', 'Namibia',
  'Zambia', 'Zimbabwe', 'Mozambique', 'Madagascar', 'Mauritius', 'Seychelles'
];

const countries = [...englishSpeakingCountries, ...otherCountries];

const sustainabilityGoals = [
  { value: 'reduce_waste', label: 'Reduce Waste & Packaging' },
  { value: 'eat_local', label: 'Eat More Local & Seasonal Food' },
  { value: 'plant_based', label: 'Increase Plant-Based Eating' },
  { value: 'carbon_footprint', label: 'Lower My Carbon Footprint' },
  { value: 'ethical_brands', label: 'Support Ethical Brands' },
  { value: 'learn_impact', label: 'Learn About Environmental Impact' }
];

export default function ProfileSetupModal({ open, onClose }: ProfileSetupModalProps) {
  const { user, updateProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  
  const [formData, setFormData] = useState<ProfileSetupForm>({
    display_name: '',
    country: '',
    sustainability_goal: ''
  });

  const steps = ['Basic Info', 'Sustainability Goal', 'Complete Setup'];

  const handleInputChange = (field: keyof ProfileSetupForm) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
    if (error) setError(null);
  };

  const handleGoalChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      sustainability_goal: event.target.value as string
    }));
    if (error) setError(null);
  };

  const handleCountryChange = (event: any) => {
    setFormData(prev => ({
      ...prev,
      country: event.target.value as string
    }));
    if (error) setError(null);
  };

  const handleNext = () => {
    if (currentStep === 0) {
      if (!formData.display_name.trim() || !formData.country) {
        setError('Please complete all required fields');
        return;
      }
    }
    
    if (currentStep === 1) {
      if (!formData.sustainability_goal) {
        setError('Please select a sustainability goal');
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

    if (!formData.display_name.trim() || !formData.country || !formData.sustainability_goal) {
      console.error('❌ [PROFILE MODAL] Missing required fields');
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const profileData = {
        user_id: user.id,
        display_name: formData.display_name.trim(),
        country: formData.country,
        sustainability_goal: formData.sustainability_goal,
        avatar_url: avatarUrl || undefined
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
        display_name: profileData.display_name,
        sustainability_goal: profileData.sustainability_goal,
        completion_method: 'modal'
      });
      
      // Update user properties
      analytics.setUserProperties({
        [USER_PROPERTIES.DISPLAY_NAME]: profileData.display_name,
        [USER_PROPERTIES.SUSTAINABILITY_GOAL]: profileData.sustainability_goal
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
              label="Display Name"
              value={formData.display_name}
              onChange={handleInputChange('display_name')}
              margin="normal"
              required
              placeholder="How should we call you?"
            />
            
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Country</InputLabel>
              <Select
                value={formData.country}
                onChange={handleCountryChange}
                label="Country"
              >
                {countries.map((country) => (
                  <MenuItem key={country} value={country}>
                    {country}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              What's your main sustainability goal?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              This helps us personalize your experience and recommendations.
            </Typography>
            
            <FormControl component="fieldset" fullWidth>
              <RadioGroup
                value={formData.sustainability_goal}
                onChange={handleGoalChange}
              >
                {sustainabilityGoals.map((goal) => (
                  <FormControlLabel
                    key={goal.value}
                    value={goal.value}
                    control={<Radio />}
                    label={goal.label}
                    sx={{ mb: 1 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </Box>
        );

      case 2:
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
                  <Typography variant="body2">
                    <strong>Country:</strong> {formData.country}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Goal:</strong> {sustainabilityGoals.find(g => g.value === formData.sustainability_goal)?.label}
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
