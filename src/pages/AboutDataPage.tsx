import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  IconButton,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack,
  ExpandMore,
  Science as ScienceIcon,
  MenuBook as BookIcon,
  People as PeopleIcon,
  ViewModule as ComponentIcon,
  Assessment as EstimateIcon,
  CheckCircle as CheckIcon,
  Info as InfoIcon
} from '@mui/icons-material';

// Helper functions for source display (same as other components)
const getSourceIcon = (source: string): string => {
  switch (source) {
    case 'agribalyse': return '🔬';
    case 'manual_research': return '📚';
    case 'user_contributed': return '👥';
    case 'base_component': return '🧱';
    case 'estimated': return '📊';
    default: return '❓';
  }
};

const getSourceColor = (source: string): string => {
  switch (source) {
    case 'agribalyse': return '#1976d2'; // Blue
    case 'manual_research': return '#388e3c'; // Green
    case 'user_contributed': return '#f57c00'; // Orange
    case 'base_component': return '#7b1fa2'; // Purple
    case 'estimated': return '#616161'; // Grey
    default: return '#757575';
  }
};

const getSourceLabel = (source: string): string => {
  switch (source) {
    case 'agribalyse': return 'Agribalyse Database';
    case 'manual_research': return 'Research Studies';
    case 'user_contributed': return 'User Contributed';
    case 'base_component': return 'Base Component';
    case 'estimated': return 'Estimated';
    default: return 'Unknown Source';
  }
};

