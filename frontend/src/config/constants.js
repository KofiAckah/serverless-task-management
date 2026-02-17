export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const AWS_REGION = import.meta.env.VITE_AWS_REGION;
export const COGNITO_USER_POOL_ID = import.meta.env.VITE_COGNITO_USER_POOL_ID;
export const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID;
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Task Management';

export const TASK_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED'
};

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

export const USER_ROLES = {
  ADMIN: 'Admin',
  MEMBER: 'Member'
};
