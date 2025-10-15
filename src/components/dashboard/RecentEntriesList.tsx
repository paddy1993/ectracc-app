import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Chip,
  Skeleton,
  Button,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { 
  ShoppingCart, 
  Car, 
  Home, 
  Utensils,
  Package,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface FootprintEntry {
  id: string;
  manual_item?: string;
  product_name?: string;
  amount: number;
  carbon_total: number;
  category: string;
  date_added: string;
  unit?: string;
}

interface RecentEntriesListProps {
  entries: FootprintEntry[];
  loading?: boolean;
  maxEntries?: number;
}

const categoryIcons = {
  food: Utensils,
  transport: Car,
  energy: Home,
  shopping: ShoppingCart,
  other: Package
};

const categoryColors = {
  food: '#4CAF50',
  transport: '#FF9800',
  energy: '#2196F3',
  shopping: '#9C27B0',
  other: '#607D8B'
};

export default function RecentEntriesList({
  entries,
  loading = false,
  maxEntries = 5
}: RecentEntriesListProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  const getCategoryIcon = (category: string) => {
    const IconComponent = categoryIcons[category as keyof typeof categoryIcons] || Package;
    return <IconComponent size={20} />;
  };

  const getCategoryColor = (category: string) => {
    return categoryColors[category as keyof typeof categoryColors] || categoryColors.other;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const displayEntries = entries.slice(0, maxEntries);

  if (loading) {
    return (
      <Card>
        <CardHeader
          title={
            <Skeleton variant="text" width="60%" height={24} />
          }
        />
        <CardContent sx={{ pt: 0 }}>
          <List>
            {Array.from({ length: 3 }).map((_, index) => (
              <ListItem key={index} sx={{ px: 0 }}>
                <ListItemIcon>
                  <Skeleton variant="circular" width={40} height={40} />
                </ListItemIcon>
                <ListItemText
                  primary={<Skeleton variant="text" width="70%" />}
                  secondary={<Skeleton variant="text" width="50%" />}
                />
                <Skeleton variant="rectangular" width={60} height={24} />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    );
  }

  if (!entries || entries.length === 0) {
    return (
      <Card>
        <CardHeader title="Recent Entries" />
        <CardContent>
          <Box
            sx={{
              textAlign: 'center',
              py: 4,
              color: 'text.secondary'
            }}
          >
            <Package size={48} style={{ marginBottom: 16, opacity: 0.5 }} />
            <Typography variant="h6" gutterBottom>
              No entries yet
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Start tracking your carbon footprint to see your recent activities here
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/tracker')}
              size="small"
            >
              Add Entry
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Recent Entries"
        action={
          entries.length > maxEntries && (
            <Button
              size="small"
              endIcon={<ArrowRight size={16} />}
              onClick={() => navigate('/history')}
              sx={{ textTransform: 'none' }}
            >
              View All
            </Button>
          )
        }
      />
      <CardContent sx={{ pt: 0 }}>
        <List>
          {displayEntries.map((entry, index) => (
            <ListItem
              key={entry.id}
              sx={{
                px: 0,
                borderBottom: index < displayEntries.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                '&:hover': {
                  backgroundColor: theme.palette.action.hover,
                  borderRadius: 1,
                  cursor: 'pointer'
                }
              }}
              onClick={() => navigate('/history')}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: getCategoryColor(entry.category),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white'
                  }}
                >
                  {getCategoryIcon(entry.category)}
                </Box>
              </ListItemIcon>
              
              <ListItemText
                primary={
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 500,
                      fontSize: isMobile ? '0.875rem' : '1rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {entry.manual_item || entry.product_name || 'Unknown Item'}
                  </Typography>
                }
                secondary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                    >
                      {entry.amount} {entry.unit || 'g'}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
                    >
                      • {formatDate(entry.date_added)}
                    </Typography>
                  </Box>
                }
              />
              
              <Box sx={{ textAlign: 'right' }}>
                <Chip
                  label={`${entry.carbon_total.toFixed(1)} kg`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  sx={{
                    fontSize: isMobile ? '0.7rem' : '0.75rem',
                    height: isMobile ? 20 : 24
                  }}
                />
              </Box>
            </ListItem>
          ))}
        </List>
        
        {entries.length > maxEntries && (
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button
              variant="text"
              onClick={() => navigate('/history')}
              endIcon={<ArrowRight size={16} />}
              sx={{ textTransform: 'none' }}
            >
              View {entries.length - maxEntries} more entries
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
