import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Snackbar
} from '@mui/material';
import { Search, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const StudentsPage = () => {
  // Combined state declarations
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({ username: '', password: '' });
  const [addError, setAddError] = useState('');
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [deleteError, setDeleteError] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');

  const fetchStudents = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/students');
      setStudents(response.data.students);
      setError('');
    } catch (err) {
      setError('載入學生列表失敗：' + (err.response?.data?.error || '請稍後再試'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const filteredStudents = students.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- Add Student Dialog Handlers ---
  const handleAddStudentOpen = () => {
    setNewStudent({ username: '', password: '' });
    setAddError('');
    setOpenAddDialog(true);
  };

  const handleAddStudentClose = () => {
    setOpenAddDialog(false);
  };

  const handleNewStudentChange = (e) => {
    setNewStudent({ ...newStudent, [e.target.name]: e.target.value });
  };

  const handleAddStudentSubmit = async () => {
    if (!newStudent.username || !newStudent.password) {
      setAddError('用戶名和密碼為必填項。');
      return;
    }
    setAddError('');
    try {
      // TODO: Add loading state for submit button
      await axios.post('/api/users', { 
        username: newStudent.username, 
        password: newStudent.password,
        role: 'student' // Explicitly set role
      });
      handleAddStudentClose();
      fetchStudents(); // Refresh student list
      setSnackbarMessage('學生新增成功！');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setAddError(err.response?.data?.error || '新增學生失敗，請稍後再試。');
      setSnackbarMessage(err.response?.data?.error || '新增學生失敗！');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  // --- Delete Student Dialog Handlers ---
  const handleDeleteStudentOpen = (student) => {
    setStudentToDelete(student);
    setDeleteError('');
    setOpenDeleteDialog(true);
  };

  const handleDeleteStudentClose = () => {
    setOpenDeleteDialog(false);
    setStudentToDelete(null);
  };

  const handleDeleteStudentConfirm = async () => {
    if (!studentToDelete) return;
    setDeleteError('');
    try {
      // TODO: Add loading state for delete button
      await axios.delete(`/api/users/${studentToDelete.id}`);
      handleDeleteStudentClose();
      fetchStudents(); // Refresh student list
      setSnackbarMessage('學生刪除成功！');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (err) {
      setDeleteError(err.response?.data?.error || '刪除學生失敗，請稍後再試。');
      setSnackbarMessage(err.response?.data?.error || '刪除學生失敗！');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom component="div">
          所有學生
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddStudentOpen}
          sx={{ mb: 2 }} // Neubrutalism styles will apply from theme
        >
          新增學生
        </Button>
      </Box>
      <Typography variant="body1" paragraph color="text.secondary">
        查看系統中所有已註冊的學生。這些學生可以被添加到您的課程中。
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="按用戶名搜索學生..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {filteredStudents.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>用戶名</TableCell>
                      <TableCell>電子郵件</TableCell>
                      <TableCell>加入日期</TableCell>
                      <TableCell>操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.id}</TableCell>
                        <TableCell>{student.username}</TableCell>
                        <TableCell>{student.email || '無'}</TableCell>
                        <TableCell>
                          {student.created_at ? new Date(student.created_at).toLocaleDateString() : '無'}
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            aria-label="刪除學生"
                            onClick={() => handleDeleteStudentOpen(student)}
                            color="error" // Will be styled by theme, but error color is semantic
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                找不到學生{searchTerm && "符合您的搜索條件"}。
              </Alert>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                顯示 {filteredStudents.length} / {students.length} 個學生
              </Typography>
            </Box>
          </>
        )}
      </Paper>

      {/* Add Student Dialog */}
      <Dialog open={openAddDialog} onClose={handleAddStudentClose} aria-labelledby="form-dialog-title-add-student">
        <DialogTitle id="form-dialog-title-add-student">新增學生</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{mb: 2}}>
            請輸入新學生的用戶名和密碼。
          </DialogContentText>
          {addError && <Alert severity="error" sx={{ mb: 2 }}>{addError}</Alert>}
          <TextField
            autoFocus
            margin="dense"
            id="username"
            name="username"
            label="用戶名"
            type="text"
            fullWidth
            variant="outlined"
            value={newStudent.username}
            onChange={handleNewStudentChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            id="password"
            name="password"
            label="密碼"
            type="password"
            fullWidth
            variant="outlined"
            value={newStudent.password}
            onChange={handleNewStudentChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleAddStudentClose}>取消</Button>
          <Button onClick={handleAddStudentSubmit} variant="contained">新增</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Student Confirmation Dialog */}
      <Dialog
        open={openDeleteDialog}
        onClose={handleDeleteStudentClose}
        aria-labelledby="alert-dialog-title-delete-student"
        aria-describedby="alert-dialog-description-delete-student"
      >
        <DialogTitle id="alert-dialog-title-delete-student">確認刪除學生</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description-delete-student">
            您確定要刪除學生 &quot;{studentToDelete?.username}&quot; 嗎？此操作無法復原。
          </DialogContentText>
          {deleteError && <Alert severity="error" sx={{ mt: 2 }}>{deleteError}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteStudentClose}>取消</Button>
          <Button onClick={handleDeleteStudentConfirm} color="error" variant="contained" autoFocus>
            刪除
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

    </Container>
  );
};

export default StudentsPage;
