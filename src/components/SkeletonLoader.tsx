import React from 'react';
import { 
  Box, 
  Card, 
  CardContent, 
  Skeleton, 
  Container
} from '@mui/material';

interface SkeletonLoaderProps {
  variant: 'dashboard' | 'history' | 'product-search' | 'chart';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ variant, count = 1 }) => {
  // Simplified skeleton loader to avoid Grid version issues
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Skeleton variant="text" width={200} height={40} />
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {Array.from({ length: count || 3 }).map((_, i) => (
            <Card key={i} sx={{ flex: '1 1 300px', minWidth: 250 }}>
              <CardContent>
                <Skeleton variant="rectangular" width="100%" height={120} />
                <Skeleton variant="text" width="80%" height={20} sx={{ mt: 1 }} />
                <Skeleton variant="text" width="60%" height={20} />
              </CardContent>
            </Card>
          ))}
        </Box>
        <Skeleton variant="rectangular" width="100%" height={200} />
      </Box>
    </Container>
  );
};

export default SkeletonLoader;