import React, { useState, useEffect } from 'react';
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
  Chip,
  Alert,
  CircularProgress,
  TextField,
  InputAdornment
} from '@mui/material';
import { Search } from '@mui/icons-material';
import axios from 'axios';

const StudentsPage = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true);
        // 直接請求已無需認證的學生數據
        const response = await axios.get('/api/users/students');
        setStudents(response.data.students);
        setError('');
      } catch (err) {
        console.error('Error fetching students:', err);
        setError('載入學生列表失敗：' + (err.response?.data?.error || '請稍後再試'));
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const filteredStudents = students.filter(student =>
    student.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        所有學生
      </Typography>
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
    </Container>
  );
};

export default StudentsPage;
