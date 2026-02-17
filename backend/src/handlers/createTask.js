const { v4: uuidv4 } = require('uuid');
const { putItem } = require('../utils/dynamodb');
const { getUserFromEvent, validateAdminRole } = require('../utils/auth');
const { TASK_STATUS, TASK_PRIORITY, ASSIGNMENT_STATUS, HTTP_STATUS, CORS_HEADERS } = require('../shared/constants');

const TASKS_TABLE = process.env.TASKS_TABLE;
const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE;

/**
 * Create a new task (Admin only)
 * Assignment requirement: Admins can create and assign tasks
 */
exports.handler = async (event) => {
  console.log('Create Task Event:', JSON.stringify(event, null, 2));
  
  try {
    // Get user from Cognito authorizer
    const user = getUserFromEvent(event);
    
    // Validate admin role (only admins can create tasks)
    validateAdminRole(user);
    
    // Parse request body
    const body = JSON.parse(event.body);
    const { title, description, priority, dueDate, assignedTo } = body;
    
    // Validate required fields
    if (!title) {
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Title is required' })
      };
    }
    
    // Validate assignedTo if provided
    if (assignedTo && !Array.isArray(assignedTo)) {
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'assignedTo must be an array' })
      };
    }
    
    // Create task object
    const taskId = uuidv4();
    const now = Date.now();
    
    const task = {
      taskId,
      title,
      description: description || '',
      status: TASK_STATUS.OPEN,
      priority: priority || TASK_PRIORITY.MEDIUM,
      createdBy: user.userId,
      createdByEmail: user.email,
      createdByName: user.name,
      createdAt: now,
      updatedAt: now
    };
    
    // Add due date if provided
    if (dueDate) {
      task.dueDate = new Date(dueDate).getTime();
    }
    
    // Save to DynamoDB
    await putItem(TASKS_TABLE, task);
    
    console.log('Task created successfully:', taskId);
    
    // Create assignments if assignedTo array is provided
    const assignments = [];
    if (assignedTo && assignedTo.length > 0) {
      for (const assigneeId of assignedTo) {
        const assignmentId = `${taskId}#${assigneeId}`;
        const assignment = {
          assignmentId,
          taskId,
          assigneeId,
          assignedBy: user.userId,
          assignedByEmail: user.email,
          assignedByName: user.name,
          assignedAt: now,
          status: ASSIGNMENT_STATUS.ASSIGNED
        };
        
        await putItem(ASSIGNMENTS_TABLE, assignment);
        assignments.push(assignment);
        console.log('Assignment created:', assignmentId);
      }
    }
    
    return {
      statusCode: HTTP_STATUS.CREATED,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Task created successfully',
        task,
        assignments
      })
    };
    
  } catch (error) {
    console.error('Error creating task:', error);
    
    if (error.message.includes('permissions') || error.message.includes('authenticated')) {
      return {
        statusCode: HTTP_STATUS.FORBIDDEN,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: error.message })
      };
    }
    
    return {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to create task' })
    };
  }
};
