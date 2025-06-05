import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  MenuItem,
  CircularProgress,
  Alert,
  Snackbar,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import axios from 'axios';
import { 
  Send, 
  QuestionAnswer, 
  Feedback as FeedbackIcon,
  HelpOutline,
  Chat
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

const Feedback = () => {
  const [courses, setCourses] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [previousFeedback, setPreviousFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { currentUser } = useAuth();
  
  const [feedbackData, setFeedbackData] = useState({
    course_id: '',
    lesson_id: '',
    feedback_type: 'question', // question, suggestion, issue
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  // Load courses when component mounts
  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch enrolled courses
      const coursesResponse = await axios.get('/api/courses/enrolled');
      setCourses(coursesResponse.data.courses);
      
      // Fetch previous feedback submitted by student
      const feedbackResponse = await axios.get('/api/student/feedback');
      setPreviousFeedback(feedbackResponse.data.feedback);
      
    } catch (err) {
      setError('Failed to load initial data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // When course changes, fetch lessons for that course
  useEffect(() => {
    if (feedbackData.course_id) {
      fetchLessons();
    } else {
      setLessons([]);
    }
  }, [feedbackData.course_id]);

  const fetchLessons = async () => {
    try {
      const response = await axios.get(`/api/courses/${feedbackData.course_id}/lessons`);
      setLessons(response.data.lessons);
    } catch (err) {
      console.error('Failed to fetch lessons:', err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFeedbackData({
      ...feedbackData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!feedbackData.subject || !feedbackData.message) {
      setError('Subject and message are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setError('');
      
      await axios.post('/api/student/feedback', feedbackData);
      
      // Show success message
      setSuccess(true);
      
      // Reset form
      setFeedbackData({
        course_id: '',
        lesson_id: '',
        feedback_type: 'question',
        subject: '',
        message: ''
      });
      
      // Refresh previous feedback
      const feedbackResponse = await axios.get('/api/student/feedback');
      setPreviousFeedback(feedbackResponse.data.feedback);
      
    } catch (err) {
      setError('Failed to submit feedback');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
  };
  
  // Format feedback type for display
  const getFeedbackTypeLabel = (type) => {
    switch (type) {
      case 'question':
        return { label: 'Question', color: 'primary', icon: <HelpOutline fontSize="small" /> };
      case 'suggestion':
        return { label: 'Suggestion', color: 'success', icon: <FeedbackIcon fontSize="small" /> };
      case 'issue':
        return { label: 'Issue', color: 'error', icon: <Chat fontSize="small" /> };
      default:
        return { label: 'Feedback', color: 'default', icon: <Chat fontSize="small" /> };
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <QuestionAnswer sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">
          Questions & Feedback
        </Typography>
      </Box>
      
      <Grid container spacing={4}>
        {/* Feedback Form */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Submit Question or Feedback
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    select
                    fullWidth
                    label="Feedback Type"
                    name="feedback_type"
                    value={feedbackData.feedback_type}
                    onChange={handleChange}
                    variant="outlined"
                    required
                  >
                    <MenuItem value="question">Question about lesson content</MenuItem>
                    <MenuItem value="suggestion">Suggestion for improvement</MenuItem>
                    <MenuItem value="issue">Report an issue</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Course (Optional)"
                    name="course_id"
                    value={feedbackData.course_id}
                    onChange={handleChange}
                    variant="outlined"
                    helperText="Select a course if your feedback is course-specific"
                  >
                    <MenuItem value="">- General Feedback -</MenuItem>
                    {courses.map((course) => (
                      <MenuItem key={course.id} value={course.id}>
                        {course.title}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    select
                    fullWidth
                    label="Lesson (Optional)"
                    name="lesson_id"
                    value={feedbackData.lesson_id}
                    onChange={handleChange}
                    variant="outlined"
                    disabled={!feedbackData.course_id || lessons.length === 0}
                    helperText="Select a lesson if your feedback is lesson-specific"
                  >
                    <MenuItem value="">- All Lessons -</MenuItem>
                    {lessons.map((lesson) => (
                      <MenuItem key={lesson.id} value={lesson.id}>
                        {lesson.title}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    name="subject"
                    value={feedbackData.subject}
                    onChange={handleChange}
                    variant="outlined"
                    required
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Message"
                    name="message"
                    value={feedbackData.message}
                    onChange={handleChange}
                    variant="outlined"
                    multiline
                    rows={5}
                    required
                    placeholder="Type your question or feedback here..."
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<Send />}
                    disabled={submitting}
                    fullWidth
                  >
                    {submitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
        
        {/* Previous Feedback */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Your Previous Questions & Feedback
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {previousFeedback.length > 0 ? (
              <Box sx={{ maxHeight: '550px', overflow: 'auto' }}>
                {previousFeedback.map((feedback) => {
                  const typeInfo = getFeedbackTypeLabel(feedback.feedback_type);
                  return (
                    <Card 
                      key={feedback.id} 
                      variant="outlined" 
                      sx={{ 
                        mb: 2,
                        borderLeft: `4px solid ${typeInfo.color === 'primary' ? '#1976d2' : 
                                              typeInfo.color === 'success' ? '#4caf50' : 
                                              typeInfo.color === 'error' ? '#f44336' : '#9e9e9e'}`
                      }}
                    >
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                          <Typography variant="subtitle1" component="div">
                            {feedback.subject}
                          </Typography>
                          <Chip 
                            icon={typeInfo.icon}
                            label={typeInfo.label}
                            color={typeInfo.color}
                            size="small"
                          />
                        </Box>
                        
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {feedback.message}
                        </Typography>
                        
                        <Divider sx={{ my: 1 }} />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary">
                            Submitted on {new Date(feedback.created_at).toLocaleDateString()}
                          </Typography>
                          
                          {feedback.status && (
                            <Chip 
                              label={feedback.status} 
                              size="small"
                              color={
                                feedback.status === 'answered' ? 'success' :
                                feedback.status === 'pending' ? 'warning' : 'default'
                              }
                            />
                          )}
                        </Box>
                        
                        {feedback.response && (
                          <Box sx={{ mt: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                            <Typography variant="subtitle2">
                              Teacher's Response:
                            </Typography>
                            <Typography variant="body2">
                              {feedback.response}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Responded on {new Date(feedback.responded_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <QuestionAnswer sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                <Typography variant="body1" color="text.secondary">
                  You haven't submitted any questions or feedback yet.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      {/* Success Snackbar */}
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Your feedback has been submitted successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default Feedback;
