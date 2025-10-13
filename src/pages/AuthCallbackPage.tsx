import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get session from URL hash/query parameters
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth callback error:', error);
          setError('Authentication failed. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
          return;
        }

        if (data.session) {
          // OAuth successful - wait for auth context to update
          setTimeout(() => {
            // Check if user needs to complete profile setup
            if (!profile) {
              navigate('/profile-setup', { replace: true });
            } else {
              navigate('/dashboard', { replace: true });
            }
          }, 1000);
        } else {
          // No session found - redirect to login
          navigate('/login', { replace: true });
        }
      } catch (error: any) {
        console.error('Auth callback error:', error);
        setError('Authentication failed. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, profile]);

  // Auto-redirect based on auth state changes (only if we haven't already handled the callback)
  useEffect(() => {
    if (!loading && user && !error) {
      // Add a small delay to prevent race conditions on mobile
      const timeoutId = setTimeout(() => {
        if (!profile) {
          navigate('/profile-setup', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
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
          <Typography variant="body2" color="text.secondary">
            Redirecting to login page...
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



