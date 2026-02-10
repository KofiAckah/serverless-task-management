const { getItem, updateItem } = require('../utils/dynamodb');
const { getUserFromEvent, isAdmin } = require('../utils/auth');
const { TASK_STATUS, HTTP_STATUS, CORS_HEADERS } = require('../shared/constants');

const TASKS_TABLE = process.env.TASKS_TABLE;
const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE;

/**
 * Update a task
 * Assignment requirement: 
 * - Admins can update all task details
 * - Members can update task status for tasks assigned to them
 */
exports.handler = async (event) => {
  console.log('Update Task Event:', JSON.stringify(event, null, 2));
  
  try {
    // Get user from Cognito authorizer
    const user = getUserFromEvent(event);
    
    const userIsAdmin = isAdmin(user);
    
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
    
    // If member, check if task is assigned to them
    if (!userIsAdmin) {
      const assignmentId = `${taskId}#${user.userId}`;
      const assignment = await getItem(ASSIGNMENTS_TABLE, { assignmentId });
      
      if (!assignment) {
        return {
          statusCode: HTTP_STATUS.FORBIDDEN,
          headers: CORS_HEADERS,
          body: JSON.stringify({ 
            error: 'Access denied. You can only update tasks assigned to you.' 
          })
        };
      }
    }
    
    // Parse request body
    const body = JSON.parse(event.body);
    const { title, description, status, priority, dueDate } = body;
    
    // Members can only update status
    if (!userIsAdmin) {
      if (title !== undefined || description !== undefined || priority !== undefined || dueDate !== undefined) {
        return {
          statusCode: HTTP_STATUS.FORBIDDEN,
          headers: CORS_HEADERS,
          body: JSON.stringify({ 
            error: 'Members can only update task status. Other fields require admin privileges.' 
          })
        };
      }
      
      if (status === undefined) {
        return {
          statusCode: HTTP_STATUS.BAD_REQUEST,
          headers: CORS_HEADERS,
          body: JSON.stringify({ 
            error: 'Status field is required for member updates.' 
          })
        };
      }
    }
    
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
