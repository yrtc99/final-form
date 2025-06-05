import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Check if user is already logged in (from localStorage)
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      // Set axios default header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setCurrentUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  // Login function
  const login = async (username, password) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/login', { username, password });
      
      const { access_token, user } = response.data;
      
      // Save to localStorage
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Set axios default header for all requests
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to login');
      throw err;
    }
  };

  // Register function
  const register = async (username, password, role) => {
    try {
      setError('');
      console.log('Sending registration request with data:', { username, password, role });
      
      // Set explicit URL to avoid proxy issues
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username,
        password,
        role
      });
      
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || 'Failed to register';
      console.error('Error details:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
  };

  // Update profile function
  const updateProfile = async (userData) => {
    try {
      setError('');
      const response = await axios.put('/api/auth/profile', userData);
      
      const updatedUser = response.data.user;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
      throw err;
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError('');
      const response = await axios.put('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password');
      throw err;
    }
  };

  const value = {
    currentUser,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
