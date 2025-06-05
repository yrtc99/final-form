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
      setError('載入課程失敗');
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
      setError('刪除課程失敗');
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
          課程管理
        </Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<Add />}
          onClick={() => navigate('/teacher/courses/new')}
        >
          創建新課程
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {courses.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <MenuBook sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            尚無課程
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            您尚未創建任何課程。開始創建您的第一個課程吧。
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => navigate('/teacher/courses/new')}
          >
            創建第一個課程
          </Button>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>課程標題</TableCell>
                <TableCell>描述</TableCell>
                <TableCell>單元</TableCell>
                <TableCell>學生</TableCell>
                <TableCell align="right">操作</TableCell>
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
                      label={`${course.units_count || 0} 個單元`} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={`${course.enrollment_count || 0} 個學生`} 
                      size="small" 
                      color="secondary" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton 
                      aria-label="編輯"
                      onClick={() => handleEditCourse(course.id)}
                      color="primary"
                    >
                      <Edit />
                    </IconButton>
                    <IconButton 
                      aria-label="管理學生"
                      onClick={() => handleManageStudents(course.id)}
                      color="secondary"
                    >
                      <People />
                    </IconButton>
                    <IconButton 
                      aria-label="刪除"
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
          {"刪除課程？"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            您確定要刪除課程「{courseToDelete?.title}」嗎？此操作無法撤銷，並將刪除與此課程相關的所有單元、課時和學生註冊記錄。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>取消</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            刪除
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default CourseManagement;
