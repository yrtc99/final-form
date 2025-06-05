import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Grid, 
  Card, 
  CardContent, 
  CardActions,
  Button,
  Box,
  CircularProgress,
  Alert,
  Paper,
  Divider,
  LinearProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { School, Assignment, Timeline } from '@mui/icons-material';

const StudentDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch enrolled courses
        const coursesResponse = await axios.get('/api/courses/enrolled');
        
        // Fetch progress data for all courses
        const progressResponse = await axios.get('/api/progress/summary');
        
        setCourses(coursesResponse.data.courses);
        setProgress(progressResponse.data.progress);
        
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const getProgressPercentage = (courseId) => {
    if (!progress[courseId]) return 0;
    
    const courseProgress = progress[courseId];
    return Math.round((courseProgress.completed_lessons / courseProgress.total_lessons) * 100);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Student Dashboard
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'primary.light',
              color: 'white',
            }}
            className="dashboard-card"
          >
            <School sx={{ fontSize: 40, mb: 1 }} />
            <Typography component="h2" variant="h6" gutterBottom>
              Enrolled Courses
            </Typography>
            <Typography component="p" variant="h4">
              {courses.length}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'secondary.light',
              color: 'white',
            }}
            className="dashboard-card"
          >
            <Assignment sx={{ fontSize: 40, mb: 1 }} />
            <Typography component="h2" variant="h6" gutterBottom>
              Completed Lessons
            </Typography>
            <Typography component="p" variant="h4">
              {Object.values(progress).reduce((total, course) => total + course.completed_lessons, 0)}
            </Typography>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              bgcolor: 'success.light',
              color: 'white',
            }}
            className="dashboard-card"
          >
            <Timeline sx={{ fontSize: 40, mb: 1 }} />
            <Typography component="h2" variant="h6" gutterBottom>
              Average Score
            </Typography>
            <Typography component="p" variant="h4">
              {Object.values(progress).length > 0 
                ? Math.round(Object.values(progress).reduce((total, course) => total + course.average_score, 0) / Object.values(progress).length) 
                : 0}%
            </Typography>
          </Paper>
        </Grid>
        
        {/* My Courses */}
        <Grid item xs={12}>
          <Typography variant="h5" sx={{ mt: 4, mb: 2 }}>
            My Courses
          </Typography>
          <Divider sx={{ mb: 3 }} />
          
          {courses.length === 0 ? (
            <Alert severity="info">You are not enrolled in any courses yet.</Alert>
          ) : (
            <Grid container spacing={3}>
              {courses.map((course) => (
                <Grid item key={course.id} xs={12} md={6} lg={4}>
                  <Card className="dashboard-card">
                    <CardContent>
                      <Typography variant="h6" component="div" gutterBottom>
                        {course.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {course.description}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          Progress:
                        </Typography>
                        <Box sx={{ width: '100%' }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={getProgressPercentage(course.id)} 
                            sx={{ height: 8, borderRadius: 5 }}
                          />
                        </Box>
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {getProgressPercentage(course.id)}%
                        </Typography>
                      </Box>
                    </CardContent>
                    <CardActions>
                      <Button 
                        size="small" 
                        variant="contained" 
                        onClick={() => navigate(`/student/courses/${course.id}`)}
                      >
                        Continue Learning
                      </Button>
                    </CardActions>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentDashboard;
