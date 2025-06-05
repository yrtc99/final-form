import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Paper,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Divider,
  LinearProgress
} from '@mui/material';
import axios from 'axios';
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
  PointElement,
  ArcElement
} from 'chart.js';
import { useAuth } from '../../contexts/AuthContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const StudentProgress = () => {
  const [progressData, setProgressData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/student/progress');
      setProgressData(response.data);
    } catch (err) {
      setError('Failed to load progress data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Create data for progress line chart
  const progressChartData = {
    labels: progressData?.weekly_data?.map(item => `Week ${item.week}`) || [],
    datasets: [
      {
        label: 'Lessons Completed',
        data: progressData?.weekly_data?.map(item => item.lessons_completed) || [],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.3,
        fill: false
      },
      {
        label: 'Exercises Completed',
        data: progressData?.weekly_data?.map(item => item.exercises_completed) || [],
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
        tension: 0.3,
        fill: false
      }
    ]
  };

  // Create data for exercise performance chart
  const exercisePerformanceData = {
    labels: ['Coding Exercises', 'Multiple Choice', 'Fill in Blanks'],
    datasets: [
      {
        label: 'Average Score (%)',
        data: [
          progressData?.exercise_stats?.coding_average || 0,
          progressData?.exercise_stats?.multiple_choice_average || 0,
          progressData?.exercise_stats?.fill_blank_average || 0
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Create data for completion donut chart
  const completionData = {
    labels: ['Completed', 'In Progress', 'Not Started'],
    datasets: [
      {
        data: [
          progressData?.completion_stats?.completed || 0,
          progressData?.completion_stats?.in_progress || 0,
          progressData?.completion_stats?.not_started || 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(201, 203, 207, 0.5)'
        ],
        borderColor: [
          'rgb(75, 192, 192)',
          'rgb(255, 206, 86)',
          'rgb(201, 203, 207)'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        My Progress
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Box sx={{ mb: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="Overview" />
          <Tab label="Course Progress" />
          <Tab label="Exercise Performance" />
        </Tabs>
      </Box>
      
      {/* Overview Tab */}
      {activeTab === 0 && (
        <>
          {/* Summary Cards */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Overall Completion
                  </Typography>
                  <Box sx={{ height: 200, display: 'flex', justifyContent: 'center' }}>
                    <Chart type='doughnut' data={completionData} options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        }
                      }
                    }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={8}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Learning Stats
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Average Score
                      </Typography>
                      <Typography variant="h4">
                        {progressData?.overall_stats?.average_score 
                          ? Math.round(progressData.overall_stats.average_score) + '%' 
                          : 'N/A'}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Courses Enrolled
                      </Typography>
                      <Typography variant="h4">
                        {progressData?.overall_stats?.courses_enrolled || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={4}>
                      <Typography variant="body2" color="text.secondary">
                        Exercise Completion
                      </Typography>
                      <Typography variant="h4">
                        {progressData?.overall_stats?.exercises_completed || 0}
                      </Typography>
                    </Grid>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        Strongest Exercise Type
                      </Typography>
                      <Typography variant="body1" fontWeight="medium">
                        {progressData?.overall_stats?.strongest_area || 'Not enough data'}
                      </Typography>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* Weekly Progress Chart */}
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Weekly Learning Progress
            </Typography>
            <Box sx={{ height: 300 }}>
              <Chart type='line' data={progressChartData} options={{
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Count'
                    }
                  }
                }
              }} />
            </Box>
          </Paper>
          
          {/* Exercise Performance */}
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance by Exercise Type
            </Typography>
            <Box sx={{ height: 300 }}>
              <Chart type='bar' data={exercisePerformanceData} options={{
                responsive: true,
                maintainAspectRatio: false,
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
              }} />
            </Box>
          </Paper>
        </>
      )}
      
      {/* Course Progress Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Course Progress Details
          </Typography>
          
          {progressData?.courses?.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Course Name</TableCell>
                    <TableCell>Progress</TableCell>
                    <TableCell>Completed Lessons</TableCell>
                    <TableCell>Average Score</TableCell>
                    <TableCell>Last Activity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {progressData.courses.map((course) => (
                    <TableRow key={course.id}>
                      <TableCell>{course.title}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Box sx={{ width: '100%', mr: 1 }}>
                            <LinearProgress variant="determinate" value={course.completion_percentage} />
                          </Box>
                          <Box sx={{ minWidth: 35 }}>
                            <Typography variant="body2" color="text.secondary">
                              {Math.round(course.completion_percentage)}%
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {course.completed_lessons} / {course.total_lessons}
                      </TableCell>
                      <TableCell>
                        {course.average_score ? `${Math.round(course.average_score)}%` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {course.last_activity ? new Date(course.last_activity).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              You are not enrolled in any courses yet.
            </Alert>
          )}
        </Paper>
      )}
      
      {/* Exercise Performance Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Exercise Performance Details
          </Typography>
          
          {progressData?.exercises?.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Exercise</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Course</TableCell>
                    <TableCell>Score</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Attempts</TableCell>
                    <TableCell>Last Attempt</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {progressData.exercises.map((exercise) => (
                    <TableRow key={exercise.id}>
                      <TableCell>{exercise.title}</TableCell>
                      <TableCell>
                        <Chip 
                          label={exercise.type.replace('_', ' ')} 
                          size="small"
                          color={
                            exercise.type === 'coding' ? 'primary' : 
                            exercise.type === 'multiple_choice' ? 'secondary' : 
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{exercise.course_title}</TableCell>
                      <TableCell>{exercise.score !== null ? `${exercise.score}%` : 'N/A'}</TableCell>
                      <TableCell>
                        <Chip 
                          label={exercise.status} 
                          size="small"
                          color={
                            exercise.status === 'completed' ? 'success' : 
                            exercise.status === 'in_progress' ? 'warning' : 
                            'default'
                          }
                        />
                      </TableCell>
                      <TableCell>{exercise.attempts}</TableCell>
                      <TableCell>
                        {exercise.last_attempt ? new Date(exercise.last_attempt).toLocaleDateString() : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">
              You haven't attempted any exercises yet.
            </Alert>
          )}
        </Paper>
      )}
    </Container>
  );
};

export default StudentProgress;
