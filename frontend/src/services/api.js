/**
 * API Service
 * Handles all HTTP requests to the backend API
 */

import axios from 'axios';
import { config, API_ENDPOINTS } from '../config';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await apiClient.post(API_ENDPOINTS.AUTH.REFRESH, {
            refreshToken,
          });
          
          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return apiClient(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (userData) => apiClient.post(API_ENDPOINTS.AUTH.SIGNUP, userData),
  login: (credentials) => apiClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials),
  logout: () => apiClient.post(API_ENDPOINTS.AUTH.LOGOUT),
  confirm: (data) => apiClient.post(API_ENDPOINTS.AUTH.CONFIRM, data),
  getCurrentUser: () => apiClient.get(API_ENDPOINTS.AUTH.ME),
  refreshToken: (refreshToken) => apiClient.post(API_ENDPOINTS.AUTH.REFRESH, { refreshToken }),
};

// Tasks API
export const tasksAPI = {
  getAll: () => apiClient.get(API_ENDPOINTS.TASKS.GET_ALL),
  getAssigned: () => apiClient.get(API_ENDPOINTS.TASKS.GET_ASSIGNED),
  create: (taskData) => apiClient.post(API_ENDPOINTS.TASKS.CREATE, taskData),
  update: (taskId, taskData) => apiClient.put(API_ENDPOINTS.TASKS.UPDATE(taskId), taskData),
  assign: (taskId, userId) => apiClient.post(API_ENDPOINTS.TASKS.ASSIGN(taskId), { userId }),
  close: (taskId) => apiClient.post(API_ENDPOINTS.TASKS.CLOSE(taskId)),
};

export default apiClient;
