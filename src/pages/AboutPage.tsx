import React from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Leaf, Target } from 'lucide-react';

export default function AboutPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography 
          variant={isMobile ? 'h4' : 'h3'} 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 700,
            color: 'primary.main',
            mb: 2
          }}
        >
          About ECTRACC
        </Typography>
        <Typography 
          variant="h6" 
          color="text.secondary"
          sx={{ maxWidth: 600, mx: 'auto' }}
        >
          Understanding carbon footprints to make better choices for our planet
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Product Carbon Footprint Definition */}
        <Card 
          elevation={2}
          sx={{ 
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[6]
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'success.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}
              >
                <Leaf size={24} color="white" />
              </Box>
              <Typography 
                variant="h5" 
                component="h2"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                What is a Product Carbon Footprint?
              </Typography>
            </Box>
            
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                lineHeight: 1.7,
                fontSize: isMobile ? '1rem' : '1.1rem'
              }}
            >
              A product carbon footprint measures the total amount of greenhouse gases 
              (primarily CO₂) emitted throughout a product's entire lifecycle. This includes 
              emissions from raw material extraction, manufacturing, transportation, use, 
              and disposal. Measured in kilograms of CO₂ equivalent (kg CO₂e), it helps 
              us understand the true environmental impact of the products we buy and use 
              every day.
            </Typography>
          </CardContent>
        </Card>

        {/* ECTRACC Mission */}
        <Card 
          elevation={2}
          sx={{ 
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: theme.shadows[6]
            }
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mr: 2
                }}
              >
                <Target size={24} color="white" />
              </Box>
              <Typography 
                variant="h5" 
                component="h2"
                sx={{ fontWeight: 600, color: 'text.primary' }}
              >
                ECTRACC's Mission
              </Typography>
            </Box>
            
            <Typography 
              variant="body1" 
              color="text.secondary"
              sx={{ 
                lineHeight: 1.7,
                fontSize: isMobile ? '1rem' : '1.1rem'
              }}
            >
              Our mission is to improve carbon footprint literacy by making it clear 
              and accessible for people to understand the environmental impact of the 
              products they buy. We believe that informed consumers can drive positive 
              change by making more sustainable choices. Through easy-to-use tools and 
              clear information, ECTRACC empowers everyone to track, understand, and 
              reduce their personal carbon footprint one product at a time.
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Call to Action */}
      <Box sx={{ textAlign: 'center', mt: 4, p: 3 }}>
        <Typography 
          variant="h6" 
          color="primary.main"
          sx={{ fontWeight: 600, mb: 1 }}
        >
          Ready to start tracking?
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary"
        >
          Begin your journey toward more sustainable choices today.
        </Typography>
      </Box>
    </Container>
  );
}
