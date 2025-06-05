import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  Paper,
  Tabs,
  Tab,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { 
  CheckCircleOutline,
  ErrorOutline,
  Schedule
} from '@mui/icons-material';

// Import chart components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const translateStatusOrType = (text) => {
  if (!text) return '無';
  const lowerText = String(text).toLowerCase().replace('_', ' ');
  const map = {
    'completed': '已完成',
    'in progress': '進行中',
    'not started': '未開始',
    'passed': '已通過',
    'failed': '未通過',
    'submitted': '已提交',
    'coding': '編程',
    'multiple choice': '選擇題',
    'quiz': '測驗',
    'assignment': '作業'
  };
  return map[lowerText] || (String(text).charAt(0).toUpperCase() + String(text).slice(1).replace('_', ' '));
};

const StudentProgress = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState(null);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [progressData, setProgressData] = useState({
    overview: {},
    lessons: [],
    exercises: []
  });
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStudentData();
  }, [studentId]);
  
  useEffect(() => {
    if (courses.length > 0 && !selectedCourse) {
      setSelectedCourse(courses[0].id);
    }
  }, [courses]);
  
  useEffect(() => {
    if (selectedCourse) {
      fetchProgressData();
    }
  }, [selectedCourse]);

  const fetchStudentData = async () => {
    try {
      setLoading(true);
      
      // Fetch student info
      const studentResponse = await axios.get(`/api/users/${studentId}`);
      setStudent(studentResponse.data.user);
      
      // Fetch enrolled courses
      const enrollmentResponse = await axios.get(`/api/users/${studentId}/enrollments`);
      setCourses(enrollmentResponse.data.courses);
      
    } catch (err) {
      setError('載入學生資料失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchProgressData = async () => {
    try {
      setLoading(true);
      
      // Fetch progress data for selected course
      const progressResponse = await axios.get(`/api/courses/${selectedCourse}/progress/${studentId}`);
      setProgressData(progressResponse.data);
      
    } catch (err) {
      setError('載入進度資料失敗');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value);
  };
  
  // Prepare chart data for progress over time
  const prepareLineChartData = () => {
    if (!progressData.overview.progress_history) return null;
    
    const dates = progressData.overview.progress_history.map(entry => entry.date);
    const completionValues = progressData.overview.progress_history.map(entry => entry.completion_percentage);
    
    return {
      labels: dates,
      datasets: [
        {
          label: '課程完成度 %',
          data: completionValues,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.3
        }
      ]
    };
  };
  
  // Prepare chart data for performance by lesson type
  const prepareBarChartData = () => {
    if (!progressData.overview.performance_by_type) return null;
    
    const lessonTypes = Object.keys(progressData.overview.performance_by_type);
    const scores = lessonTypes.map(type => progressData.overview.performance_by_type[type]);
    
    return {
      labels: lessonTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1)),
      datasets: [
        {
          label: '平均得分 %',
          data: scores,
          backgroundColor: [
            'rgba(255, 99, 132, 0.5)',
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 206, 86, 0.5)'
          ],
          borderColor: [
            'rgb(255, 99, 132)',
            'rgb(54, 162, 235)',
            'rgb(255, 206, 86)'
          ],
          borderWidth: 1
        }
      ]
    };
  };
  
  const getStatusIcon = (status) => {
    switch(status) {
      case 'completed':
        return <CheckCircleOutline color="success" />;
      case 'in_progress':
        return <Schedule color="primary" />;
      case 'not_started':
      default:
        return <ErrorOutline color="disabled" />;
    }
  };

  if (loading && !student) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
        {student ? `${student.username} 的進度` : '學生進度'}
      </Typography>
        {student && (
          <Typography variant="h6" color="text.secondary">
            {student.username} ({student.email})
          </Typography>
        )}
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {courses.length === 0 ? (
        <Alert severity="info">此學生尚未註冊任何課程。</Alert>
      ) : (
        <>
          <Paper sx={{ p: 3, mb: 3 }}>
            <FormControl fullWidth>
              <InputLabel id="course-select-label">選擇課程：</InputLabel>
              <Select
                labelId="course-select-label"
                value={selectedCourse}
                label='選擇課程'
                onChange={handleCourseChange}
                disabled={loading}
              >
                {courses.map((course) => (
                  <MenuItem key={course.id} value={course.id}>
                    {course.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Paper>
          
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <Paper sx={{ mb: 3 }}>
                <Tabs
                  value={tabValue}
                  onChange={handleTabChange}
                  indicatorColor="primary"
                  textColor="primary"
                  centered
                >
                  <Tab label='總覽' />
                  <Tab label='課時' />
                  <Tab label='練習' />
                </Tabs>
              </Paper>
              
              {/* Overview Tab */}
              {tabValue === 0 && (
                <>
                  <Grid container spacing={3} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>課程完成度</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Box sx={{ width: '100%', mr: 1 }}>
                              <LinearProgress 
                                variant="determinate" 
                                value={progressData.overview.completion_percentage || 0} 
                                sx={{ height: 10, borderRadius: 5 }}
                              />
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                    {`${Math.round(progressData.overview.completion_percentage || 0)}% 已完成`}
                  </Typography>
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {`${progressData.overview.completed_lessons || 0} of ${progressData.overview.total_lessons || 0} lessons completed`}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>平均得分</Typography>
                          <Typography variant="h3" align="center" color="primary">
                            {progressData.overview.average_score || 0}%
                          </Typography>
                          <Typography variant="body2" color="text.secondary" align="center">
                            Based on {progressData.overview.submitted_exercises || 0} submitted exercises
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                      <Card>
                        <CardContent>
                          <Typography variant="h6" gutterBottom>最近活動</Typography>
                          {progressData.overview.last_activity ? (
                            <>
                              <Typography variant="body1">
                                {new Date(progressData.overview.last_activity.timestamp).toLocaleDateString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {progressData.overview.last_activity.description}
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" color="text.secondary">尚無活動記錄</Typography>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                  
                  <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>進度趨勢</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {progressData.overview.progress_history ? (
                          <Box sx={{ height: 300 }}>
                            <Line 
                              data={prepareLineChartData()} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    max: 100
                                  }
                                }
                              }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" align="center">資料不足，無法生成圖表</Typography>
                        )}
                      </Paper>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>按練習類型表現</Typography>
                        <Divider sx={{ mb: 2 }} />
                        {progressData.overview.performance_by_type ? (
                          <Box sx={{ height: 300 }}>
                            <Bar 
                              data={prepareBarChartData()} 
                              options={{
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    max: 100
                                  }
                                }
                              }}
                            />
                          </Box>
                        ) : (
                          <Typography variant="body2" color="text.secondary" align="center">資料不足，無法生成圖表</Typography>
                        )}
                      </Paper>
                    </Grid>
                  </Grid>
                </>
              )}
              
              {/* Lessons Tab */}
              {tabValue === 1 && (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>單元</TableCell>
                        <TableCell>課時</TableCell>
                        <TableCell align="center">狀態</TableCell>
                        <TableCell align="center">完成日期</TableCell>
                        <TableCell align="right">花費時間 (分鐘)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {progressData.lessons.length > 0 ? (
                        progressData.lessons.map((lesson) => (
                          <TableRow key={lesson.id}>
                            <TableCell>{lesson.unit_title}</TableCell>
                            <TableCell>{lesson.title}</TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {getStatusIcon(lesson.status)}
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                {translateStatusOrType(lesson.status)}
                              </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {lesson.completion_date ? new Date(lesson.completion_date).toLocaleDateString() : '無'}
                            </TableCell>
                            <TableCell align="right">
                              {lesson.time_spent || 0}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} align="center">
                            尚無課時進度資料
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
              
              {/* Exercises Tab */}
              {tabValue === 2 && (
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>課時</TableCell>
                        <TableCell>練習類型</TableCell>
                        <TableCell align="center">狀態</TableCell>
                        <TableCell align="center">得分</TableCell>
                        <TableCell align="center">嘗試次數</TableCell>
                        <TableCell align="right">提交日期</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {progressData.exercises.length > 0 ? (
                        progressData.exercises.map((exercise) => (
                          <TableRow key={exercise.id}>
                            <TableCell>{exercise.lesson_title}</TableCell>
                            <TableCell>
                              <Chip 
                                label={translateStatusOrType(exercise.type)}
                                size="small"
                                color={
                                  exercise.type === 'coding' ? 'primary' : 
                                  exercise.type === 'multiple_choice' ? 'secondary' : 
                                  'default'
                                }
                              />
                            </TableCell>
                            <TableCell align="center">
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {getStatusIcon(exercise.status)}
                                <Typography variant="body2" sx={{ ml: 1 }}>
                                  {translateStatusOrType(exercise.status)}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell align="center">
                              {exercise.score !== null ? `${exercise.score}%` : '無'}
                            </TableCell>
                            <TableCell align="center">
                              {exercise.attempts || 0}
                            </TableCell>
                            <TableCell align="right">
                              {exercise.submission_date ? new Date(exercise.submission_date).toLocaleDateString() : '無'}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} align="center">
                            尚無練習資料
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}
        </>
      )}
    </Container>
  );
};

export default StudentProgress;
