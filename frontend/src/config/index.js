/**
 * Application Configuration
 * Backend API and AWS Cognito settings
 */

export const config = {
  // API Configuration
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://64qbg3irni.execute-api.eu-west-1.amazonaws.com/dev',
  
  // AWS Cognito Configuration
  COGNITO: {
    REGION: import.meta.env.VITE_COGNITO_REGION || 'eu-west-1',
    USER_POOL_ID: import.meta.env.VITE_COGNITO_USER_POOL_ID || 'eu-west-1_j6w7VPIZj',
    CLIENT_ID: import.meta.env.VITE_COGNITO_CLIENT_ID || '29a2loo8jg00c3gqroajssclfm',
  },
};

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    SIGNUP: '/auth/signup',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    CONFIRM: '/auth/confirm',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  
  // Tasks
  TASKS: {
    GET_ALL: '/tasks',
    GET_ASSIGNED: '/tasks/assigned',
    CREATE: '/tasks',
    UPDATE: (taskId) => `/tasks/${taskId}`,
    ASSIGN: (taskId) => `/tasks/${taskId}/assign`,
    CLOSE: (taskId) => `/tasks/${taskId}/close`,
  },
};

// User Roles
export const USER_ROLES = {
  ADMIN: 'Admin',
  MEMBER: 'Member',
};

// Task Status
export const TASK_STATUS = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  CLOSED: 'Closed',
};

// Task Priority
export const TASK_PRIORITY = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};
