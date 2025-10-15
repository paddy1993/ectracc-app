import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface DashboardSummaryCardProps {
  title: string;
  value: string;
  unit: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    percentage: number;
    period: string;
  };
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  loading?: boolean;
}

export default function DashboardSummaryCard({
  title,
  value,
  unit,
  trend,
  color = 'primary',
  loading = false
}: DashboardSummaryCardProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const getTrendIcon = (): React.ReactElement | undefined => {
    if (!trend) return undefined;
    
    switch (trend.direction) {
      case 'up':
        return <TrendingUp size={16} />;
      case 'down':
        return <TrendingDown size={16} />;
      default:
        return <Minus size={16} />;
    }
  };

  const getTrendColor = () => {
    if (!trend) return 'default';
    
    switch (trend.direction) {
      case 'up':
        return 'error'; // Up trend in carbon footprint is bad
      case 'down':
        return 'success'; // Down trend in carbon footprint is good
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Card sx={{ height: '100%', minHeight: 120 }}>
        <CardContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <Box
              sx={{
                height: 20,
                bgcolor: 'grey.200',
                borderRadius: 1,
                animation: 'pulse 1.5s ease-in-out infinite'
              }}
            />
            <Box
              sx={{
                height: 32,
                bgcolor: 'grey.200',
                borderRadius: 1,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: '0.2s'
              }}
            />
            <Box
              sx={{
                height: 16,
                width: '60%',
                bgcolor: 'grey.200',
                borderRadius: 1,
                animation: 'pulse 1.5s ease-in-out infinite',
                animationDelay: '0.4s'
              }}
            />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card 
      sx={{ 
        height: '100%', 
        minHeight: 120,
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        }
      }}
    >
      <CardContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ 
              fontWeight: 500,
              fontSize: isMobile ? '0.75rem' : '0.875rem'
            }}
          >
            {title}
          </Typography>
          
          <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 0.5 }}>
            <Typography 
              variant={isMobile ? 'h5' : 'h4'}
              color={`${color}.main`}
              sx={{ 
                fontWeight: 700,
                lineHeight: 1.2
              }}
            >
              {value}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ fontSize: isMobile ? '0.7rem' : '0.75rem' }}
            >
              {unit}
            </Typography>
          </Box>

          {trend && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Chip
                icon={getTrendIcon()}
                label={`${trend.percentage > 0 ? '+' : ''}${trend.percentage}%`}
                size="small"
                color={getTrendColor()}
                variant="outlined"
                sx={{ 
                  height: 20,
                  fontSize: '0.7rem',
                  '& .MuiChip-icon': {
                    fontSize: '0.8rem'
                  }
                }}
              />
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ fontSize: '0.7rem' }}
              >
                vs {trend.period}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
