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
        setError('Failed to load students: ' + (err.response?.data?.error || 'Please try again later'));
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
        All Students
      </Typography>
      <Typography variant="body1" paragraph color="text.secondary">
        View all students registered in the system. These students can be added to your courses.
      </Typography>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search students by username..."
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
                      <TableCell>Username</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Joined</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredStudents.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>{student.id}</TableCell>
                        <TableCell>{student.username}</TableCell>
                        <TableCell>{student.email || 'N/A'}</TableCell>
                        <TableCell>
                          {student.created_at ? new Date(student.created_at).toLocaleDateString() : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No students found {searchTerm && "matching your search criteria"}.
              </Alert>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Showing {filteredStudents.length} of {students.length} students
              </Typography>
            </Box>
          </>
        )}
      </Paper>
    </Container>
  );
};

export default StudentsPage;
