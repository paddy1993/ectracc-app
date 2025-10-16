import React, { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  CircularProgress,
  Alert,
  Button
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrivacyContent = async () => {
      try {
        const response = await fetch('/legal/privacy-policy.md');
        if (!response.ok) {
          throw new Error('Failed to load Privacy Policy');
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchPrivacyContent();
  }, []);

  const handleGoBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={handleGoBack}
        >
          Go Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={1} sx={{ p: 4 }}>
        <Box sx={{ mb: 3 }}>
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={handleGoBack}
            sx={{ mb: 2 }}
          >
            Go Back
          </Button>
          <Typography variant="h4" component="h1" gutterBottom>
            Privacy Policy
          </Typography>
        </Box>
        
        <Box sx={{ 
          '& h1': { 
            fontSize: '2rem', 
            fontWeight: 600, 
            mb: 2,
            mt: 3
          },
          '& h2': { 
            fontSize: '1.5rem', 
            fontWeight: 600, 
            mb: 2,
            mt: 3
          },
          '& h3': { 
            fontSize: '1.25rem', 
            fontWeight: 600, 
            mb: 1.5,
            mt: 2
          },
          '& p': { 
            mb: 2, 
            lineHeight: 1.7,
            color: 'text.secondary'
          },
          '& ul': { 
            mb: 2, 
            pl: 3,
            '& li': {
              mb: 0.5,
              color: 'text.secondary'
            }
          },
          '& strong': {
            fontWeight: 600,
            color: 'text.primary'
          },
          '& hr': {
            my: 3,
            border: 'none',
            borderTop: '1px solid',
            borderColor: 'divider'
          }
        }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </Box>
      </Paper>
    </Container>
  );
}
