import React from 'react';
import { 
  Drawer, 
  List, 
  Divider, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  ListItemButton,
  Box,
  Toolbar
} from '@mui/material';
import { 
  Dashboard, 
  School, 
  Book, 
  People, 
  Settings,
  MenuBook,
  Assignment,
  Person,
  Analytics,
  Class,
  EmojiEvents,
  QuestionAnswer
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 240;

const Sidebar = ({ open, toggleDrawer }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const isTeacher = currentUser?.role === 'teacher';
  
  const teacherMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/teacher/dashboard' },
    { text: 'Courses', icon: <School />, path: '/teacher/courses' },
    { text: 'Students', icon: <People />, path: '/teacher/students' },
    { text: 'Student Progress', icon: <Analytics />, path: '/teacher/students' },
  ];
  
  const studentMenuItems = [
    { text: 'Dashboard', icon: <Dashboard />, path: '/student/dashboard' },
    { text: 'My Courses', icon: <MenuBook />, path: '/student/courses' },
    { text: 'My Progress', icon: <Analytics />, path: '/student/progress' },
    { text: 'Achievements', icon: <EmojiEvents />, path: '/student/achievements' },
    { text: 'Feedback', icon: <QuestionAnswer />, path: '/student/feedback' },
  ];
  
  const menuItems = isTeacher ? teacherMenuItems : studentMenuItems;

  return (
    <Drawer
      variant="persistent"
      open={open}
      sx={{
        width: open ? drawerWidth : 0, // 🔧 關鍵修正：open 時為 240px，關閉時為 0
        flexShrink: 0,
        transition: theme => theme.transitions.create('width', {
          easing: theme.transitions.easing.sharp,
          duration: theme.transitions.duration.enteringScreen,
        }),
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          transition: theme => theme.transitions.create('transform', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        },
      }}
    >
      <Toolbar />
      <Box sx={{ overflow: 'auto', mt: 2 }}>
        <List>
          {menuItems.map((item) => (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                onClick={() => navigate(item.path)}
                selected={location.pathname === item.path}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.text} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <List>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate(isTeacher ? '/teacher/profile' : '/student/profile')}>
              <ListItemIcon><Person /></ListItemIcon>
              <ListItemText primary="My Profile" />
            </ListItemButton>
          </ListItem>
          <ListItem disablePadding>
            <ListItemButton onClick={() => navigate(isTeacher ? '/teacher/settings' : '/student/settings')}>
              <ListItemIcon><Settings /></ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItemButton>
          </ListItem>
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;