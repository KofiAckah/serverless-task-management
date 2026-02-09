const { getItem, putItem } = require('../utils/dynamodb');
const { getUserFromEvent, validateAdminRole } = require('../utils/auth');
const { ASSIGNMENT_STATUS, HTTP_STATUS, CORS_HEADERS } = require('../shared/constants');

const TASKS_TABLE = process.env.TASKS_TABLE;
const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE;

/**
 * Assign a task to a user (Admin only)
 * Assignment requirement: Admins can assign tasks to members
 */
exports.handler = async (event) => {
  console.log('Assign Task Event:', JSON.stringify(event, null, 2));
  
  try {
    // Get user from Cognito authorizer
    const user = getUserFromEvent(event);
    
    // Validate admin role
    validateAdminRole(user);
    
    // Parse request body
    const body = JSON.parse(event.body);
    const { taskId, userId, userEmail } = body;
    
    // Validate required fields
    if (!taskId || !userId || !userEmail) {
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: 'taskId, userId, and userEmail are required' 
        })
      };
    }
    
    // Check if task exists
    const task = await getItem(TASKS_TABLE, { taskId });
    
    if (!task) {
      return {
        statusCode: HTTP_STATUS.NOT_FOUND,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Task not found' })
      };
    }
    
    // Create assignment
    const assignmentId = `${taskId}#${userId}`;
    const now = Date.now();
    
    const assignment = {
      assignmentId,
      taskId,
      userId,
      userEmail,
      assignedBy: user.userId,
      assignedByEmail: user.email,
      assignedAt: now,
      status: ASSIGNMENT_STATUS.ASSIGNED
    };
    
    // Check if assignment already exists
    const existingAssignment = await getItem(ASSIGNMENTS_TABLE, { assignmentId });
    
    if (existingAssignment) {
      return {
        statusCode: HTTP_STATUS.CONFLICT,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: 'Task already assigned to this user',
          assignment: existingAssignment
        })
      };
    }
    
    // Save assignment
    await putItem(ASSIGNMENTS_TABLE, assignment);
    
    console.log('Task assigned successfully:', assignmentId);
    
    return {
      statusCode: HTTP_STATUS.CREATED,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Task assigned successfully',
        assignment,
        task
      })
    };
    
  } catch (error) {
    console.error('Error assigning task:', error);
    
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
      body: JSON.stringify({ error: 'Failed to assign task' })
    };
  }
};
