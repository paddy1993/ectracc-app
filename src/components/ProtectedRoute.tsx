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
  
  // Check if user just completed profile setup
  const profileJustCompleted = location.state?.profileJustCompleted;
  
  // Check localStorage for recent profile completion (within last 30 seconds)
  const profileSetupCompleted = localStorage.getItem('profileSetupCompleted') === 'true';
  const profileSetupCompletedAt = localStorage.getItem('profileSetupCompletedAt');
  const recentlyCompleted = profileSetupCompletedAt && 
    (Date.now() - parseInt(profileSetupCompletedAt)) < 30000; // 30 seconds

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
  // UNLESS the user just completed profile setup (to prevent redirect loops)
  if (requireProfile && !profile && !profileJustCompleted && !recentlyCompleted) {
    console.log('👤 ProtectedRoute: User exists but no profile, redirecting to profile setup');
    return <Navigate to="/profile-setup" replace />;
  }
  
  // If profile was just completed, allow access even if profile context hasn't updated yet
  if (requireProfile && !profile && (profileJustCompleted || recentlyCompleted)) {
    console.log('✅ ProtectedRoute: Profile just completed, allowing access while context updates');
    
    // Clear the localStorage flag after successful access
    if (recentlyCompleted) {
      setTimeout(() => {
        localStorage.removeItem('profileSetupCompleted');
        localStorage.removeItem('profileSetupCompletedAt');
      }, 5000);
    }
  }

  console.log('✅ ProtectedRoute: Access granted');
  // Render protected content
  return <>{children}</>;
}



