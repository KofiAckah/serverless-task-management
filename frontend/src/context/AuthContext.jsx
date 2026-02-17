/**
 * Authentication Context
 * Manages user authentication state globally
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';
import { USER_ROLES } from '../config';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken');
        const idToken = localStorage.getItem('idToken');
        const savedUser = localStorage.getItem('user');
        
        if (accessToken && idToken) {
          try {
            // Try to load user from localStorage first
            if (savedUser) {
              setUser(JSON.parse(savedUser));
            }
            
            // Verify token and get fresh user data from backend
            const response = await authAPI.getCurrentUser();
            const userData = response.data.data.user;
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } catch (err) {
            console.error('Auth verification failed:', err);
            // Clear invalid auth data
            clearAuthData();
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('idToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  };

  const login = async (email, password) => {
    try {
      setError(null);
      setLoading(true);
      
      // Step 1: Login and get tokens
      const loginResponse = await authAPI.login({ email, password });
      const { accessToken, idToken, refreshToken } = loginResponse.data.data;

      // Save tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('idToken', idToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      // Step 2: Get user data
      const userResponse = await authAPI.getCurrentUser();
      const userData = userResponse.data.data.user;
      
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      console.log('Login successful:', userData);
      return { success: true, user: userData };
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Login failed';
      setError(errorMessage);
      clearAuthData();
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setError(null);
      const response = await authAPI.signup(userData);
      console.log('Signup successful:', response.data);
      return { 
        success: true, 
        message: response.data.message,
        data: response.data.data 
      };
    } catch (err) {
      console.error('Signup error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Signup failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const confirmSignup = async (email, code) => {
    try {
      setError(null);
      const response = await authAPI.confirm({ email, code });
      console.log('Confirmation successful:', response.data);
      return { success: true, message: response.data.message };
    } catch (err) {
      console.error('Confirmation error:', err);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Confirmation failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
    authAPI.logout().catch(err => console.error('Logout error:', err));
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getCurrentUser();
      const userData = response.data.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.error('Refresh user error:', err);
      return null;
    }
  };

  const isAuthenticated = () => {
    return user !== null && !!localStorage.getItem('accessToken');
  };

  const isAdmin = () => {
    if (!user) return false;
    const role = user.role || user.customRole || '';
    return role.toLowerCase() === 'admin';
  };

  const isMember = () => {
    if (!user) return false;
    const role = user.role || user.customRole || '';
    return role.toLowerCase() === 'member';
  };

  const value = {
    user,
    loading,
    error,
    login,
    signup,
    confirmSignup,
    logout,
    refreshUser,
    isAuthenticated,
    isAdmin,
    isMember,
    setError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
