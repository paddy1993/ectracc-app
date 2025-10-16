import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  Slide,
  useTheme,
  useMediaQuery,
  LinearProgress
} from '@mui/material';
import {
  Close,
  QrCodeScanner,
  EmojiNature as Eco,
  TrendingUp,
  Notifications,
  CameraAlt,
  CheckCircle,
  ArrowForward,
  ArrowBack
} from '@mui/icons-material';
import { TransitionProps } from '@mui/material/transitions';
import { motion, AnimatePresence } from 'framer-motion';
import { ENHANCED_COLORS } from '../../utils/enhancedColors';

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & {
    children: React.ReactElement<any, any>;
  },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  illustration?: React.ReactNode;
  action?: {
    label: string;
    handler: () => Promise<boolean>;
  };
  skipable?: boolean;
}

interface OnboardingFlowProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  showProgress?: boolean;
  allowSkip?: boolean;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({
  open,
  onClose,
  onComplete,
  showProgress = true,
  allowSkip = true
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Onboarding steps configuration
  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to ECTRACC',
      description: 'Track your carbon footprint and make sustainable choices for a better planet.',
      icon: <Eco sx={{ fontSize: 48, color: ENHANCED_COLORS.primary[500] }} />,
      illustration: (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <motion.div
            animate={{ 
              rotate: [0, 5, -5, 0],
              scale: [1, 1.05, 1]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Eco sx={{ fontSize: 120, color: ENHANCED_COLORS.primary[500] }} />
          </motion.div>
        </Box>
      )
    },
    {
      id: 'camera-permission',
      title: 'Enable Camera Access',
      description: 'Allow camera access to scan product barcodes quickly and easily.',
      icon: <CameraAlt sx={{ fontSize: 48, color: ENHANCED_COLORS.secondary[500] }} />,
      action: {
        label: 'Enable Camera',
        handler: async () => {
          try {
            await navigator.mediaDevices.getUserMedia({ video: true });
            return true;
          } catch (error) {
            console.error('Camera permission denied:', error);
            return false;
          }
        }
      },
      skipable: true,
      illustration: (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <QrCodeScanner sx={{ fontSize: 80, color: ENHANCED_COLORS.secondary[500] }} />
          </motion.div>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Scan barcodes to instantly get carbon footprint data
          </Typography>
        </Box>
      )
    },
    {
      id: 'notifications',
      title: 'Stay Updated',
      description: 'Get notified about your progress and new sustainability tips.',
      icon: <Notifications sx={{ fontSize: 48, color: ENHANCED_COLORS.semantic.info.main }} />,
      action: {
        label: 'Enable Notifications',
        handler: async () => {
          if ('Notification' in window) {
            const permission = await Notification.requestPermission();
            return permission === 'granted';
          }
          return false;
        }
      },
      skipable: true,
      illustration: (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Notifications sx={{ fontSize: 80, color: ENHANCED_COLORS.semantic.info.main }} />
          </motion.div>
        </Box>
      )
    },
    {
      id: 'first-scan',
      title: 'Try Your First Scan',
      description: 'Let\'s scan your first product to see how easy it is to track your carbon footprint.',
      icon: <QrCodeScanner sx={{ fontSize: 48, color: ENHANCED_COLORS.primary[500] }} />,
      action: {
        label: 'Start Scanning',
        handler: async () => {
          // Navigate to scanner page
          window.location.href = '/products/search?scan=true&onboarding=true';
          return true;
        }
      },
      illustration: (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <motion.div
            animate={{ 
              scale: [1, 1.2, 1],
              rotateY: [0, 180, 360]
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                border: `3px solid ${ENHANCED_COLORS.primary[500]}`,
                borderRadius: 2,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mx: 'auto',
                background: `linear-gradient(45deg, ${ENHANCED_COLORS.primary[50]}, ${ENHANCED_COLORS.primary[100]})`
              }}
            >
              <QrCodeScanner sx={{ fontSize: 40, color: ENHANCED_COLORS.primary[500] }} />
            </Box>
          </motion.div>
        </Box>
      )
    },
    {
      id: 'complete',
      title: 'You\'re All Set!',
      description: 'Start tracking your carbon footprint and make a positive impact on the environment.',
      icon: <CheckCircle sx={{ fontSize: 48, color: ENHANCED_COLORS.semantic.success.main }} />,
      illustration: (
        <Box sx={{ textAlign: 'center', py: 2 }}>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.2
            }}
          >
            <CheckCircle sx={{ fontSize: 120, color: ENHANCED_COLORS.semantic.success.main }} />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Typography variant="h6" sx={{ mt: 2, color: ENHANCED_COLORS.semantic.success.main }}>
              Welcome to your sustainability journey!
            </Typography>
          </motion.div>
        </Box>
      )
    }
  ];

  const handleNext = async () => {
    const currentStepData = steps[currentStep];
    
    if (currentStepData.action) {
      setIsLoading(true);
      try {
        const success = await currentStepData.action.handler();
        if (success) {
          setCompletedSteps(prev => new Set(Array.from(prev).concat([currentStep])));
        }
      } catch (error) {
        console.error('Action failed:', error);
      } finally {
        setIsLoading(false);
      }
    }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const currentStepData = steps[currentStep];
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <Dialog
      open={open}
      TransitionComponent={Transition}
      maxWidth="sm"
      fullWidth
      fullScreen={isMobile}
      disableEscapeKeyDown
      PaperProps={{
        sx: {
          borderRadius: isMobile ? 0 : 3,
          minHeight: isMobile ? '100vh' : 600,
          background: theme.palette.mode === 'dark' 
            ? 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)'
            : 'linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%)'
        }
      }}
    >
      <DialogContent sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          p: 2,
          borderBottom: `1px solid ${theme.palette.divider}`
        }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Getting Started
          </Typography>
          {allowSkip && (
            <IconButton 
              onClick={onClose}
              size="small"
              sx={{ color: theme.palette.text.secondary }}
            >
              <Close />
            </IconButton>
          )}
        </Box>

        {/* Progress */}
        {showProgress && (
          <Box sx={{ px: 2, py: 1 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{
                height: 6,
                borderRadius: 3,
                backgroundColor: theme.palette.divider,
                '& .MuiLinearProgress-bar': {
                  borderRadius: 3,
                  background: `linear-gradient(90deg, ${ENHANCED_COLORS.primary[500]}, ${ENHANCED_COLORS.primary[600]})`
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Step {currentStep + 1} of {steps.length}
            </Typography>
          </Box>
        )}

        {/* Stepper (desktop only) */}
        {!isMobile && (
          <Box sx={{ px: 3, py: 2 }}>
            <Stepper activeStep={currentStep} alternativeLabel>
              {steps.map((step, index) => (
                <Step key={step.id} completed={completedSteps.has(index)}>
                  <StepLabel>{step.title}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </Box>
        )}

        {/* Content */}
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 3 }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              style={{ width: '100%' }}
            >
              <Card sx={{ 
                textAlign: 'center',
                background: 'transparent',
                boxShadow: 'none',
                border: 'none'
              }}>
                <CardContent sx={{ p: 3 }}>
                  {/* Icon */}
                  <Box sx={{ mb: 2 }}>
                    {currentStepData.icon}
                  </Box>

                  {/* Title */}
                  <Typography 
                    variant="h4" 
                    component="h2" 
                    gutterBottom
                    sx={{ 
                      fontWeight: 700,
                      mb: 2,
                      color: theme.palette.text.primary
                    }}
                  >
                    {currentStepData.title}
                  </Typography>

                  {/* Description */}
                  <Typography 
                    variant="body1" 
                    color="text.secondary"
                    sx={{ mb: 3, maxWidth: 400, mx: 'auto' }}
                  >
                    {currentStepData.description}
                  </Typography>

                  {/* Illustration */}
                  {currentStepData.illustration && (
                    <Box sx={{ mb: 3 }}>
                      {currentStepData.illustration}
                    </Box>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Actions */}
        <Box sx={{ 
          p: 3, 
          borderTop: `1px solid ${theme.palette.divider}`,
          display: 'flex',
          gap: 2,
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          {/* Back button */}
          <Button
            onClick={handleBack}
            disabled={currentStep === 0}
            startIcon={<ArrowBack />}
            sx={{ visibility: currentStep === 0 ? 'hidden' : 'visible' }}
          >
            Back
          </Button>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {/* Skip button */}
            {currentStepData.skipable && allowSkip && (
              <Button
                onClick={handleSkip}
                color="inherit"
                disabled={isLoading}
              >
                Skip
              </Button>
            )}

            {/* Next/Action button */}
            <Button
              onClick={handleNext}
              variant="contained"
              size="large"
              disabled={isLoading}
              endIcon={currentStep === steps.length - 1 ? <CheckCircle /> : <ArrowForward />}
              sx={{
                minWidth: 120,
                background: `linear-gradient(45deg, ${ENHANCED_COLORS.primary[500]}, ${ENHANCED_COLORS.primary[600]})`,
                '&:hover': {
                  background: `linear-gradient(45deg, ${ENHANCED_COLORS.primary[600]}, ${ENHANCED_COLORS.primary[700]})`
                }
              }}
            >
              {isLoading ? 'Loading...' : 
               currentStepData.action ? currentStepData.action.label :
               currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default OnboardingFlow;
