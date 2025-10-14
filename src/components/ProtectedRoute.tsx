import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Container, CircularProgress, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Debug logging
  console.log('🛡️ ProtectedRoute check:', {
    path: location.pathname,
    loading,
    hasUser: !!user,
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

  console.log('✅ ProtectedRoute: Access granted - user authenticated');
  // Render protected content for all authenticated users
  return <>{children}</>;
}



