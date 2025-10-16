import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Chip,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Close as CloseIcon,
  Info as InfoIcon,
  Person as UserIcon,
  Schedule as TimeIcon
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { API_BASE_URL } from '../../constants';
import { supabase } from '../../services/supabase';

interface PendingProduct {
  id: string;
  product_name: string;
  barcode?: string;
  brands: string[];
  categories: string[];
  carbon_footprint: number;
  carbon_footprint_source: string;
  carbon_footprint_justification: string;
  submitted_by: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by?: string;
  reviewed_at?: string;
  review_reason?: string;
  created_at: string;
  updated_at: string;
}

interface AdminProductReviewProps {
  productId: string;
  onReviewed: () => void;
  onClose: () => void;
}

export default function AdminProductReview({
  productId,
  onReviewed,
  onClose
}: AdminProductReviewProps) {
  const [product, setProduct] = useState<PendingProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewReason, setReviewReason] = useState('');
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_BASE_URL}/admin/pending-products/${productId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch product details');
      }

      setProduct(result.data);
    } catch (error) {
      console.error('Error fetching product:', error);
      setError(error instanceof Error ? error.message : 'Failed to load product');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          review_reason: reviewReason.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to approve product: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve product');
      }

      setShowApproveDialog(false);
      onReviewed();
    } catch (error) {
      console.error('Error approving product:', error);
      setError(error instanceof Error ? error.message : 'Failed to approve product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!reviewReason.trim()) {
      setError('Please provide a reason for rejection');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch(`${API_BASE_URL}/admin/products/${productId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          review_reason: reviewReason.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to reject product: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject product');
      }

      setShowRejectDialog(false);
      onReviewed();
    } catch (error) {
      console.error('Error rejecting product:', error);
      setError(error instanceof Error ? error.message : 'Failed to reject product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent>
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <CircularProgress />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Loading product details...
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <Alert severity="error">
            {error}
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <>
      <Card>
        <CardContent>
          {/* Header */}
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Typography variant="h6">
              Product Review
            </Typography>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Product Information */}
          <Box mb={3}>
            <Typography variant="h5" gutterBottom>
              {product.product_name}
            </Typography>
            
            <Box display="flex" gap={1} mb={2} flexWrap="wrap">
              <Chip
                label={`${product.carbon_footprint} kg CO₂e`}
                color="primary"
                size="small"
              />
              {product.barcode && (
                <Chip
                  label={`Barcode: ${product.barcode}`}
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>

            {product.brands.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Brands:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {product.brands.map((brand) => (
                    <Chip key={brand} label={brand} size="small" />
                  ))}
                </Box>
              </Box>
            )}

            {product.categories.length > 0 && (
              <Box mb={2}>
                <Typography variant="subtitle2" gutterBottom>
                  Categories:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                  {product.categories.map((category) => (
                    <Chip key={category} label={category} variant="outlined" size="small" />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Carbon Footprint Details */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Carbon Footprint Information
            </Typography>
            
            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Source:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {product.carbon_footprint_source}
              </Typography>
            </Box>

            <Box mb={2}>
              <Typography variant="subtitle2" gutterBottom>
                Justification:
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {product.carbon_footprint_justification}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Submission Details */}
          <Box mb={3}>
            <Typography variant="h6" gutterBottom>
              Submission Details
            </Typography>
            
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <UserIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                Submitted by: {product.submitted_by}
              </Typography>
            </Box>
            
            <Box display="flex" alignItems="center" gap={1}>
              <TimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {formatDistanceToNow(new Date(product.submitted_at), { addSuffix: true })}
              </Typography>
            </Box>
          </Box>

          {/* Review Status */}
          {product.status !== 'pending' && (
            <>
              <Divider sx={{ my: 2 }} />
              <Box mb={3}>
                <Typography variant="h6" gutterBottom>
                  Review Status
                </Typography>
                <Chip
                  label={product.status.toUpperCase()}
                  color={product.status === 'approved' ? 'success' : 'error'}
                  sx={{ mb: 1 }}
                />
                {product.review_reason && (
                  <Typography variant="body2" color="text.secondary">
                    Reason: {product.review_reason}
                  </Typography>
                )}
                {product.reviewed_at && (
                  <Typography variant="body2" color="text.secondary">
                    Reviewed {formatDistanceToNow(new Date(product.reviewed_at), { addSuffix: true })}
                  </Typography>
                )}
              </Box>
            </>
          )}

          {/* Action Buttons */}
          {product.status === 'pending' && (
            <Box display="flex" gap={2} mt={3}>
              <Button
                variant="contained"
                color="success"
                startIcon={<ApproveIcon />}
                onClick={() => setShowApproveDialog(true)}
                fullWidth
              >
                Approve
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<RejectIcon />}
                onClick={() => setShowRejectDialog(true)}
                fullWidth
              >
                Reject
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={showApproveDialog} onClose={() => setShowApproveDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Product</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Are you sure you want to approve "{product.product_name}"? 
            This will add it to the main product database and make it available to all users.
          </Typography>
          <TextField
            fullWidth
            label="Approval Note (Optional)"
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
            multiline
            rows={3}
            placeholder="Add any notes about this approval..."
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowApproveDialog(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleApprove}
            variant="contained"
            color="success"
            disabled={isSubmitting}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <ApproveIcon />}
          >
            {isSubmitting ? 'Approving...' : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onClose={() => setShowRejectDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Product</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" paragraph>
            Please provide a clear reason for rejecting "{product.product_name}". 
            This will help the user understand what needs to be improved.
          </Typography>
          <TextField
            fullWidth
            label="Rejection Reason (Required)"
            value={reviewReason}
            onChange={(e) => setReviewReason(e.target.value)}
            multiline
            rows={4}
            placeholder="Explain why this submission is being rejected..."
            margin="normal"
            required
            error={!reviewReason.trim()}
            helperText={!reviewReason.trim() ? 'Please provide a reason for rejection' : ''}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowRejectDialog(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleReject}
            variant="contained"
            color="error"
            disabled={isSubmitting || !reviewReason.trim()}
            startIcon={isSubmitting ? <CircularProgress size={20} /> : <RejectIcon />}
          >
            {isSubmitting ? 'Rejecting...' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
