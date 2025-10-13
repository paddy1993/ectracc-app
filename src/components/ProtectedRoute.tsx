import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Container, CircularProgress, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireProfile?: boolean;
}

export default function ProtectedRoute({ children, requireProfile = false }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Debug logging for mobile routing issues
  console.log('🛡️ ProtectedRoute check:', {
    path: location.pathname,
    requireProfile,
    loading,
    hasUser: !!user,
    hasProfile: !!profile,
    userEmail: user?.email
  });

  // Show loading spinner while checking auth state
  if (loading) {
    console.log('⏳ ProtectedRoute: Showing loading spinner');
    return (
      <Container>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '50vh'
          }}
        >
          <CircularProgress size={40} />
        </Box>
      </Container>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.log('🔐 ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If profile is required but doesn't exist, redirect to profile setup
  if (requireProfile && !profile) {
    console.log('👤 ProtectedRoute: User exists but no profile, redirecting to profile setup');
    return <Navigate to="/profile-setup" replace />;
  }

  console.log('✅ ProtectedRoute: Access granted');
  // Render protected content
  return <>{children}</>;
}



