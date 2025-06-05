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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { School, People, MenuBook, Add } from '@mui/icons-material';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const TeacherDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalStudents: 0,
    totalLessons: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch courses created by the teacher
        const coursesResponse = await axios.get('/api/courses');
        
        // Fetch enrolled students
        const studentsResponse = await axios.get('/api/users/students');
        
        setCourses(coursesResponse.data.courses);
        setStudents(studentsResponse.data.students);
        
        // Calculate stats
        const totalLessons = coursesResponse.data.courses.reduce((total, course) => {
          return total + (course.total_lessons_in_course || 0);
        }, 0);
        
        setStats({
          totalCourses: coursesResponse.data.courses.length,
          totalStudents: studentsResponse.data.students.length,
          totalLessons: totalLessons
        });
        
      } catch (err) {
        setError('載入儀表板數據失敗');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  // Chart data
  const chartData = {
    labels: courses.slice(0, 5).map(course => course.title),
    datasets: [
      {
        label: '註冊學生',
        data: courses.slice(0, 5).map(course => course.enrollment_count || 0),
        backgroundColor: [
          'rgba(255, 99, 132, 0.6)',
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(75, 192, 192, 0.6)',
          'rgba(153, 102, 255, 0.6)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          教師儀表板
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={() => navigate('/teacher/courses/new')}
        >
          創建課程
        </Button>
      </Box>
      
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
              總課程數
            </Typography>
            <Typography component="p" variant="h4">
              {stats.totalCourses}
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
            <People sx={{ fontSize: 40, mb: 1 }} />
            <Typography component="h2" variant="h6" gutterBottom>
              註冊學生
            </Typography>
            <Typography component="p" variant="h4">
              {stats.totalStudents}
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
            <MenuBook sx={{ fontSize: 40, mb: 1 }} />
            <Typography component="h2" variant="h6" gutterBottom>
              總課時數
            </Typography>
            <Typography component="p" variant="h4">
              {stats.totalLessons}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Course Enrollment Chart */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }} elevation={3}>
            <Typography variant="h6" gutterBottom>
              課程註冊情況
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {courses.length > 0 ? (
              <Box sx={{ height: 300, display: 'flex', justifyContent: 'center' }}>
                <Doughnut 
                  data={chartData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                  }}
                />
              </Box>
            ) : (
              <Alert severity="info">沒有可顯示的課程。</Alert>
            )}
          </Paper>
        </Grid>
        
        {/* Recent Students */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }} elevation={3}>
            <Typography variant="h6" gutterBottom>
              最近的學生
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {students.length > 0 ? (
              <List sx={{ maxHeight: 300, overflow: 'auto' }}>
                {students.slice(0, 5).map((student) => (
                  <ListItem key={student.id} divider>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {student.username.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText 
                      primary={student.username} 
                      secondary={student.email} 
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">尚無學生註冊。</Alert>
            )}
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button 
                variant="outlined" 
                size="small"
                onClick={() => navigate('/teacher/students')}
                startIcon={<People />}
              >
                查看所有學生
              </Button>
            </Box>
          </Paper>
        </Grid>
        
        
      </Grid>
    </Container>
  );
};

export default TeacherDashboard;
