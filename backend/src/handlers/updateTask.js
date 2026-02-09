const { getItem, updateItem } = require('../utils/dynamodb');
const { getUserFromEvent, validateAdminRole } = require('../utils/auth');
const { TASK_STATUS, HTTP_STATUS, CORS_HEADERS } = require('../shared/constants');

const TASKS_TABLE = process.env.TASKS_TABLE;

/**
 * Update a task (Admin only)
 * Assignment requirement: Admins can update task details
 */
exports.handler = async (event) => {
  console.log('Update Task Event:', JSON.stringify(event, null, 2));
  
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
    
    // Parse request body
    const body = JSON.parse(event.body);
    const { title, description, status, priority, dueDate } = body;
    
    // Build update expression
    const updateParts = [];
    const attributeNames = {};
    const attributeValues = {};
    
    if (title !== undefined) {
      updateParts.push('#title = :title');
      attributeNames['#title'] = 'title';
      attributeValues[':title'] = title;
    }
    
    if (description !== undefined) {
      updateParts.push('#description = :description');
      attributeNames['#description'] = 'description';
      attributeValues[':description'] = description;
    }
    
    if (status && Object.values(TASK_STATUS).includes(status)) {
      updateParts.push('#status = :status');
      attributeNames['#status'] = 'status';
      attributeValues[':status'] = status;
    }
    
    if (priority !== undefined) {
      updateParts.push('#priority = :priority');
      attributeNames['#priority'] = 'priority';
      attributeValues[':priority'] = priority;
    }
    
    if (dueDate !== undefined) {
      updateParts.push('#dueDate = :dueDate');
      attributeNames['#dueDate'] = 'dueDate';
      attributeValues[':dueDate'] = new Date(dueDate).getTime();
    }
    
    // Always update updatedAt
    updateParts.push('#updatedAt = :updatedAt');
    attributeNames['#updatedAt'] = 'updatedAt';
    attributeValues[':updatedAt'] = Date.now();
    
    if (updateParts.length === 1) { // Only updatedAt
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'No fields to update' })
      };
    }
    
    const updateExpression = 'SET ' + updateParts.join(', ');
    
    // Update task
    const updatedTask = await updateItem(
      TASKS_TABLE,
      { taskId },
      updateExpression,
      attributeNames,
      attributeValues
    );
    
    console.log('Task updated successfully:', taskId);
    
    return {
      statusCode: HTTP_STATUS.OK,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Task updated successfully',
        task: updatedTask
      })
    };
    
  } catch (error) {
    console.error('Error updating task:', error);
    
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
      body: JSON.stringify({ error: 'Failed to update task' })
    };
  }
};
