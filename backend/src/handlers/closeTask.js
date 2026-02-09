const { getItem, updateItem, queryItems } = require('../utils/dynamodb');
const { getUserFromEvent, validateAdminRole } = require('../utils/auth');
const { TASK_STATUS, HTTP_STATUS, CORS_HEADERS } = require('../shared/constants');
const { sendTaskCompletionEmail } = require('../utils/ses');

const TASKS_TABLE = process.env.TASKS_TABLE;
const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE;

/**
 * Close a task (Admin only)
 * Assignment requirement: Admins can close tasks after completion
 * Sends completion notification email to admin
 */
exports.handler = async (event) => {
  console.log('Close Task Event:', JSON.stringify(event, null, 2));
  
  try {
    // Get user from Cognito authorizer
    const user = getUserFromEvent(event);
    
    // Validate admin role
    validateAdminRole(user);
    
    // Get task ID from path
    const taskId = event.pathParameters?.taskId;
    
    if (!taskId) {
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Task ID is required' })
      };
    }
    
    // Check if task exists
    const existingTask = await getItem(TASKS_TABLE, { taskId });
    
    if (!existingTask) {
      return {
        statusCode: HTTP_STATUS.NOT_FOUND,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Task not found' })
      };
    }
    
    // Check if task is already closed
    if (existingTask.status === TASK_STATUS.CLOSED) {
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: 'Task is already closed',
          task: existingTask
        })
      };
    }
    
    // Parse request body for optional closure notes
    const body = event.body ? JSON.parse(event.body) : {};
    const { closureNotes } = body;
    
    // Build update expression
    const updateParts = [
      '#status = :status',
      '#closedAt = :closedAt',
      '#closedBy = :closedBy',
      '#updatedAt = :updatedAt'
    ];
    
    const attributeNames = {
      '#status': 'status',
      '#closedAt': 'closedAt',
      '#closedBy': 'closedBy',
      '#updatedAt': 'updatedAt'
    };
    
    const attributeValues = {
      ':status': TASK_STATUS.CLOSED,
      ':closedAt': Date.now(),
      ':closedBy': user.userId,
      ':updatedAt': Date.now()
    };
    
    // Add closure notes if provided
    if (closureNotes) {
      updateParts.push('#closureNotes = :closureNotes');
      attributeNames['#closureNotes'] = 'closureNotes';
      attributeValues[':closureNotes'] = closureNotes;
    }
    
    const updateExpression = 'SET ' + updateParts.join(', ');
    
    // Close task
    const closedTask = await updateItem(
      TASKS_TABLE,
      { taskId },
      updateExpression,
      attributeNames,
      attributeValues
    );
    
    console.log('Task closed successfully:', taskId);
    
    // Get all assignments for this task using task-index GSI
    const assignments = await queryItems(
      ASSIGNMENTS_TABLE,
      '#taskId = :taskIdValue',
      { '#taskId': 'taskId' },
      { ':taskIdValue': taskId },
      'task-index'
    );
    
    // Send completion notification to admin (using adminId for Cognito lookup)
    try {
      await sendTaskCompletionEmail(
        user.userId,
        closedTask,
        assignments.length
      );
      console.log('Task completion email sent to admin:', user.userId);
    } catch (emailError) {
      console.error('Failed to send completion email:', emailError);
      // Don't fail the request if email fails
    }
    
    return {
      statusCode: HTTP_STATUS.OK,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Task closed successfully',
        task: closedTask,
        assignedUsersCount: assignments.length
      })
    };
    
  } catch (error) {
    console.error('Error closing task:', error);
    
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
      body: JSON.stringify({ 
        error: 'Failed to close task',
        message: error.message 
      })
    };
  }
};
