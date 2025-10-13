import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  Collapse,
  Divider,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress
} from '@mui/material';
import {
  Delete,
  ExpandMore,
  ExpandLess,
  EmojiNature as Eco,
  CalendarToday,
  Scale,
  Category
} from '@mui/icons-material';
import { UserFootprintEntry } from '../../services/userFootprintApi';

interface HistoryEntryProps {
  entry: UserFootprintEntry;
  onDelete: (entry: UserFootprintEntry) => Promise<void>;
  formatCarbonFootprint: (value: number) => string;
}

export default function HistoryEntry({ entry, onDelete, formatCarbonFootprint }: HistoryEntryProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [expanded, setExpanded] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(entry);
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Delete failed:', error);
    } finally {
      setDeleting(false);
    }
  };

  const totalCarbon = entry.carbon_footprint * entry.quantity;
  const category = (entry as any).category || 'Other';
  
  // Get category color
  const getCategoryColor = (cat: string) => {
    const colors = {
      'Food': theme.palette.success.main,
      'Transport': theme.palette.info.main,
      'Energy': theme.palette.warning.main,
      'Shopping': theme.palette.secondary.main,
      'Other': theme.palette.grey[500]
    };
    return colors[cat as keyof typeof colors] || colors.Other;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (isMobile) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <>
      <Card 
        sx={{ 
          mb: 1,
          '&:hover': {
            boxShadow: theme.shadows[4]
          },
          transition: 'box-shadow 0.2s ease-in-out'
        }}
      >
        <CardContent sx={{ p: isMobile ? 2 : 3, '&:last-child': { pb: isMobile ? 2 : 3 } }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
            {/* Avatar */}
            <Avatar 
              sx={{ 
                bgcolor: getCategoryColor(category),
                width: isMobile ? 40 : 48,
                height: isMobile ? 40 : 48
              }}
            >
              <Eco />
            </Avatar>

            {/* Main Content */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography 
                    variant={isMobile ? 'body1' : 'h6'} 
                    sx={{ 
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {entry.product_name || 'Manual Entry'}
                  </Typography>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <CalendarToday sx={{ fontSize: 14, color: 'text.secondary' }} />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(entry.date_added)}
                    </Typography>
                  </Box>
                </Box>

                {/* Carbon Footprint Badge */}
                <Chip
                  label={formatCarbonFootprint(totalCarbon)}
                  color="primary"
                  size="small"
                  sx={{ 
                    fontWeight: 600,
                    minWidth: isMobile ? 80 : 100
                  }}
                />
              </Box>

              {/* Quick Info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Scale sx={{ fontSize: 14, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {entry.quantity} {entry.unit || 'item'}
                  </Typography>
                </Box>
                
                <Chip
                  label={category}
                  size="small"
                  variant="outlined"
                  sx={{ 
                    borderColor: getCategoryColor(category),
                    color: getCategoryColor(category),
                    fontSize: '0.7rem'
                  }}
                />
              </Box>

              {/* Actions */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Button
                  size="small"
                  onClick={() => setExpanded(!expanded)}
                  endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                  sx={{ 
                    color: 'text.secondary',
                    '&:focus-visible': {
                      outline: `2px solid ${theme.palette.primary.main}`,
                      outlineOffset: 2
                    }
                  }}
                >
                  {expanded ? 'Less' : 'Details'}
                </Button>

                <IconButton
                  size="small"
                  onClick={() => setDeleteDialogOpen(true)}
                  sx={{
                    color: 'error.main',
                    '&:hover': {
                      bgcolor: 'error.light',
                      color: 'error.contrastText'
                    },
                    '&:focus-visible': {
                      outline: `2px solid ${theme.palette.error.main}`,
                      outlineOffset: 2
                    }
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            </Box>
          </Box>

          {/* Expanded Details */}
          <Collapse in={expanded}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }}>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Carbon per Unit
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {formatCarbonFootprint(entry.carbon_footprint)}
                </Typography>
              </Box>

              {(entry as any).data_source && (
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Data Source
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {(entry as any).data_source}
                  </Typography>
                </Box>
              )}

              {(entry as any).product_barcode && (
                <Box sx={{ gridColumn: isMobile ? '1' : '1 / -1' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Barcode
                  </Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                    {(entry as any).product_barcode}
                  </Typography>
                </Box>
              )}
            </Box>
          </Collapse>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => !deleting && setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Delete Entry</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete "{entry.product_name || 'Manual Entry'}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete}
            color="error"
            disabled={deleting}
            startIcon={deleting ? <CircularProgress size={16} /> : <Delete />}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
