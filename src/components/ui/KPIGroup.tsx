import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import StatCard from './StatCard';

interface KPIItem {
  id: string;
  icon?: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
  tone?: 'default' | 'success' | 'warn';
  onClick?: () => void;
}

interface KPIGroupProps {
  items: KPIItem[];
  columns?: 2 | 3 | 4;
  spacing?: number;
}

export default function KPIGroup({ 
  items, 
  columns = 2, 
  spacing = 2 
}: KPIGroupProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  // Responsive column calculation
  const getColumns = () => {
    if (isMobile) {
      return items.length === 1 ? 1 : 2; // Single item takes full width, otherwise 2x2 grid
    }
    if (isTablet) {
      return Math.min(columns, 3); // Max 3 columns on tablet
    }
    return columns;
  };

  const responsiveColumns = getColumns();
  const gridSize = 12 / responsiveColumns;

  return (
    <Box 
      sx={{ 
        display: 'grid',
        gridTemplateColumns: {
          xs: items.length === 1 ? '1fr' : 'repeat(2, 1fr)',
          sm: `repeat(${responsiveColumns}, 1fr)`,
          md: `repeat(${responsiveColumns}, 1fr)`
        },
        gap: spacing,
        width: '100%'
      }}
    >
      {items.map((item) => (
        <StatCard
          key={item.id}
          icon={item.icon}
          label={item.label}
          value={item.value}
          sub={item.sub}
          tone={item.tone}
          onClick={item.onClick}
        />
      ))}
    </Box>
  );
}
