import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Alert,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  InputAdornment
} from '@mui/material';
import {
  Inventory as ProductIcon,
  Search as SearchIcon,
  Schedule as PendingIcon,
  CheckCircle as ApprovedIcon,
  Cancel as RejectedIcon
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

interface PendingProductsListProps {
  status: 'pending' | 'approved' | 'rejected';
  onProductSelect: (productId: string) => void;
  selectedProductId?: string | null;
  refreshKey?: number;
}

export default function PendingProductsList({
  status,
  onProductSelect,
  selectedProductId,
  refreshKey = 0
}: PendingProductsListProps) {
  const [products, setProducts] = useState<PendingProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState('submitted_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchProducts();
  }, [status, page, sortBy, sortOrder, refreshKey]);

  useEffect(() => {
    // Reset to page 1 when changing filters
    setPage(1);
  }, [status, sortBy, sortOrder, searchQuery]);

  const fetchProducts = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('No authentication token available');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status,
        sortBy,
        sortOrder
      });

      const response = await fetch(`${API_BASE_URL}/admin/pending-products?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch products');
      }

      setProducts(result.data.products);
      setTotalPages(result.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError(error instanceof Error ? error.message : 'Failed to load products');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (productStatus: string) => {
    switch (productStatus) {
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'approved':
        return <ApprovedIcon color="success" />;
      case 'rejected':
        return <RejectedIcon color="error" />;
      default:
        return <ProductIcon />;
    }
  };

  const getStatusColor = (productStatus: string) => {
    switch (productStatus) {
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredProducts = products.filter(product =>
    searchQuery === '' ||
    product.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.brands.some(brand => brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
    product.categories.some(category => category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
        <Typography variant="body2" sx={{ ml: 2 }}>
          Loading {status} products...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" textTransform="capitalize">
          {status} Products ({filteredProducts.length})
        </Typography>
      </Box>

      {/* Filters */}
      <Box display="flex" gap={2} mb={3} flexWrap="wrap">
        <TextField
          size="small"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            )
          }}
          sx={{ minWidth: 200 }}
        />

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Sort By</InputLabel>
          <Select
            value={sortBy}
            label="Sort By"
            onChange={(e) => setSortBy(e.target.value)}
          >
            <MenuItem value="submitted_at">Submitted</MenuItem>
            <MenuItem value="product_name">Name</MenuItem>
            <MenuItem value="carbon_footprint">Carbon Footprint</MenuItem>
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 100 }}>
          <InputLabel>Order</InputLabel>
          <Select
            value={sortOrder}
            label="Order"
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <MenuItem value="desc">Newest</MenuItem>
            <MenuItem value="asc">Oldest</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Products List */}
      {filteredProducts.length === 0 ? (
        <Alert severity="info">
          No {status} products found.
        </Alert>
      ) : (
        <List>
          {filteredProducts.map((product) => (
            <ListItem key={product.id} disablePadding>
              <ListItemButton
                selected={selectedProductId === product.id}
                onClick={() => onProductSelect(product.id)}
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  '&.Mui-selected': {
                    borderColor: 'primary.main',
                    bgcolor: 'primary.50'
                  }
                }}
              >
                <ListItemIcon>
                  {getStatusIcon(product.status)}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                      <Typography variant="subtitle1" component="span">
                        {product.product_name}
                      </Typography>
                      <Chip
                        label={`${product.carbon_footprint} kg CO₂e`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                      {product.barcode && (
                        <Chip
                          label={product.barcode}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Submitted {formatDistanceToNow(new Date(product.submitted_at), { addSuffix: true })}
                      </Typography>
                      
                      {product.brands.length > 0 && (
                        <Box display="flex" gap={0.5} mt={0.5} flexWrap="wrap">
                          {product.brands.slice(0, 2).map((brand) => (
                            <Chip
                              key={brand}
                              label={brand}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.7rem', height: 20 }}
                            />
                          ))}
                          {product.brands.length > 2 && (
                            <Typography variant="caption" color="text.secondary">
                              +{product.brands.length - 2} more
                            </Typography>
                          )}
                        </Box>
                      )}

                      {product.status !== 'pending' && product.reviewed_at && (
                        <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                          Reviewed {formatDistanceToNow(new Date(product.reviewed_at), { addSuffix: true })}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={3}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(event, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
}
