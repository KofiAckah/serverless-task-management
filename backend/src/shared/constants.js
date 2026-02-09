// Task Status Constants
const TASK_STATUS = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CLOSED: 'CLOSED'
};

// Task Priority Constants
const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH'
};

// Assignment Status Constants
const ASSIGNMENT_STATUS = {
  ASSIGNED: 'ASSIGNED',
  ACCEPTED: 'ACCEPTED',
  COMPLETED: 'COMPLETED'
};

// User Roles
const USER_ROLES = {
  ADMIN: 'Admin',
  MEMBER: 'Member'
};

// HTTP Status Codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// CORS Headers
const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
};

module.exports = {
  TASK_STATUS,
  TASK_PRIORITY,
  ASSIGNMENT_STATUS,
  USER_ROLES,
  HTTP_STATUS,
  CORS_HEADERS
};
