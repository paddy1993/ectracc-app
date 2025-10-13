import React from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search } from '@mui/icons-material';

export default function SearchPage() {
  return (
    <Container maxWidth="lg">
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Search
      </Typography>
      
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Box sx={{ mb: 3 }}>
          <Search sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            Search Functionality
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            This page will contain product search functionality in future phases.
          </Typography>
        </Box>

        <TextField
          fullWidth
          placeholder="Search for products..."
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            )
          }}
          sx={{ maxWidth: 500 }}
        />
      </Paper>
    </Container>
  );
}



