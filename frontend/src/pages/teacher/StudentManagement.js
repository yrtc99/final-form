import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Checkbox,
  Button,
  Divider,
  Grid,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search } from '@mui/icons-material';
import axios from 'axios';

const StudentManagement = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [allStudents, setAllStudents] = useState([]);
  const [enrolledStudentIds, setEnrolledStudentIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchCourseDetails = useCallback(async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}`);
      setCourse(response.data.course);
    } catch (err) {
      console.error('Error fetching course details:', err);
      setError('無法載入課程詳情。');
    }
  }, [courseId]);

  const fetchAllStudents = useCallback(async () => {
    try {
      // Assuming /api/users/students fetches all students (teachers might not be relevant here)
      const response = await axios.get('/api/users/students');
      setAllStudents(response.data.students || []);
    } catch (err) {
      console.error('Error fetching all students:', err);
      setError(prev => prev + (prev ? ' ' : '') + '無法載入所有學生列表。');
    }
  }, []);

  const fetchEnrolledStudents = useCallback(async () => {
    try {
      const response = await axios.get(`/api/courses/${courseId}/enrollments`);
      const enrolledIds = new Set((response.data.enrollments || []).map(enrollment => enrollment.student_id));
      setEnrolledStudentIds(enrolledIds);
    } catch (err) {
      console.error('Error fetching enrolled students:', err);
      setError(prev => prev + (prev ? ' ' : '') + '無法載入已註冊學生列表。');
    }
  }, [courseId]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError('');
      await Promise.all([
        fetchCourseDetails(),
        fetchAllStudents(),
        fetchEnrolledStudents()
      ]);
      setLoading(false);
    };
    loadData();
  }, [courseId, fetchCourseDetails, fetchAllStudents, fetchEnrolledStudents]);

  const handleToggleStudent = (studentId) => {
    setEnrolledStudentIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(studentId)) {
        newSet.delete(studentId);
      } else {
        newSet.add(studentId);
      }
      return newSet;
    });
  };

  const handleSaveChanges = async () => {
    setSaving(true);
    setError('');
    try {
      // API endpoint to update enrollments for the course
      await axios.put(`/api/courses/${courseId}/enrollments`, {
        student_ids: Array.from(enrolledStudentIds)
      });
      // Optionally, show a success message
      alert('學生註冊狀態已更新！'); // Replace with Snackbar later
    } catch (err) {
      console.error('Error saving enrollments:', err);
      setError('儲存學生註冊狀態失敗。');
      // Re-fetch enrolled students to revert optimistic UI updates if needed
      fetchEnrolledStudents();
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = allStudents.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          管理課程學生 - {course ? `"${course.title}"` : '載入中...'}
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          課程 ID: {courseId}
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <TextField
          fullWidth
          variant="outlined"
          placeholder="搜尋學生..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 2 }}
        />

        <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>可選學生列表:</Typography>
        <Box sx={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #ccc', borderRadius: 1, p:1 }}>
          {filteredStudents.length > 0 ? (
            <List dense>
              {filteredStudents.map((student) => (
                <ListItem
                  key={student.id}
                  secondaryAction={
                    <Checkbox
                      edge="end"
                      onChange={() => handleToggleStudent(student.id)}
                      checked={enrolledStudentIds.has(student.id)}
                      disabled={saving}
                    />
                  }
                  disablePadding
                >
                  <Button onClick={() => handleToggleStudent(student.id)} sx={{width: '100%', justifyContent: 'flex-start', textTransform: 'none', color: 'text.primary'}} disabled={saving}>
                    <ListItemText 
                      primary={student.username} 
                      secondary={student.email || '無電郵'}
                    />
                  </Button>
                </ListItem>
              ))}
            </List>
          ) : (
            <Typography sx={{p:2, textAlign: 'center'}}>找不到學生或無學生可選。</Typography>
          )}
        </Box>

        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate('/teacher/courses')}
            disabled={saving}
          >
            返回課程列表
          </Button>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleSaveChanges}
            disabled={saving || loading}
          >
            {saving ? <CircularProgress size={24} color="inherit" /> : '儲存變更'}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default StudentManagement;