export default function AboutDataPage() {
  const navigate = useNavigate();

  const dataSources = [
    {
      id: 'agribalyse',
      name: 'Agribalyse Database',
      icon: ScienceIcon,
      emoji: '🔬',
      description: 'Official French environmental database with detailed lifecycle assessments',
      details: [
        'Maintained by the French Environment and Energy Management Agency (ADEME)',
        'Contains detailed CO₂ breakdowns including agriculture, processing, transportation, packaging, and distribution',
        'Based on rigorous lifecycle assessment (LCA) methodology',
        'Covers over 2,500 food products with scientific precision',
        'Updated regularly with new research and data'
      ],
      coverage: '94,000+ products',
      accuracy: 'Very High',
      methodology: 'ISO 14040/14044 LCA standards'
    },
    {
      id: 'manual_research',
      name: 'Research Studies',
      icon: BookIcon,
      emoji: '📚',
      description: 'Carbon footprint data from peer-reviewed academic research and studies',
      details: [
        'Data sourced from academic journals and research publications',
        'Includes studies from Nature, Science, Environmental Research Letters, and other reputable journals',
        'Covers specialty products not found in commercial databases',
        'Each entry includes reference to original research source',
        'Manually curated and verified by our research team'
      ],
      coverage: '47 specialty products',
      accuracy: 'High',
      methodology: 'Peer-reviewed research'
    },
    {
      id: 'base_component',
      name: 'Base Components',
      icon: ComponentIcon,
      emoji: '🧱',
      description: 'Standardized carbon footprints for common ingredients and food categories',
      details: [
        'Average values calculated from multiple research sources',
        'Covers basic ingredients like milk, beef, chicken, rice, etc.',
        'Used for manual product entry when specific data unavailable',
        'Regularly updated with new research findings',
        'Provides consistent baseline for product comparisons'
      ],
      coverage: '36 base ingredients',
      accuracy: 'Medium-High',
      methodology: 'Multi-source averages'
    },
    {
      id: 'user_contributed',
      name: 'User Contributed',
      icon: PeopleIcon,
      emoji: '👥',
      description: 'Carbon footprint data contributed by the ECTRACC community',
      details: [
        'Submissions from users with supporting documentation',
        'All contributions reviewed by our verification team',
        'Sources must be provided for all submissions',
        'Helps expand coverage to local and regional products',
        'Community-driven approach to data collection'
      ],
      coverage: 'Growing database',
      accuracy: 'Variable (reviewed)',
      methodology: 'Community contribution + verification'
    },
    {
      id: 'estimated',
      name: 'Estimated Values',
      icon: EstimateIcon,
      emoji: '📊',
      description: 'Calculated estimates based on product categories and ingredients',
      details: [
        'Used when no specific data is available',
        'Based on category averages and ingredient analysis',
        'Clearly marked as estimates to users',
        'Continuously improved with machine learning',
        'Replaced with real data when available'
      ],
      coverage: 'Fallback for all products',
      accuracy: 'Low-Medium',
      methodology: 'Category-based estimation'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          About Our Data Sources
        </Typography>
      </Box>

      {/* Introduction */}
      <Alert severity="info" sx={{ mb: 4 }}>
        <Typography variant="body1" gutterBottom>
          <strong>Transparency is at the heart of ECTRACC.</strong> We believe you should know exactly where our carbon footprint data comes from and how reliable it is.
        </Typography>
        <Typography variant="body2">
          All carbon footprint values in our database are clearly labeled with their source, so you can make informed decisions about the products you choose.
        </Typography>
      </Alert>

      {/* Data Quality Overview */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Data Quality Overview
          </Typography>
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main" sx={{ fontWeight: 600 }}>
                  1.5M+
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Products
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main" sx={{ fontWeight: 600 }}>
                  94K+
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  With Real Data
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="info.main" sx={{ fontWeight: 600 }}>
                  5
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Data Sources
                </Typography>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="warning.main" sx={{ fontWeight: 600 }}>
                  100%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Transparent
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Data Sources */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
        Our Data Sources
      </Typography>

      {dataSources.map((source, index) => (
        <Accordion key={source.id} sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
                <source.icon sx={{ mr: 2, color: getSourceColor(source.id) }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {source.emoji} {source.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {source.description}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mr: 2 }}>
                <Chip
                  label={source.coverage}
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: getSourceColor(source.id) }}
                />
                <Chip
                  label={source.accuracy}
                  size="small"
                  sx={{
                    bgcolor: getSourceColor(source.id),
                    color: 'white'
                  }}
                />
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 8 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                  Details
                </Typography>
                <List dense>
                  {source.details.map((detail, idx) => (
                    <ListItem key={idx} sx={{ py: 0.5 }}>
                      <ListItemIcon sx={{ minWidth: 32 }}>
                        <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                      </ListItemIcon>
                      <ListItemText primary={detail} />
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Box sx={{ bgcolor: 'background.default', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>
                    Quick Facts
                  </Typography>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Coverage
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {source.coverage}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      Accuracy
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {source.accuracy}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Methodology
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {source.methodology}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* How to Identify Sources */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
            <InfoIcon sx={{ mr: 1 }} />
            How to Identify Data Sources
          </Typography>
          <Typography variant="body1" paragraph>
            Every product in ECTRACC displays its carbon footprint source using color-coded icons:
          </Typography>
          <Grid container spacing={2}>
            {dataSources.map((source) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={source.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', p: 1 }}>
                  <Chip
                    label={`${source.emoji} ${source.name}`}
                    size="small"
                    sx={{
                      bgcolor: getSourceColor(source.id),
                      color: 'white',
                      mr: 1
                    }}
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ my: 2 }} />
          <Typography variant="body2" color="text.secondary">
            Look for these indicators on product cards and detail pages to understand the reliability and source of each carbon footprint measurement.
          </Typography>
        </CardContent>
      </Card>

      {/* Future Plans */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Continuous Improvement
          </Typography>
          <Typography variant="body1" paragraph>
            We're constantly working to improve our data quality and coverage:
          </Typography>
          <List>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Regular updates from official databases" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Community contributions with verification" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Machine learning to improve estimates" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckIcon color="success" />
              </ListItemIcon>
              <ListItemText primary="Partnership with research institutions" />
            </ListItem>
          </List>
        </CardContent>
      </Card>
    </Container>
  );
}
