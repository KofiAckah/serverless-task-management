/**
 * API Gateway Router
 * Routes incoming API Gateway requests to the appropriate Lambda handler
 */

const createTask = require('./handlers/createTask');
const getTasks = require('./handlers/getTasks');
const getAssignedTasks = require('./handlers/getAssignedTasks');
const updateTask = require('./handlers/updateTask');
const assignTask = require('./handlers/assignTask');
const closeTask = require('./handlers/closeTask');

const { HTTP_STATUS, CORS_HEADERS } = require('./shared/constants');

/**
 * Main router handler
 * Examines the API Gateway event and routes to appropriate handler
 */
exports.handler = async (event) => {
  console.log('API Gateway Event:', JSON.stringify(event, null, 2));
  
  const method = event.httpMethod || event.requestContext?.http?.method;
  const path = event.path || event.requestContext?.http?.path;
  
  console.log(`Routing: ${method} ${path}`);
  
  try {
    // Route based on HTTP method and path
    const route = `${method} ${path}`;
    
    // Match routes using regex patterns
    if (method === 'POST' && path === '/tasks') {
      return await createTask.handler(event);
    }
    
    if (method === 'GET' && path === '/tasks') {
      return await getTasks.handler(event);
    }
    
    if (method === 'GET' && path === '/tasks/assigned') {
      return await getAssignedTasks.handler(event);
    }
    
    if (method === 'PUT' && path.match(/^\/tasks\/[^/]+$/)) {
      return await updateTask.handler(event);
    }
    
    if (method === 'POST' && path.match(/^\/tasks\/[^/]+\/assign$/)) {
      return await assignTask.handler(event);
    }
    
    if (method === 'POST' && path.match(/^\/tasks\/[^/]+\/close$/)) {
      return await closeTask.handler(event);
    }
    
    // No matching route found
    console.error('Route not found:', route);
    return {
      statusCode: HTTP_STATUS.NOT_FOUND,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Not Found',
        message: `Route ${method} ${path} not found`,
        availableRoutes: [
          'POST /tasks',
          'GET /tasks',
          'GET /tasks/assigned',
          'PUT /tasks/{taskId}',
          'POST /tasks/{taskId}/assign',
          'POST /tasks/{taskId}/close'
        ]
      })
    };
    
  } catch (error) {
    console.error('Router error:', error);
    
    return {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        error: 'Internal Server Error',
        message: error.message
      })
    };
  }
};
