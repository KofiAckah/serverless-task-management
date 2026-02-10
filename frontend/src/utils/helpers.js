/**
 * Helper Utilities
 * Common helper functions used throughout the app
 */

import { TASK_STATUS, TASK_PRIORITY } from '../config';

/**
 * Format date to readable string
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date and time
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Get color for task status
 */
export const getStatusColor = (status) => {
  const colors = {
    [TASK_STATUS.OPEN]: '#3182ce',
    [TASK_STATUS.IN_PROGRESS]: '#dd6b20',
    [TASK_STATUS.DONE]: '#38a169',
    [TASK_STATUS.CLOSED]: '#718096',
  };
  return colors[status] || '#718096';
};

/**
 * Get color for task priority
 */
export const getPriorityColor = (priority) => {
  const colors = {
    [TASK_PRIORITY.LOW]: '#718096',
    [TASK_PRIORITY.MEDIUM]: '#dd6b20',
    [TASK_PRIORITY.HIGH]: '#e53e3e',
  };
  return colors[priority] || '#718096';
};

/**
 * Validate email format
 */
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  // At least 8 characters, 1 uppercase, 1 lowercase, 1 number, 1 special char
  const re = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return re.test(password);
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Get initials from name
 */
export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

/**
 * Calculate days until due date
 */
export const getDaysUntilDue = (dueDate) => {
  if (!dueDate) return null;
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = due - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Check if task is overdue
 */
export const isOverdue = (dueDate, status) => {
  if (status === TASK_STATUS.DONE || status === TASK_STATUS.CLOSED) return false;
  const days = getDaysUntilDue(dueDate);
  return days !== null && days < 0;
};
