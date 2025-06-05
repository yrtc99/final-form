import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { useAuth } from './contexts/AuthContext';

// Layout components
import Layout from './components/layout/Layout';

// Auth components
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// Student components
import StudentDashboard from './pages/student/StudentDashboard';
import CourseList from './pages/student/CourseList';
import CourseView from './pages/student/CourseView';
import LessonView from './pages/student/LessonView';
import StudentProgress from './pages/student/StudentProgress';
import StudentProfilePage from './pages/student/StudentProfilePage';
import Achievements from './pages/student/Achievements';
import Feedback from './pages/student/Feedback';

// Teacher components
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CourseManagement from './pages/teacher/CourseManagement';
import CourseEditor from './pages/teacher/CourseEditor';
import LessonEditor from './pages/teacher/LessonEditor';
import StudentManagement from './pages/teacher/StudentManagement';
import StudentsPage from './pages/teacher/StudentsPage';

// Common components
import ProfilePage from './pages/common/ProfilePage';


function App() {
  const { currentUser, loading } = useAuth();

  // Protected route component
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</Box>;
    }
    
    if (!currentUser) {
      return <Navigate to="/login" />;
    }
    
    if (requiredRole && currentUser.role !== requiredRole) {
      return <Navigate to={currentUser.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} />;
    }
    
    return children;
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        currentUser ? 
          <Navigate to={currentUser.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} /> : 
          <Login />
      } />
      <Route path="/register" element={
        currentUser ? 
          <Navigate to={currentUser.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} /> : 
          <Register />
      } />

      {/* Student routes */}
      <Route path="/student" element={
        <ProtectedRoute requiredRole="student">
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<StudentDashboard />} />
        <Route path="courses" element={<CourseList />} />
        <Route path="courses/:courseId" element={<CourseView />} />
        <Route path="lessons/:lessonId" element={<LessonView />} />
        <Route path="progress" element={<StudentProgress />} />
        <Route path="profile" element={<StudentProfilePage />} />
        <Route path="achievements" element={<Achievements />} />
        <Route path="feedback" element={<Feedback />} />
      </Route>

      {/* Teacher routes */}
      <Route path="/teacher" element={
        <ProtectedRoute requiredRole="teacher">
          <Layout />
        </ProtectedRoute>
      }>
        <Route path="dashboard" element={<TeacherDashboard />} />
        <Route path="courses" element={<CourseManagement />} />
        <Route path="courses/new" element={<CourseEditor />} />
        <Route path="courses/:courseId" element={<CourseEditor />} />
        <Route path="units/:unitId/lessons/new" element={<LessonEditor />} />
        <Route path="lessons/:lessonId" element={<LessonEditor />} />
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:studentId/progress" element={<StudentProgress />} />
        <Route path="courses/:courseId/students" element={<StudentManagement />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Default redirect */}
      <Route path="/" element={
        currentUser ? 
          <Navigate to={currentUser.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} /> : 
          <Navigate to="/login" />
      } />
      
      {/* Catch all - redirect to appropriate dashboard or login */}
      <Route path="*" element={
        currentUser ? 
          <Navigate to={currentUser.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard'} /> : 
          <Navigate to="/login" />
      } />
    </Routes>
  );
}

export default App;
