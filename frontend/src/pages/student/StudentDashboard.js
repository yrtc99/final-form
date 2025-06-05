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
      setError('用戶未識別。無法載入儀表板數據。');
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
      setError('載入儀表板數據失敗。請嘗試刷新頁面。');
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
    labels: dashboardData?.weekly_progress?.map(item => `第 ${item.week} 週`) || [],
    datasets: [
      {
        label: '完成的課程',
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
        text: '每週進度'
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
        label: '平均分數 (%)',
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
        text: '練習表現'
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
          歡迎回來，{currentUser?.username || '學生'}！
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<School />}
          onClick={() => navigate('/student/courses')}
        >
          我的課程
        </Button>
      </Box>
      
      {/* Stats cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                註冊課程
              </Typography>
              <School color="primary" />
            </Box>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1 }}>
              {dashboardData?.total_courses_enrolled || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {dashboardData?.recently_enrolled ? '新課程註冊' : ''}
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                完成課程
              </Typography>
              <CheckCircle color="success" />
            </Box>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1 }}>
              {dashboardData?.completed_lessons || 0}/{dashboardData?.total_lessons || 0}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {Math.round((dashboardData?.completed_lessons / (dashboardData?.total_lessons || 1)) * 100)}% 完成
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                平均分數
              </Typography>
              <Assessment color="primary" />
            </Box>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1 }}>
              {dashboardData?.average_score ? `${Math.round(dashboardData?.average_score)}%` : 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              所有練習
            </Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column', height: 140 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography color="text.secondary" gutterBottom variant="subtitle2">
                學習連勝
              </Typography>
              <TrendingUp color="secondary" />
            </Box>
            <Typography component="p" variant="h4" sx={{ flexGrow: 1 }}>
              {dashboardData?.streak_days || 0} 天
            </Typography>
            <Typography variant="caption" color="text.secondary">
              繼續保持！
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
              我的學習進度
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {dashboardData?.weekly_progress?.length ? (
              <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
                <Chart type='line' data={progressData} options={progressOptions} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  沒有進度數據。開始學習吧！
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
              最近活動
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
                  最近沒有活動。開始學習吧！
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
              按練習類型分的表現
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {dashboardData?.exercise_scores?.length ? (
              <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
                <Chart type='bar' data={scoreData} options={scoreOptions} />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  完成練習以查看您的表現分析。
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>
        
        {/* Continue learning card */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 400, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              繼續學習
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
                                {lesson.status === 'in_progress' ? '進行中 - 從上次離開的地方繼續' : '尚未開始'}
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
                  沒有正在進行的課程。開始新的課程吧！
                </Typography>
              </Box>
            )}
            
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/student/courses')}
              sx={{ mt: 'auto' }}
            >
              查看所有課程
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default StudentDashboard;