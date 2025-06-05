import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  TextField,
  Button,
  Divider,
  Avatar,
  Alert,
  CircularProgress,
  Snackbar
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import {
  Save,
  Lock,
} from '@mui/icons-material';

const ProfilePage = () => {
  const { user, updateProfile, changePassword } = useAuth();
  
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    bio: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user) {
      setProfileData({
        username: user.username || '',
        email: user.email || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData({
      ...profileData,
      [name]: value
    });
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setProfileError('');
      
      await updateProfile(profileData);
      setProfileSuccess(true);
      
      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setProfileSuccess(false);
      }, 3000);
      
    } catch (error) {
      setProfileError(error.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }
    
    try {
      setLoading(true);
      setPasswordError('');
      
      await changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      
      setPasswordSuccess(true);
      
      // Clear password fields after successful change
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Auto-close success message after 3 seconds
      setTimeout(() => {
        setPasswordSuccess(false);
      }, 3000);
      
    } catch (error) {
      setPasswordError(error.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" gutterBottom>
        My Profile
      </Typography>
      
      <Grid container spacing={4}>
        {/* Profile Information Section */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {profileError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {profileError}
              </Alert>
            )}
            
            <form onSubmit={handleProfileSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                    <Avatar
                      sx={{ width: 100, height: 100, fontSize: 40, bgcolor: 'primary.main' }}
                    >
                      {profileData.username ? profileData.username.charAt(0).toUpperCase() : '?'}
                    </Avatar>
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={profileData.username}
                    onChange={handleProfileChange}
                    variant="outlined"
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    variant="outlined"
                    type="email"
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Bio"
                    name="bio"
                    value={profileData.bio}
                    onChange={handleProfileChange}
                    variant="outlined"
                    multiline
                    rows={4}
                    disabled={loading}
                    helperText="Tell us about yourself (optional)"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    startIcon={<Save />}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
        
        {/* Password Change Section */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Change Password
            </Typography>
            <Divider sx={{ mb: 3 }} />
            
            {passwordError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {passwordError}
              </Alert>
            )}
            
            <form onSubmit={handlePasswordSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Current Password"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    type="password"
                    required
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="New Password"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    type="password"
                    required
                    disabled={loading}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Confirm New Password"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    variant="outlined"
                    type="password"
                    required
                    disabled={loading}
                    error={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== ''}
                    helperText={passwordData.newPassword !== passwordData.confirmPassword && passwordData.confirmPassword !== '' ? 'Passwords do not match' : ''}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    color="secondary"
                    startIcon={<Lock />}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Updating...' : 'Change Password'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>
      </Grid>
      
      {/* Success Snackbars */}
      <Snackbar
        open={profileSuccess}
        autoHideDuration={3000}
        onClose={() => setProfileSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Profile updated successfully!
        </Alert>
      </Snackbar>
      
      <Snackbar
        open={passwordSuccess}
        autoHideDuration={3000}
        onClose={() => setPasswordSuccess(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" sx={{ width: '100%' }}>
          Password changed successfully!
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ProfilePage;
