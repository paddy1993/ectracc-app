import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const handleAuthCallback = async (isRetry = false) => {
    try {
      console.log('🔄 Handling auth callback...', { isRetry, retryCount });
      
      // For mobile browsers, try to get session from URL first
      const urlParams = new URLSearchParams(window.location.search);
      const urlHash = window.location.hash;
      
      console.log('📱 URL params:', urlParams.toString());
      console.log('📱 URL hash:', urlHash);
      
      // Check for OAuth errors in URL
      if (urlParams.get('error')) {
        const errorDescription = urlParams.get('error_description') || 'OAuth authentication failed';
        console.error('OAuth error from URL:', errorDescription);
        setError(errorDescription);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Get session from Supabase
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('❌ Auth callback error:', error);
        
        // Retry logic for mobile browsers
        if (retryCount < 3 && !isRetry) {
          console.log('🔄 Retrying auth callback...');
          setRetryCount(prev => prev + 1);
          setTimeout(() => handleAuthCallback(true), 1000);
          return;
        }
        
        setError('Authentication failed. Please try signing in again.');
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (data.session) {
        console.log('✅ OAuth successful, session found');
        
        // Wait longer for auth context to update on mobile
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const waitTime = isMobile ? 2000 : 1000;
        
        setTimeout(() => {
          // Always redirect to dashboard - profile setup questionnaire removed
          console.log('🏠 Redirecting to dashboard (profile setup questionnaire disabled)');
          navigate('/dashboard', { replace: true });
        }, waitTime);
      } else {
        console.log('❌ No session found, redirecting to login');
        navigate('/login', { replace: true });
      }
    } catch (error: any) {
      console.error('❌ Auth callback error:', error);
      
      // Retry logic
      if (retryCount < 3) {
        console.log('🔄 Retrying due to error...');
        setRetryCount(prev => prev + 1);
        setTimeout(() => handleAuthCallback(true), 1000);
        return;
      }
      
      setError('Authentication failed. Please try again.');
      setTimeout(() => navigate('/login'), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleAuthCallback();
  }, [navigate]);

  // Auto-redirect based on auth state changes (only if we haven't already handled the callback)
  useEffect(() => {
    if (!loading && user && !error) {
      // Add a small delay to prevent race conditions on mobile
      const timeoutId = setTimeout(() => {
        // Always redirect to dashboard - profile setup questionnaire removed
        navigate('/dashboard', { replace: true });
      }, 500);
      
      return () => clearTimeout(timeoutId);
    }
  }, [user, profile, loading, navigate, error]);

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ mt: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
          <Box sx={{ mb: 3 }}>
            <Button
              variant="contained"
              onClick={() => {
                setError(null);
                setLoading(true);
                setRetryCount(0);
                handleAuthCallback();
              }}
              sx={{ mr: 2 }}
            >
              Try Again
            </Button>
            <Button
              variant="outlined"
              onClick={() => navigate('/login')}
            >
              Back to Login
            </Button>
          </Box>
          <Typography variant="body2" color="text.secondary">
            Having trouble? Try signing in again or contact support.
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center'
        }}
      >
        <CircularProgress size={48} sx={{ mb: 3 }} />
        <Typography variant="h6" gutterBottom>
          Completing sign in...
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Please wait while we set up your account
        </Typography>
      </Box>
    </Container>
  );
}



