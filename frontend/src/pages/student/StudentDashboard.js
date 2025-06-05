import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardActions, 
  CardActionArea,
  Button 
} from '@mui/material';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemButton
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  School, 
  Assessment, 
  Schedule, 
  Notifications, 
  TrendingUp, 
  Assignment,
  ArrowForward,
  CheckCircle
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { Chart } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  PointElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const StudentDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser || !currentUser.id) {
      setError('User not identified. Cannot load dashboard data.');
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      
      // Fetch dashboard summary data, recent activity, and enrolled courses in parallel
      const dashboardPromise = axios.get(`/api/student/dashboard?student_id=${currentUser.id}`);
      const activityPromise = axios.get(`/api/student/activity?student_id=${currentUser.id}`);
      const enrolledCoursesPromise = axios.get(`/api/courses/enrolled?student_id=${currentUser.id}`);
      
      const [dashboardResponse, activityResponse, enrolledCoursesResponse] = await Promise.all([
        dashboardPromise, 
        activityPromise, 
        enrolledCoursesPromise
      ]);
      
      console.log('Dashboard API Response:', dashboardResponse.data);
      console.log('Activity API Response:', activityResponse.data);
      console.log('Enrolled Courses API Response:', enrolledCoursesResponse.data);

      setDashboardData(dashboardResponse.data);
      setRecentActivity(activityResponse.data.activities || []);
      setEnrolledCourses(enrolledCoursesResponse.data.courses || []);
      
    } catch (err) {
      setError('Failed to load dashboard data. Please try refreshing the page.');
      console.error("Error fetching dashboard/activity data:", err.response || err.message || err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  console.log('Current dashboardData state:', dashboardData);
  console.log('Current recentActivity state:', recentActivity);
  console.log('Current enrolledCourses state:', enrolledCourses);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Create chart data for the progress graph
  const progressData = {
    labels: dashboardData?.weekly_progress?.map(item => `Week ${item.week}`) || [],
    datasets: [
      {
        label: 'Lessons Completed',
        data: dashboardData?.weekly_progress?.map(item => item.completed_lessons) || [],
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        tension: 0.4,
      }
    ]
  };

  const progressOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Weekly Progress'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Lessons'
        }
      }
    }
  };

  // Create chart data for the scores
  const scoreData = {
    labels: dashboardData?.exercise_scores?.map(item => item.exercise_type) || [],
    datasets: [
      {
        label: 'Average Score (%)',
        data: dashboardData?.exercise_scores?.map(item => item.average_score) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
        ],
        borderWidth: 1,
      }
    ]
  };

  const scoreOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Performance by Exercise Type'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        title: {
          display: true,
          text: 'Score (%)'
        }
      }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Welcome back, {currentUser?.username || 'Student'}!
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<School />}
          onClick={() => navigate('/student/courses')}
        >
          My Courses
        </Button>
      </Box>
      
      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Enrolled Courses
              </Typography>
              <School color="primary" />
            </Box>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1 }}>
              {dashboardData?.total_courses_enrolled || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dashboardData?.recently_enrolled ? 'New course enrolled recently' : ''}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Completed Lessons
              </Typography>
              <CheckCircle color="success" />
            </Box>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1 }}>
              {dashboardData?.completed_lessons || 0}/{dashboardData?.total_lessons || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round((dashboardData?.completed_lessons / (dashboardData?.total_lessons || 1)) * 100)}% complete
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Average Score
              </Typography>
              <Assessment color="primary" />
            </Box>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1 }}>
              {dashboardData?.average_score ? `${Math.round(dashboardData?.average_score)}%` : 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              From all exercises
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                Study Streak
              </Typography>
              <TrendingUp color="secondary" />
            </Box>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1 }}>
              {dashboardData?.streak_days || 0} days
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Keep it going!
            </Typography>
          </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={4}>
        {/* Progress chart */}
        <Grid item xs={12} md={8}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 360,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Your Learning Progress
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {dashboardData?.weekly_progress?.length ? (
              <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
                <Chart type='line' data={progressData} options={progressOptions} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No progress data available yet. Start learning!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Recent activity */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 360,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {recentActivity.length > 0 ? (
              <List dense>
                {recentActivity.map((activity, index) => (
                  <ListItem 
                    key={index}
                    disablePadding
                    sx={{ mb: 1 }}
                  >
                    <ListItemButton
                      onClick={() => {
                        if (activity.lesson_id) {
                          navigate(`/student/lessons/${activity.lesson_id}`);
                        } else if (activity.course_id) {
                          navigate(`/student/courses/${activity.course_id}`);
                        }
                      }}
                      disabled={!activity.lesson_id && !activity.course_id}
                    >
                      <ListItemIcon>
                        {activity.type === 'completed_lesson' && <CheckCircle color="success" />}
                        {activity.type === 'started_lesson' && <Assignment color="primary" />}
                        {activity.type === 'enrolled_course' && <School color="secondary" />}
                        {activity.type === 'feedback_received' && <Notifications color="warning" />}
                      </ListItemIcon>
                      <ListItemText 
                        primary={activity.title} 
                        secondary={
                          <>
                            {activity.description}
                            <Typography variant="caption" display="block" color="text.secondary">
                              {new Date(activity.timestamp).toLocaleString()}
                            </Typography>
                          </>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No recent activity. Start learning!
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Performance by exercise type */}
        <Grid item xs={12} md={6}>
          <Paper
            sx={{
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              height: 400,
            }}
          >
            <Typography variant="h6" gutterBottom>
              Performance by Exercise Type
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {dashboardData?.exercise_scores?.length ? (
              <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
                <Chart type='bar' data={scoreData} options={scoreOptions} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  Complete exercises to see your performance analytics.
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Continue learning card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Continue Learning
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {dashboardData?.recent_lessons?.length > 0 ? (
              <Grid container spacing={2} sx={{ flexGrow: 1 }}>
                {dashboardData.recent_lessons.slice(0, 3).map((lesson, index) => (
                  <Grid item xs={12} key={index}>
                    <Card>
                      <CardActionArea onClick={() => navigate(`/student/lessons/${lesson.id}`)}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box>
                              <Typography gutterBottom variant="subtitle1" component="div">
                                {lesson.title}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {lesson.course_title} • {lesson.unit_title}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                {lesson.status === 'in_progress' ? 'In progress - Continue where you left off' : 'Not started yet'}
                              </Typography>
                            </Box>
                            <Box>
                              <ArrowForward color="primary" />
                            </Box>
                          </Box>
                        </CardContent>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No lessons in progress. Start a new lesson!
                </Typography>
              </Box>
            )}
            
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/student/courses')}
              sx={{ mt: 'auto' }}
            >
              See All Courses
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentDashboard;