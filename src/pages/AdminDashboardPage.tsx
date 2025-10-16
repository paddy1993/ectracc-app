import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Badge
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Dashboard as DashboardIcon,
  Pending as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import AdminProtectedRoute from '../components/AdminProtectedRoute';
import AdminStats from '../components/admin/AdminStats';
import PendingProductsList from '../components/admin/PendingProductsList';
import AdminProductReview from '../components/admin/AdminProductReview';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    setSelectedProductId(null); // Clear selection when switching tabs
  };

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
  };

  const handleProductReviewed = () => {
    setSelectedProductId(null);
    setRefreshKey(prev => prev + 1); // Trigger refresh of lists
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <AdminProtectedRoute>
      <Container maxWidth="xl" sx={{ mt: 3, mb: 4 }}>
        {/* Header */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h4" component="h1" fontWeight="bold" gutterBottom>
              Admin Dashboard
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Review and manage user-submitted products
            </Typography>
          </Box>
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>

        {/* Admin Stats */}
        <AdminStats key={refreshKey} />

        {/* Main Content */}
        <Card sx={{ mt: 3 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={currentTab} onChange={handleTabChange} aria-label="admin dashboard tabs">
              <Tab
                icon={<PendingIcon />}
                label="Pending Review"
                id="admin-tab-0"
                aria-controls="admin-tabpanel-0"
              />
              <Tab
                icon={<ApprovedIcon />}
                label="Approved"
                id="admin-tab-1"
                aria-controls="admin-tabpanel-1"
              />
              <Tab
                icon={<RejectedIcon />}
                label="Rejected"
                id="admin-tab-2"
                aria-controls="admin-tabpanel-2"
              />
            </Tabs>
          </Box>

          <TabPanel value={currentTab} index={0}>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: selectedProductId ? 6 : 12 }}>
                <PendingProductsList
                  status="pending"
                  onProductSelect={handleProductSelect}
                  selectedProductId={selectedProductId}
                  refreshKey={refreshKey}
                />
              </Grid>
              
              {selectedProductId && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <AdminProductReview
                    productId={selectedProductId}
                    onReviewed={handleProductReviewed}
                    onClose={() => setSelectedProductId(null)}
                  />
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={currentTab} index={1}>
            <PendingProductsList
              status="approved"
              onProductSelect={handleProductSelect}
              selectedProductId={selectedProductId}
              refreshKey={refreshKey}
            />
          </TabPanel>

          <TabPanel value={currentTab} index={2}>
            <PendingProductsList
              status="rejected"
              onProductSelect={handleProductSelect}
              selectedProductId={selectedProductId}
              refreshKey={refreshKey}
            />
          </TabPanel>
        </Card>

        {/* Help Text */}
        <Alert severity="info" sx={{ mt: 3 }}>
          <Typography variant="body2">
            <strong>Admin Guidelines:</strong> Review each product submission carefully. 
            Ensure carbon footprint values are reasonable and sources are credible. 
            Provide clear feedback when rejecting submissions to help users improve future submissions.
          </Typography>
        </Alert>
      </Container>
    </AdminProtectedRoute>
  );
}
