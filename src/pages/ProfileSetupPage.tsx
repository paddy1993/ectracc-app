// DEPRECATED: This page is now replaced by ProfileSetupModal in DashboardPage
// Users are no longer redirected here - the modal appears on dashboard instead
// This file is kept for backward compatibility but should not be used

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  Avatar,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Stepper,
  Step,
  StepLabel
} from '@mui/material';
import {
  PhotoCamera,
  Person,
  EmojiNature as Eco
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { ProfileSetupForm } from '../types';
import analytics, { EVENTS, USER_PROPERTIES } from '../services/analytics';
import { APP_NAME } from '../constants';

const sustainabilityGoals = [
  'Learn about the carbon footprint of products I buy',
  'Track 50+ products to understand my consumption patterns',
  'Discover which product categories have the highest impact',
  'Compare carbon footprints across different brands',
  'Build awareness of my daily consumption choices',
  'Understand the environmental impact of my purchases'
];

// English-speaking countries first, then others alphabetically
const englishSpeakingCountries = [
  'United States',
  'United Kingdom',
  'Canada',
  'Australia',
  'New Zealand',
  'Ireland',
  'South Africa'
];

const otherCountries = [
  'Afghanistan',
  'Albania',
  'Algeria',
  'Andorra',
  'Angola',
  'Antigua and Barbuda',
  'Argentina',
  'Armenia',
  'Austria',
  'Azerbaijan',
  'Bahamas',
  'Bahrain',
  'Bangladesh',
  'Barbados',
  'Belarus',
  'Belgium',
  'Belize',
  'Benin',
  'Bhutan',
  'Bolivia',
  'Bosnia and Herzegovina',
  'Botswana',
  'Brazil',
  'Brunei',
  'Bulgaria',
  'Burkina Faso',
  'Burundi',
  'Cabo Verde',
  'Cambodia',
  'Cameroon',
  'Central African Republic',
  'Chad',
  'Chile',
  'China',
  'Colombia',
  'Comoros',
  'Congo',
  'Costa Rica',
  'Croatia',
  'Cuba',
  'Cyprus',
  'Czech Republic',
  'Democratic Republic of the Congo',
  'Denmark',
  'Djibouti',
  'Dominica',
  'Dominican Republic',
  'Ecuador',
  'Egypt',
  'El Salvador',
  'Equatorial Guinea',
  'Eritrea',
  'Estonia',
  'Eswatini',
  'Ethiopia',
  'Fiji',
  'Finland',
  'France',
  'Gabon',
  'Gambia',
  'Georgia',
  'Germany',
  'Ghana',
  'Greece',
  'Grenada',
  'Guatemala',
  'Guinea',
  'Guinea-Bissau',
  'Guyana',
  'Haiti',
  'Honduras',
  'Hungary',
  'Iceland',
  'India',
  'Indonesia',
  'Iran',
  'Iraq',
  'Israel',
  'Italy',
  'Ivory Coast',
  'Jamaica',
  'Japan',
  'Jordan',
  'Kazakhstan',
  'Kenya',
  'Kiribati',
  'Kuwait',
  'Kyrgyzstan',
  'Laos',
  'Latvia',
  'Lebanon',
  'Lesotho',
  'Liberia',
  'Libya',
  'Liechtenstein',
  'Lithuania',
  'Luxembourg',
  'Madagascar',
  'Malawi',
  'Malaysia',
  'Maldives',
  'Mali',
  'Malta',
  'Marshall Islands',
  'Mauritania',
  'Mauritius',
  'Mexico',
  'Micronesia',
  'Moldova',
  'Monaco',
  'Mongolia',
  'Montenegro',
  'Morocco',
  'Mozambique',
  'Myanmar',
  'Namibia',
  'Nauru',
  'Nepal',
  'Netherlands',
  'New Zealand',
  'Nicaragua',
  'Niger',
  'Nigeria',
  'North Korea',
  'North Macedonia',
  'Norway',
  'Oman',
  'Pakistan',
  'Palau',
  'Palestine',
  'Panama',
  'Papua New Guinea',
  'Paraguay',
  'Peru',
  'Philippines',
  'Poland',
  'Portugal',
  'Qatar',
  'Romania',
  'Russia',
  'Rwanda',
  'Saint Kitts and Nevis',
  'Saint Lucia',
  'Saint Vincent and the Grenadines',
  'Samoa',
  'San Marino',
  'Sao Tome and Principe',
  'Saudi Arabia',
  'Senegal',
  'Serbia',
  'Seychelles',
  'Sierra Leone',
  'Singapore',
  'Slovakia',
  'Slovenia',
  'Solomon Islands',
  'Somalia',
  'South Africa',
  'South Korea',
  'South Sudan',
  'Spain',
  'Sri Lanka',
  'Sudan',
  'Suriname',
  'Sweden',
  'Switzerland',
  'Syria',
  'Taiwan',
  'Tajikistan',
  'Tanzania',
  'Thailand',
  'Timor-Leste',
  'Togo',
  'Tonga',
  'Trinidad and Tobago',
  'Tunisia',
  'Turkey',
  'Turkmenistan',
  'Tuvalu',
  'Uganda',
  'Ukraine',
  'United Arab Emirates',
  'Uruguay',
  'Uzbekistan',
  'Vanuatu',
  'Vatican City',
  'Venezuela',
  'Vietnam',
  'Yemen',
  'Zambia',
  'Zimbabwe'
];

// Combine English-speaking countries first, then others
const countries = [...englishSpeakingCountries, ...otherCountries];

export default function ProfileSetupPage() {
  const navigate = useNavigate();
  const { user, profile, updateProfile, loading } = useAuth();
  
  const [formData, setFormData] = useState<ProfileSetupForm>({
    display_name: '',
    country: '',
    sustainability_goal: ''
  });
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [profileUpdateCompleted, setProfileUpdateCompleted] = useState(false);

  const steps = ['Basic Info', 'Sustainability Goal', 'Complete Setup'];

  // Redirect to dashboard if user already has a profile
  React.useEffect(() => {
    console.log('🔍 [PROFILE SETUP] Checking redirect conditions:', {
      loading,
      hasProfile: !!profile,
      profileDisplayName: profile?.display_name
    });
    
    if (!loading && profile) {
      console.log('✅ [PROFILE SETUP] User already has profile, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
      return;
    }
    
    // Check if profile setup was recently completed (within last 5 minutes)
    const profileSetupCompleted = localStorage.getItem('profileSetupCompleted') === 'true';
    const profileSetupCompletedAt = localStorage.getItem('profileSetupCompletedAt');
    const recentlyCompleted = profileSetupCompleted && profileSetupCompletedAt && 
      (Date.now() - parseInt(profileSetupCompletedAt)) < 300000; // 5 minutes
    
    if (recentlyCompleted && !loading) {
      console.log('🔄 [PROFILE SETUP] Profile setup was recently completed, redirecting to dashboard');
      navigate('/dashboard', { replace: true });
    }
  }, [loading, profile, navigate]);

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
      if (!formData.display_name.trim()) {
        setError('Please enter your display name');
        return;
      }
      if (!formData.country) {
        setError('Please select your country');
        return;
      }
    } else if (currentStep === 1) {
      if (!formData.sustainability_goal) {
        setError('Please select a learning goal');
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
    console.log('🔄 [PROFILE SETUP] handleSubmit called');
    
    if (!user) {
      console.error('❌ [PROFILE SETUP] No user found');
      setError('User not found. Please sign in again.');
      return;
    }

    if (!formData.display_name.trim() || !formData.country || !formData.sustainability_goal) {
      console.error('❌ [PROFILE SETUP] Missing required fields:', { 
        display_name: formData.display_name.trim(), 
        country: formData.country, 
        sustainability_goal: formData.sustainability_goal 
      });
      setError('Please complete all required fields');
      return;
    }

    console.log('✅ [PROFILE SETUP] Starting profile submission...');
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

      console.log('📝 [PROFILE SETUP] Updating profile with data:', profileData);
      const { error: updateError } = await updateProfile(profileData);
      
      if (updateError) {
        console.error('❌ [PROFILE SETUP] Profile update error:', updateError);
        setError(updateError);
        return;
      }

      console.log('✅ [PROFILE SETUP] Profile updated successfully!');
      
      // Track profile completion
      analytics.track(EVENTS.PROFILE_COMPLETED, {
        display_name: profileData.display_name,
        sustainability_goal: profileData.sustainability_goal
      });
      
      // Update user properties
      analytics.setUserProperties({
        [USER_PROPERTIES.DISPLAY_NAME]: profileData.display_name,
        [USER_PROPERTIES.SUSTAINABILITY_GOAL]: profileData.sustainability_goal
      });
      
      // Set localStorage flags to prevent redirect loops
      localStorage.setItem('profileSetupCompleted', 'true');
      localStorage.setItem('profileSetupCompletedAt', Date.now().toString());
      
      console.log('🎯 [PROFILE SETUP] Profile setup completed successfully! Navigating to dashboard...');
      
      // Clear any existing error state
      setError(null);
      setIsSubmitting(false);
      
      // IMMEDIATE NAVIGATION: Navigate directly without waiting for context updates
      // This prevents race conditions with useEffect hooks
      console.log('🚀 [PROFILE SETUP] Executing immediate navigation to dashboard');
      navigate('/dashboard', { replace: true });
      
      // Fallback: If React Router navigation fails, use window.location as backup
      setTimeout(() => {
        if (window.location.pathname !== '/dashboard') {
          console.log('🔄 [PROFILE SETUP] React Router navigation may have failed, using window.location fallback');
          window.location.replace('/dashboard');
        }
      }, 2000);
      
    } catch (error: any) {
      console.error('❌ [PROFILE SETUP] Profile setup error:', error);
      setError(error.message || 'Failed to set up profile');
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
                sx={{ width: 100, height: 100, mx: 'auto', mb: 2 }}
              >
                <Person sx={{ fontSize: 50 }} />
              </Avatar>
              <IconButton color="primary" component="label">
                <PhotoCamera />
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    // Handle avatar upload (placeholder for now)
                    console.log('Avatar upload:', e.target.files?.[0]);
                  }}
                />
              </IconButton>
              <Typography variant="caption" display="block" color="text.secondary">
                Add a profile photo (optional)
              </Typography>
            </Box>

            <TextField
              fullWidth
              label="Display Name"
              value={formData.display_name}
              onChange={handleInputChange('display_name')}
              margin="normal"
              required
              autoFocus
              placeholder="What should we call you?"
              helperText="This name will be visible to others"
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
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Eco sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                What would you like to learn about?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Choose your main interest to help us personalize your carbon literacy journey
              </Typography>
            </Box>

            <FormControl fullWidth margin="normal" required>
              <InputLabel>Learning Goal</InputLabel>
              <Select
                value={formData.sustainability_goal}
                onChange={handleGoalChange}
                label="Learning Goal"
              >
                {sustainabilityGoals.map((goal) => (
                  <MenuItem key={goal} value={goal}>
                    {goal}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              src={avatarUrl}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2 }}
            >
              <Person sx={{ fontSize: 40 }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              Welcome, {formData.display_name}! 🎉
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Country: {formData.country}
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your learning focus: {formData.sustainability_goal}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              You're all set to start building your carbon literacy with {APP_NAME}!
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Alert severity="warning">
          Please sign in to complete your profile setup.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            Complete Your Profile
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Let's personalize your {APP_NAME} experience
          </Typography>
        </Box>

        <Stepper activeStep={currentStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ mb: 4 }}>
          {getStepContent(currentStep)}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            onClick={handleBack}
            disabled={currentStep === 0 || loading}
            sx={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
          >
            Back
          </Button>

          {currentStep === steps.length - 1 ? (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  console.log('User chose to skip profile setup');
                  navigate('/dashboard', { replace: true });
                }}
                disabled={loading || isSubmitting}
                size="large"
              >
                Skip for Now
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  console.log('🔘 Complete Setup button clicked!');
                  alert('Complete Setup button clicked! Check console for details.');
                  handleSubmit();
                }}
                disabled={loading || isSubmitting}
                size="large"
              >
                {isSubmitting ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  'Complete Setup'
                )}
              </Button>
            </Box>
          ) : (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={loading}
              size="large"
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
}
