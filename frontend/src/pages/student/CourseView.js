import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  Chip,
  LinearProgress
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ExpandMore, 
  Assignment, 
  CheckCircle, 
  RadioButtonUnchecked,
  School
} from '@mui/icons-material';

const CourseView = () => {
  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth(); // 獲取當前用戶信息

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        // Fetch course details
        const courseResponse = await axios.get(`/api/courses/${courseId}`);
        
        // Fetch progress data for this course with student_id as query parameter
        // 確保currentUser存在且有id屬性
        const studentId = currentUser?.id;
        if (!studentId) {
          console.error('No student ID available. User might not be logged in properly.');
          setError('請登入以查看課程進度。');
          // 仍然可以顯示課程內容，但沒有進度數據
          setProgress({});
        } else {
          try {
            const progressResponse = await axios.get(`/api/progress/course/${courseId}?student_id=${studentId}`);
            
            // 從後端返回的嵌套結構中提取所有課程進度
            const progressMap = {};
            
            // 若返回的數據中存在units屬性
            if (progressResponse.data.progress && progressResponse.data.progress.units) {
              // 遍歷每個單元
              progressResponse.data.progress.units.forEach(unit => {
                // 遍歷每個單元中的課程
                if (unit.lessons && Array.isArray(unit.lessons)) {
                  unit.lessons.forEach(lesson => {
                    // 將課程進度信息存入progressMap中
                    progressMap[lesson.lesson_id] = {
                      completed: lesson.completed,
                      score: lesson.total_score,
                      lesson_id: lesson.lesson_id
                    };
                  });
                }
              });
            } else {
              console.warn('Progress data structure is not as expected:', progressResponse.data);
            }
            
            setProgress(progressMap);
          } catch (err) {
            console.error('Error fetching progress data:', err);
            // 發生錯誤時仍然可以顯示課程內容
            setProgress({});
          }
        }
        
        setCourse(courseResponse.data.course);
        
      } catch (err) {
        setError('載入課程資料失敗');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseData();
  }, [courseId]);

  const getLessonStatus = (lessonId) => {
    if (!progress[lessonId]) return 'not-started';
    
    const lessonProgress = progress[lessonId];
    if (lessonProgress.completed) return 'completed';
    return 'in-progress';
  };
  
  const getLessonScore = (lessonId) => {
    if (!progress[lessonId]) return null;
    return progress[lessonId].score;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!course) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error">找不到課程或您無權存取此課程。</Alert>
      </Container>
    );
  }

  // Calculate overall course progress
  const totalLessons = course.units.reduce((total, unit) => total + unit.lessons.length, 0);
  const completedLessons = Object.values(progress).filter(p => p.completed).length;
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <School sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Box>
            <Typography variant="h4" gutterBottom>
              {course.title}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {course.description}
            </Typography>
          </Box>
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            課程進度：{progressPercentage}% ({completedLessons}/{totalLessons} 課已完成)
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={progressPercentage} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>
      </Paper>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Typography variant="h5" gutterBottom>
        課程內容
      </Typography>
      
      {course.units.map((unit) => (
        <Accordion key={unit.id} defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary
            expandIcon={<ExpandMore />}
            aria-controls={`unit-${unit.id}-content`}
            id={`unit-${unit.id}-header`}
          >
            <Typography variant="h6">{unit.title}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {unit.description}
            </Typography>
            
            <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
              {unit.lessons.map((lesson, index) => {
                const lessonStatus = getLessonStatus(lesson.id);
                const lessonScore = getLessonScore(lesson.id);
                
                return (
                  <React.Fragment key={lesson.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem disablePadding>
                      <ListItemButton 
                        onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                        sx={{
                          borderLeft: lessonStatus === 'completed' 
                            ? '4px solid #4caf50' 
                            : lessonStatus === 'in-progress'
                              ? '4px solid #ff9800'
                              : '4px solid transparent',
                        }}
                      >
                        <ListItemIcon>
                          {lessonStatus === 'completed' ? (
                            <CheckCircle color="success" />
                          ) : (
                            <RadioButtonUnchecked color="action" />
                          )}
                        </ListItemIcon>
                        <ListItemText 
                          primary={lesson.title} 
                          secondary={lesson.description} 
                        />
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {lessonStatus !== 'not-started' && (
                            <Chip 
                              label={lessonScore !== null ? `得分：${lessonScore}%` : '進行中'} 
                              color={lessonStatus === 'completed' ? 'success' : 'warning'}
                              size="small"
                              sx={{ mr: 1 }}
                            />
                          )}
                          <Assignment color="action" />
                        </Box>
                      </ListItemButton>
                    </ListItem>
                  </React.Fragment>
                );
              })}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </Container>
  );
};

export default CourseView;
