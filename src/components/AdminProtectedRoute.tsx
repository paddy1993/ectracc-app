import React from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { useRequireAdmin } from '../hooks/useAdminAuth';
import { useAuth } from '../contexts/AuthContext';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const { isAdmin, isLoading, error, hasAccess } = useRequireAdmin();

  const isAuthenticated = !!user;

  // Show loading while checking authentication and admin status
  if (isLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        gap={2}
      >
        <CircularProgress size={48} />
        <Typography variant="body1" color="text.secondary">
          Verifying admin access...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Show error if there was a problem checking admin status
  if (error) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        gap={2}
        p={3}
      >
        <Alert severity="error" sx={{ maxWidth: 400 }}>
          {error}
        </Alert>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Please try refreshing the page or contact support if the problem persists.
        </Typography>
      </Box>
    );
  }

  // Show access denied if user is not an admin
  if (!isAdmin) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="60vh"
        gap={2}
        p={3}
      >
        <Alert severity="warning" sx={{ maxWidth: 400 }}>
          <Typography variant="h6" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body2">
            You don't have administrator privileges to access this page.
          </Typography>
        </Alert>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          If you believe this is an error, please contact an administrator.
        </Typography>
      </Box>
    );
  }

  // Render children if user has admin access
  if (hasAccess) {
    return <>{children}</>;
  }

  // Fallback - should not reach here
  return <Navigate to="/dashboard" replace />;
};

export default AdminProtectedRoute;
