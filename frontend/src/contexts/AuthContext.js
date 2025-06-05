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
    const userData = localStorage.getItem('user');
    
    if (userData) {
      setCurrentUser(JSON.parse(userData));
    }
    
    setLoading(false);
  }, []);

  // Login function - 簡化版，不使用 JWT
  const login = async (username, password) => {
    try {
      setError('');
      const response = await axios.post('/api/auth/login', { username, password });
      
      const { user } = response.data;
      
      // 只保存用戶信息，不保存 token
      localStorage.setItem('user', JSON.stringify(user));
      
      setCurrentUser(user);
      return user;
    } catch (err) {
      setError(err.response?.data?.error || '登入失敗');
      throw err;
    }
  };

  // Register function - 簡化版
  const register = async (username, password, role) => {
    try {
      setError('');
      console.log('Sending registration request with data:', { username, password, role });
      
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        username,
        password,
        role
      });
      
      console.log('Registration successful:', response.data);
      return response.data;
    } catch (err) {
      console.error('Registration error:', err);
      const errorMessage = err.response?.data?.error || '註冊失敗';
      console.error('Error details:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  // Logout function - 簡化版
  const logout = () => {
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  // Update profile function - 簡化版
  const updateProfile = async (userData) => {
    try {
      setError('');
      // 添加當前用戶 ID 到請求
      const requestData = {
        ...userData,
        user_id: currentUser.id
      };
      
      const response = await axios.put('/api/auth/profile', requestData);
      
      const updatedUser = response.data.user;
      
      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (err) {
      setError(err.response?.data?.error || '更新個人資料失敗');
      throw err;
    }
  };

  // Change password function - 簡化版
  const changePassword = async (currentPassword, newPassword) => {
    try {
      setError('');
      const response = await axios.put('/api/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
        user_id: currentUser.id
      });
      
      return response.data;
    } catch (err) {
      setError(err.response?.data?.error || '更改密碼失敗');
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