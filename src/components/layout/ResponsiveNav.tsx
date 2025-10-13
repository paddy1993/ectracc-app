import React from 'react';
import { useTheme, useMediaQuery } from '@mui/material';
import Sidebar from './Sidebar';
import BottomTabs from './BottomTabs';

export default function ResponsiveNav() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      {/* Desktop sidebar */}
      {!isMobile && <Sidebar />}
      
      {/* Mobile bottom tabs */}
      {isMobile && <BottomTabs />}
    </>
  );
}
