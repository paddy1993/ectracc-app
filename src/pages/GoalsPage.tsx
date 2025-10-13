import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  CardContent,
  Typography,
  Box,
  Button,

  CircularProgress,
  Alert,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  ArrowBack,
  Add as AddIcon,
  Edit as EditIcon,
  Flag as FlagIcon
} from '@mui/icons-material';
import { Goal, GoalForm, DashboardStats } from '../types';
import carbonApi from '../services/carbonApi';

export default function GoalsPage() {
  const navigate = useNavigate();
  
  const [goals, setGoals] = useState<Goal[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [submitting, setSubmitting] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<GoalForm>({
    target_value: 10, // 10 products default
    timeframe: 'weekly',
    description: ''
  });

  // Load data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [goalsData, dashboardStats] = await Promise.all([
          carbonApi.getGoals(),
          carbonApi.getDashboardStats()
        ]);
        
        setGoals(goalsData);
        setStats(dashboardStats);
      } catch (error: any) {
        console.error('Failed to load goals data:', error);
        setError(error.message || 'Failed to load goals data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Handle form input changes
  const handleInputChange = (field: keyof GoalForm) => (event: any) => {
    const value = field === 'target_value' 
      ? parseFloat(event.target.value) || 0 
      : event.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Open dialog for new goal
  const handleNewGoal = () => {
    setEditingGoal(null);
    setFormData({
      target_value: 10,
      timeframe: 'weekly',
      description: ''
    });
    setDialogOpen(true);
  };

  // Open dialog for editing goal
  const handleEditGoal = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      target_value: goal.target_value,
      timeframe: goal.timeframe,
      description: goal.description || ''
    });
    setDialogOpen(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingGoal(null);
    setFormData({
      target_value: 10,
      timeframe: 'weekly',
      description: ''
    });
  };

  // Submit goal
  const handleSubmitGoal = async () => {
    if (formData.target_value <= 0) {
      setError('Target value must be greater than 0');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const savedGoal = await carbonApi.saveGoal(formData);
      
      // Update goals list
      if (editingGoal) {
        setGoals(prev => prev.map(goal => 
          goal.id === editingGoal.id ? savedGoal : goal
        ));
      } else {
        setGoals(prev => {
          // Remove existing goal of same timeframe and add new one
          const filtered = prev.filter(goal => goal.timeframe !== formData.timeframe);
          return [...filtered, savedGoal];
        });
      }
      
      handleCloseDialog();
      
      // Reload stats to get updated progress
      const updatedStats = await carbonApi.getDashboardStats();
      setStats(updatedStats);
      
    } catch (error: any) {
      setError(error.message || 'Failed to save goal');
    } finally {
      setSubmitting(false);
    }
  };

  // Get current progress for a goal (number of products tracked)
  const getCurrentProgress = (goal: Goal): number => {
    if (!stats) return 0;
    
    if (goal.timeframe === 'weekly') {
      return (stats as any).weeklyEntries || 0; // Number of entries this week
    } else {
      return (stats as any).monthlyEntries || 0; // Number of entries this month
    }
  };

  // Get progress percentage
  const getProgressPercentage = (goal: Goal): number => {
    const current = getCurrentProgress(goal);
    return Math.min((current / goal.target_value) * 100, 100);
  };

  // Get goal status
  const getGoalStatus = (goal: Goal): 'on-track' | 'warning' | 'exceeded' => {
    const percentage = getProgressPercentage(goal);
    if (percentage <= 70) return 'on-track';
    if (percentage <= 100) return 'warning';
    return 'exceeded';
  };

  // Suggested goals based on tracking patterns
  const suggestedGoals = [
    { timeframe: 'weekly' as const, target: 5, description: 'Track 5 products per week - great for beginners' },
    { timeframe: 'weekly' as const, target: 10, description: 'Track 10 products per week - build consistent habits' },
    { timeframe: 'weekly' as const, target: 15, description: 'Track 15 products per week - comprehensive tracking' },
    { timeframe: 'monthly' as const, target: 25, description: 'Track 25 products per month - steady learning pace' },
    { timeframe: 'monthly' as const, target: 50, description: 'Track 50 products per month - accelerated learning' },
    { timeframe: 'monthly' as const, target: 100, description: 'Track 100 products per month - carbon literacy expert' }
  ];

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <CircularProgress size={48} />
          <Typography variant="h6" sx={{ ml: 2 }}>
            Loading your goals...
          </Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/dashboard')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 600, flexGrow: 1 }}>
          Tracking Goals
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleNewGoal}
        >
          Set Goal
        </Button>
      </Box>

      <Typography variant="body1" color="text.secondary" paragraph>
        Set product tracking goals to build your carbon literacy and understand your consumption patterns.
      </Typography>

      {/* Error Message */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Goals */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Goals
              </Typography>
              
              {goals.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <FlagIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    No Goals Set
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    Set your first product tracking goal to start building your carbon literacy.
                  </Typography>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleNewGoal}
                  >
                    Set Your First Goal
                  </Button>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {goals.map((goal) => {
                    const progress = getCurrentProgress(goal);
                    const percentage = getProgressPercentage(goal);
                    const status = getGoalStatus(goal);
                    
                    return (
                      <Card key={goal.id} variant="outlined">
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                            <Box>
                              <Typography variant="h6" gutterBottom>
                                {goal.timeframe === 'weekly' ? 'Weekly' : 'Monthly'} Goal
                              </Typography>
                              <Typography variant="h4" color="primary.main">
                                {goal.target_value} products
                              </Typography>
                              {goal.description && (
                                <Typography variant="body2" color="text.secondary">
                                  {goal.description}
                                </Typography>
                              )}
                            </Box>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Chip
                                label={status === 'on-track' ? 'On Track' : status === 'warning' ? 'Warning' : 'Exceeded'}
                                color={status === 'on-track' ? 'success' : status === 'warning' ? 'warning' : 'error'}
                                size="small"
                              />
                              <IconButton size="small" onClick={() => handleEditGoal(goal)}>
                                <EditIcon />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                              <Typography variant="body2" color="text.secondary">
                                Progress: {progress} / {goal.target_value} products tracked
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {percentage}%
                              </Typography>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={Math.min(percentage, 100)}
                              color={status === 'on-track' ? 'success' : status === 'warning' ? 'warning' : 'error'}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                          
                          {percentage >= 100 && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                              🎉 Congratulations! You've reached your {goal.timeframe} tracking goal. 
                              You're building great carbon literacy habits!
                            </Alert>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Suggested Goals */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Suggested Tracking Goals
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Choose a goal that matches your learning pace
              </Typography>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {suggestedGoals.map((suggestion, index) => (
                  <Box
                    key={index}
                    sx={{
                      p: 2,
                      border: 1,
                      borderColor: 'divider',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                    onClick={() => {
                      setFormData({
                        target_value: suggestion.target,
                        timeframe: suggestion.timeframe,
                        description: suggestion.description
                      });
                      setDialogOpen(true);
                    }}
                  >
                    <Typography variant="subtitle2" gutterBottom>
                      {suggestion.timeframe === 'weekly' ? 'Weekly' : 'Monthly'}: {suggestion.target} products
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {suggestion.description}
                    </Typography>
                  </Box>
                ))}
              </Box>
              
              <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="body2" color="info.dark">
                  💡 Tip: Start with a goal that feels achievable and build the habit of tracking. 
                  The more products you track, the better you'll understand your consumption patterns!
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Goal Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGoal ? 'Edit Goal' : 'Set New Goal'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1 }}>
            <FormControl fullWidth margin="normal">
              <InputLabel>Timeframe</InputLabel>
              <Select
                value={formData.timeframe}
                onChange={handleInputChange('timeframe')}
                label="Timeframe"
              >
                <MenuItem value="weekly">Weekly</MenuItem>
                <MenuItem value="monthly">Monthly</MenuItem>
              </Select>
            </FormControl>
            
            <TextField
              fullWidth
              label="Number of Products to Track"
              type="number"
              value={formData.target_value}
              onChange={handleInputChange('target_value')}
              margin="normal"
              inputProps={{ min: 1, step: 1 }}
              helperText={`Target: ${formData.target_value} products per ${formData.timeframe.replace('ly', '')}`}
            />
            
            <TextField
              fullWidth
              label="Description (optional)"
              value={formData.description}
              onChange={handleInputChange('description')}
              margin="normal"
              multiline
              rows={2}
              placeholder="e.g., Focus on food products, track household items, learn about electronics"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitGoal}
            variant="contained"
            disabled={submitting || formData.target_value <= 0}
          >
            {submitting ? <CircularProgress size={20} /> : (editingGoal ? 'Update Goal' : 'Set Goal')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
