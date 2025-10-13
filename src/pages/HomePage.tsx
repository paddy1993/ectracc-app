import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Home,
  Analytics,
  CloudOff
} from '@mui/icons-material';
import { APP_NAME, APP_DESCRIPTION } from '../constants';

export default function HomePage() {

  const features = [
    {
      icon: <Home sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Carbon Tracking',
      description: 'Track your personal carbon footprint with ease'
    },
    {
      icon: <Analytics sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Analytics',
      description: 'View detailed analytics and trends over time'
    },
    {
      icon: <CloudOff sx={{ fontSize: 40, color: 'primary.main' }} />,
      title: 'Offline Support',
      description: 'Works offline and syncs when you\'re back online'
    }
  ];

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography 
          variant="h2" 
          component="h1" 
          gutterBottom 
          sx={{ fontWeight: 700, color: 'primary.main' }}
        >
          {APP_NAME}
        </Typography>
        <Typography 
          variant="h5" 
          component="h2" 
          color="text.secondary" 
          paragraph
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          {APP_DESCRIPTION}
        </Typography>
        
        <Box sx={{ mt: 4, mb: 2 }}>
          <Chip
            label="PWA Ready"
            color="primary"
            variant="outlined"
          />
        </Box>

        <Button
          variant="contained"
          size="large"
          sx={{ mt: 2, px: 4, py: 1.5 }}
        >
          Get Started
        </Button>
      </Box>

      {/* Features Section */}
      <Box sx={{ py: 6 }}>
        <Typography variant="h4" component="h2" textAlign="center" gutterBottom>
          Features
        </Typography>
        <Typography 
          variant="body1" 
          textAlign="center" 
          color="text.secondary" 
          paragraph
          sx={{ mb: 6 }}
        >
          Everything you need to track and reduce your carbon footprint
        </Typography>

        <Grid container spacing={4}>
          {features.map((feature, index) => (
            <Grid size={{ xs: 12, md: 4 }} key={index}>
              <Card 
                sx={{ 
                  height: '100%', 
                  textAlign: 'center',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)'
                  }
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Box sx={{ mb: 2 }}>
                    {feature.icon}
                  </Box>
                  <Typography variant="h6" component="h3" gutterBottom>
                    {feature.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {feature.description}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>

      {/* Status Section */}
      <Box sx={{ py: 4, textAlign: 'center' }}>
        <Typography variant="h6" gutterBottom>
          Phase 1: Project Setup & Architecture
        </Typography>
        <Typography variant="body2" color="text.secondary">
          ✅ React 18 + TypeScript + Material-UI v7<br />
          ✅ React Router v6 + Context API<br />
          ✅ PWA Ready + Offline Support<br />
          ✅ Error Boundaries + Clean Architecture
        </Typography>
      </Box>
    </Container>
  );
}