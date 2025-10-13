import React, { useState, useEffect } from 'react';
import {
  Box,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Typography,
  Chip,
  Alert,
  Snackbar,
  IconButton,
  Collapse,
  RadioGroup,
  FormControlLabel,
  Radio,
  Checkbox,
  FormGroup
} from '@mui/material';
import {
  Feedback,
  Close,
  Send,
  BugReport,
  Lightbulb,
  Star,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
import { analytics } from '../services/analytics';

interface FeedbackData {
  type: 'bug' | 'feature' | 'general' | 'rating';
  title: string;
  description: string;
  rating?: number;
  category?: string;
  user_email?: string;
  user_name?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
}

interface SurveyQuestion {
  id: string;
  type: 'rating' | 'multiple_choice' | 'text' | 'checkbox';
  question: string;
  scale?: number;
  options?: string[];
  required: boolean;
}

interface Survey {
  id: string;
  title: string;
  description: string;
  questions: SurveyQuestion[];
  active: boolean;
}

const FeedbackSystem: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'survey'>('feedback');
  const [formData, setFormData] = useState<FeedbackData>({
    type: 'general',
    title: '',
    description: '',
    category: 'app'
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Survey state
  const [activeSurvey, setActiveSurvey] = useState<Survey | null>(null);
  const [surveyResponses, setSurveyResponses] = useState<Record<string, any>>({});
  const [showSurveyPrompt, setShowSurveyPrompt] = useState(false);

  useEffect(() => {
    // Check for active surveys
    fetchActiveSurveys();
    
    // Show survey prompt after some app usage
    const timer = setTimeout(() => {
      checkForSurveyPrompt();
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, []);

  const fetchActiveSurveys = async () => {
    try {
      const response = await fetch('/api/feedback/surveys/active');
      const data = await response.json();
      
      if (data.success && data.data.length > 0) {
        setActiveSurvey(data.data[0]); // Use first active survey
      }
    } catch (error) {
      console.error('Failed to fetch surveys:', error);
    }
  };

  const checkForSurveyPrompt = () => {
    const lastSurveyPrompt = localStorage.getItem('last_survey_prompt');
    const surveyCompleted = localStorage.getItem('survey_completed_beta_feedback_2025');
    
    if (!surveyCompleted && (!lastSurveyPrompt || Date.now() - parseInt(lastSurveyPrompt) > 24 * 60 * 60 * 1000)) {
      setShowSurveyPrompt(true);
      localStorage.setItem('last_survey_prompt', Date.now().toString());
    }
  };

  const handleSubmitFeedback = async () => {
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/feedback/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          device_info: {
            platform: navigator.platform,
            user_agent: navigator.userAgent,
            version: '1.0.0'
          }
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setOpen(false);
        
        // Track feedback submission
        analytics.track('feedback_submitted', {
          event_category: 'user_engagement',
          event_label: formData.type,
          custom_parameters: {
            feedback_type: formData.type,
            category: formData.category,
            has_email: !!formData.user_email
          }
        });

        // Reset form
        setFormData({
          type: 'general',
          title: '',
          description: '',
          category: 'app'
        });
      } else {
        setError(data.error || 'Failed to submit feedback');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitSurvey = async () => {
    if (!activeSurvey) return;

    // Validate required questions
    const requiredQuestions = activeSurvey.questions.filter(q => q.required);
    const missingAnswers = requiredQuestions.filter(q => !surveyResponses[q.id]);
    
    if (missingAnswers.length > 0) {
      setError('Please answer all required questions');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/feedback/survey', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          survey_id: activeSurvey.id,
          responses: surveyResponses,
          completion_time: Date.now()
        })
      });

      const data = await response.json();

      if (data.success) {
        setSuccess(true);
        setOpen(false);
        setShowSurveyPrompt(false);
        localStorage.setItem(`survey_completed_${activeSurvey.id}`, 'true');
        
        // Track survey completion
        analytics.track('survey_completed', {
          event_category: 'user_engagement',
          event_label: activeSurvey.id,
          custom_parameters: {
            survey_id: activeSurvey.id,
            question_count: activeSurvey.questions.length,
            completion_rate: Object.keys(surveyResponses).length / activeSurvey.questions.length
          }
        });
      } else {
        setError(data.error || 'Failed to submit survey');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderFeedbackForm = () => (
    <>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <Chip
            icon={<BugReport />}
            label="Bug Report"
            onClick={() => setFormData({ ...formData, type: 'bug' })}
            color={formData.type === 'bug' ? 'primary' : 'default'}
            clickable
          />
          <Chip
            icon={<Lightbulb />}
            label="Feature Request"
            onClick={() => setFormData({ ...formData, type: 'feature' })}
            color={formData.type === 'feature' ? 'primary' : 'default'}
            clickable
          />
          <Chip
            icon={<Star />}
            label="Rating"
            onClick={() => setFormData({ ...formData, type: 'rating' })}
            color={formData.type === 'rating' ? 'primary' : 'default'}
            clickable
          />
          <Chip
            icon={<Feedback />}
            label="General"
            onClick={() => setFormData({ ...formData, type: 'general' })}
            color={formData.type === 'general' ? 'primary' : 'default'}
            clickable
          />
        </Box>

        {formData.type === 'rating' && (
          <Box sx={{ mb: 3 }}>
            <Typography component="legend" gutterBottom>
              How would you rate ECTRACC?
            </Typography>
            <Rating
              value={formData.rating || 0}
              onChange={(_, newValue) => setFormData({ ...formData, rating: newValue || undefined })}
              size="large"
            />
          </Box>
        )}

        <TextField
          fullWidth
          label="Title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          margin="normal"
          required
          placeholder={
            formData.type === 'bug' ? 'Brief description of the bug' :
            formData.type === 'feature' ? 'Feature you\'d like to see' :
            'What\'s on your mind?'
          }
        />

        <TextField
          fullWidth
          label="Description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          margin="normal"
          multiline
          rows={4}
          required
          placeholder={
            formData.type === 'bug' ? 'Steps to reproduce, what you expected vs what happened' :
            formData.type === 'feature' ? 'Describe the feature and how it would help you' :
            'Tell us more about your feedback'
          }
        />

        <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
          <Typography variant="body2" sx={{ mr: 1 }}>
            Additional Details
          </Typography>
          <IconButton
            size="small"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>

        <Collapse in={showAdvanced}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={formData.category || 'app'}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                label="Category"
              >
                <MenuItem value="app">App General</MenuItem>
                <MenuItem value="scanner">Barcode Scanner</MenuItem>
                <MenuItem value="data">Product Data</MenuItem>
                <MenuItem value="ui">User Interface</MenuItem>
                <MenuItem value="performance">Performance</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </Select>
            </FormControl>

            {formData.type === 'bug' && (
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority || 'medium'}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="critical">Critical</MenuItem>
                </Select>
              </FormControl>
            )}
          </Box>

          <TextField
            fullWidth
            label="Your Name (Optional)"
            value={formData.user_name || ''}
            onChange={(e) => setFormData({ ...formData, user_name: e.target.value })}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Email (Optional - for follow-up)"
            type="email"
            value={formData.user_email || ''}
            onChange={(e) => setFormData({ ...formData, user_email: e.target.value })}
            margin="normal"
            helperText="We'll only use this to follow up on your feedback"
          />
        </Collapse>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setOpen(false)}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSubmitFeedback}
          disabled={loading}
          startIcon={<Send />}
        >
          {loading ? 'Sending...' : 'Send Feedback'}
        </Button>
      </DialogActions>
    </>
  );

  const renderSurveyForm = () => {
    if (!activeSurvey) return null;

    return (
      <>
        <DialogContent>
          <Typography variant="h6" gutterBottom>
            {activeSurvey.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {activeSurvey.description}
          </Typography>

          {activeSurvey.questions.map((question) => (
            <Box key={question.id} sx={{ mb: 3 }}>
              <Typography variant="body1" gutterBottom>
                {question.question}
                {question.required && <span style={{ color: 'red' }}> *</span>}
              </Typography>

              {question.type === 'rating' && (
                <Rating
                  value={surveyResponses[question.id] || 0}
                  onChange={(_, newValue) => setSurveyResponses({
                    ...surveyResponses,
                    [question.id]: newValue
                  })}
                  max={question.scale || 5}
                  size="large"
                />
              )}

              {question.type === 'multiple_choice' && (
                <RadioGroup
                  value={surveyResponses[question.id] || ''}
                  onChange={(e) => setSurveyResponses({
                    ...surveyResponses,
                    [question.id]: e.target.value
                  })}
                >
                  {question.options?.map((option) => (
                    <FormControlLabel
                      key={option}
                      value={option}
                      control={<Radio />}
                      label={option}
                    />
                  ))}
                </RadioGroup>
              )}

              {question.type === 'checkbox' && (
                <FormGroup>
                  {question.options?.map((option) => (
                    <FormControlLabel
                      key={option}
                      control={
                        <Checkbox
                          checked={surveyResponses[question.id]?.includes(option) || false}
                          onChange={(e) => {
                            const current = surveyResponses[question.id] || [];
                            const updated = e.target.checked
                              ? [...current, option]
                              : current.filter((item: string) => item !== option);
                            setSurveyResponses({
                              ...surveyResponses,
                              [question.id]: updated
                            });
                          }}
                        />
                      }
                      label={option}
                    />
                  ))}
                </FormGroup>
              )}

              {question.type === 'text' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  value={surveyResponses[question.id] || ''}
                  onChange={(e) => setSurveyResponses({
                    ...surveyResponses,
                    [question.id]: e.target.value
                  })}
                  placeholder="Your answer..."
                />
              )}
            </Box>
          ))}

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSubmitSurvey}
            disabled={loading}
            startIcon={<Send />}
          >
            {loading ? 'Submitting...' : 'Submit Survey'}
          </Button>
        </DialogActions>
      </>
    );
  };

  return (
    <>
      {/* Feedback FAB */}
      <Fab
        color="primary"
        aria-label="feedback"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1000
        }}
        onClick={() => {
          setFeedbackType('feedback');
          setOpen(true);
          analytics.trackFeatureUsage('feedback_system', { action: 'open', source: 'fab_click' });
        }}
      >
        <Feedback />
      </Fab>

      {/* Survey Prompt Snackbar */}
      <Snackbar
        open={showSurveyPrompt}
        onClose={() => setShowSurveyPrompt(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        autoHideDuration={10000}
      >
        <Alert
          severity="info"
          action={
            <Box>
              <Button
                color="inherit"
                size="small"
                onClick={() => {
                  setFeedbackType('survey');
                  setOpen(true);
                  setShowSurveyPrompt(false);
                }}
              >
                Take Survey
              </Button>
              <IconButton
                size="small"
                color="inherit"
                onClick={() => setShowSurveyPrompt(false)}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>
          }
        >
          📊 Help us improve ECTRACC! Take our quick 2-minute survey.
        </Alert>
      </Snackbar>

      {/* Main Dialog */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { minHeight: '400px' }
        }}
      >
        <DialogTitle>
          {feedbackType === 'feedback' ? '💬 Send Feedback' : '📊 Survey'}
          <IconButton
            aria-label="close"
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>

        {feedbackType === 'feedback' ? renderFeedbackForm() : renderSurveyForm()}
      </Dialog>

      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={4000}
        onClose={() => setSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          {feedbackType === 'feedback' ? 
            'Thank you! Your feedback has been sent.' : 
            'Thank you for completing the survey!'
          }
        </Alert>
      </Snackbar>
    </>
  );
};

export default FeedbackSystem;
