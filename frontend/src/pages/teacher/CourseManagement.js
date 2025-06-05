import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  CircularProgress, 
  Alert,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Chip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Add, 
  Edit, 
  Delete, 
  People,
  MenuBook
} from '@mui/icons-material';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourses();

    // 添加事件監聽器，當頁面重新獲得焦點時檢查是否需要刷新課程數據
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdates();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkForUpdates);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkForUpdates);
    };
  }, []);
  
  // 檢查sessionStorage中的更新標記
  const checkForUpdates = () => {
    const needsUpdate = sessionStorage.getItem('coursesUpdated') === 'true';
    if (needsUpdate) {
      fetchCourses();
      sessionStorage.removeItem('coursesUpdated'); // 清除標記
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/courses');
      setCourses(response.data.courses);
    } catch (err) {
      setError('Failed to load courses');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCourse = (courseId) => {
    navigate(`/teacher/courses/${courseId}`);
  };

  const handleDeleteClick = (course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!courseToDelete) return;
    
    try {
      await axios.delete(`/api/courses/${courseToDelete.id}`);
      setCourses(courses.filter(course => course.id !== courseToDelete.id));
      setDeleteDialogOpen(false);
      setCourseToDelete(null);
    } catch (err) {
      setError('Failed to delete course');
      console.error(err);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
  };

  const handleManageStudents = (courseId) => {
    navigate(`/teacher/courses/${courseId}/students`);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4">
          Course Management
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={() => navigate('/teacher/courses/new')}
        >
          Create New Course
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {courses.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <MenuBook sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No Courses Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            You haven't created any courses yet. Get started by creating your first course.
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => navigate('/teacher/courses/new')}
          >
            Create First Course
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Course Title</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Units</TableCell>
                <TableCell>Students</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {courses.map((course) => (
                <TableRow key={course.id}>
                  <TableCell component="th" scope="row">
                    {course.title}
                  </TableCell>
                  <TableCell>{course.description}</TableCell>
                  <TableCell>
                    <Chip 
                      label={`${course.units_count || 0} units`} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${course.enrollment_count || 0} students`} 
                      size="small" 
                      color="secondary" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      aria-label="edit"
                      onClick={() => handleEditCourse(course.id)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      aria-label="manage students"
                      onClick={() => handleManageStudents(course.id)}
                      color="secondary"
                    >
                      <People />
                    </IconButton>
                    <IconButton 
                      aria-label="delete"
                      onClick={() => handleDeleteClick(course)}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          {"Delete Course?"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the course "{courseToDelete?.title}"? 
            This action cannot be undone and will remove all units, lessons, and student enrollments 
            associated with this course.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseManagement;
