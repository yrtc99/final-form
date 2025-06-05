import React, { useState, useEffect, useCallback } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  Alert,
  Box
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const CourseList = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const fetchCourses = useCallback(async () => {
    if (!currentUser) {
      setError('請登入以查看您的課程。');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`/api/courses/enrolled?student_id=${currentUser.id}`);
      setCourses(response.data.courses);
    } catch (err) {
      console.error("Error fetching enrolled courses:", err);
      setError(err.response?.data?.error || '無法獲取已註冊的課程。請稍後再試。');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
      </Container>
    );
  }

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        我的課程
      </Typography>
      {courses.length === 0 ? (
        <Typography variant="subtitle1">
          您尚未註冊任何課程。
        </Typography>
      ) : (
        <Grid container spacing={4}>
          {courses.map((course) => (
            <Grid item key={course.id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* For course image */}
                {course.image_url ? (
                  <CardMedia
                    component="img"
                    height="140"
                    image={course.image_url}
                    alt={course.title}
                  />
                ) : (
                  <Box
                    sx={{
                      height: 140,
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography color="white" variant="h5">
                      {course.title.charAt(0).toUpperCase()}
                    </Typography>
                  </Box>
                )}
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography gutterBottom variant="h5" component="h2">
                    {course.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {course.description || '目前沒有描述。'}
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      註冊於：{new Date(course.enrolled_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                </CardContent>
                <Box sx={{ p: 2, mt: 'auto' }}>
                  <Button
                    component={RouterLink}
                    to={`/student/courses/${course.id}`}
                    variant="contained"
                    color="primary"
                    fullWidth
                  >
                    查看課程
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Container>
  );
};

export default CourseList;
