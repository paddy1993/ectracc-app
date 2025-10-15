import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Layout from './Layout';
import SkeletonLoader from './SkeletonLoader';

// Lazy load all pages for better performance and code splitting
const LoginPage = lazy(() => import('../pages/LoginPage'));
const RegisterPage = lazy(() => import('../pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/ForgotPasswordPage'));
const AuthCallbackPage = lazy(() => import('../pages/AuthCallbackPage'));
const ProfileSetupPage = lazy(() => import('../pages/ProfileSetupPage'));
const HomePage = lazy(() => import('../pages/HomePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const ProductSearchPage = lazy(() => import('../pages/ProductSearchPage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const ScannerPage = lazy(() => import('../pages/ScannerPage'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const TrackerPage = lazy(() => import('../pages/TrackerPage'));
const HistoryPage = lazy(() => import('../pages/HistoryPage'));
const AboutDataPage = lazy(() => import('../pages/AboutDataPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const AccessibilitySettings = lazy(() => import('../components/accessibility/AccessibilitySettings'));

// Loading component for different page types
const PageLoader = ({ variant }: { variant?: 'dashboard' | 'history' | 'product-search' }) => (
  <SkeletonLoader variant={variant || 'dashboard'} />
);

// Dashboard component (already protected by parent route)
const ProtectedDashboardPage = () => (
  <DashboardPage />
);

export default function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <Suspense fallback={<PageLoader />}>
          <LoginPage />
        </Suspense>
      } />
      <Route path="/register" element={
        <Suspense fallback={<PageLoader />}>
          <RegisterPage />
        </Suspense>
      } />
      <Route path="/forgot-password" element={
        <Suspense fallback={<PageLoader />}>
          <ForgotPasswordPage />
        </Suspense>
      } />
      <Route path="/auth/callback" element={
        <Suspense fallback={<PageLoader />}>
          <AuthCallbackPage />
        </Suspense>
      } />
      
      {/* Profile setup (requires auth but not profile) */}
      <Route
        path="/profile-setup"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <ProfileSetupPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Protected routes with layout - profile setup handled by dashboard modal */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={
          <Suspense fallback={<PageLoader variant="dashboard" />}>
            <ProtectedDashboardPage />
          </Suspense>
        } />
        <Route path="home" element={
          <Suspense fallback={<PageLoader />}>
            <HomePage />
          </Suspense>
        } />
        <Route path="profile" element={
          <Suspense fallback={<PageLoader />}>
            <ProfilePage />
          </Suspense>
        } />
        <Route path="settings" element={
          <Suspense fallback={<PageLoader />}>
            <SettingsPage />
          </Suspense>
        } />
        <Route path="products/search" element={
          <Suspense fallback={<PageLoader variant="product-search" />}>
            <ProductSearchPage />
          </Suspense>
        } />
        <Route path="products/:id" element={
          <Suspense fallback={<PageLoader />}>
            <ProductDetailPage />
          </Suspense>
        } />
        <Route path="tracker" element={
          <Suspense fallback={<PageLoader />}>
            <TrackerPage />
          </Suspense>
        } />
        <Route path="history" element={
          <Suspense fallback={<PageLoader variant="history" />}>
            <HistoryPage />
          </Suspense>
        } />
        <Route path="about-data" element={
          <Suspense fallback={<PageLoader />}>
            <AboutDataPage />
          </Suspense>
        } />
        <Route path="about" element={
          <Suspense fallback={<PageLoader />}>
            <AboutPage />
          </Suspense>
        } />
        <Route path="accessibility" element={
          <Suspense fallback={<PageLoader />}>
            <AccessibilitySettings />
          </Suspense>
        } />
      </Route>

      {/* Scanner route (fullscreen, no layout) */}
      <Route
        path="/scanner"
        element={
          <ProtectedRoute>
            <Suspense fallback={<PageLoader />}>
              <ScannerPage />
            </Suspense>
          </ProtectedRoute>
        }
      />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
