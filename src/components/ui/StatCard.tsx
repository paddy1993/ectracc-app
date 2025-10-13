import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, Box, Typography, useTheme } from '@mui/material';

interface StatCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'success' | 'warn';
  onClick?: () => void;
}

export default function StatCard({ 
  icon = <TrendingUp className="h-5 w-5" />, 
  label, 
  value, 
  sub, 
  tone = 'default',
  onClick
}: StatCardProps) {
  const theme = useTheme();
  
  const toneStyles = {
    default: {
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider
    },
    success: {
      backgroundColor: theme.palette.success.light + '20',
      borderColor: theme.palette.success.light
    },
    warn: {
      backgroundColor: theme.palette.warning.light + '20',
      borderColor: theme.palette.warning.light
    }
  };

  return (
    <Card 
      sx={{
        ...toneStyles[tone],
        border: 1,
        borderRadius: 3,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease-in-out',
        '&:hover': onClick ? {
          transform: 'translateY(-2px)',
          boxShadow: theme.shadows[4]
        } : {},
        // Accessibility
        '&:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: 2
        }
      }}
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      role={onClick ? 'button' : undefined}
    >
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box 
            sx={{ 
              p: 1.5,
              borderRadius: 2,
              backgroundColor: theme.palette.primary.light + '30',
              color: theme.palette.primary.main,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {icon}
          </Box>
          <Typography 
            variant="h4" 
            component="div" 
            sx={{ 
              ml: 'auto',
              fontWeight: 600,
              color: theme.palette.text.primary
            }}
          >
            {value}
          </Typography>
        </Box>
        
        <Typography 
          variant="body2" 
          color="text.secondary"
          sx={{ fontWeight: 500 }}
        >
          {label}
        </Typography>
        
        {sub && (
          <Typography 
            variant="caption" 
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5 }}
          >
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
