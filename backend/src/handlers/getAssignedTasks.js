const { getItem, queryItems } = require('../utils/dynamodb');
const { getUserFromEvent, isMember } = require('../utils/auth');
const { HTTP_STATUS, CORS_HEADERS, ASSIGNMENT_STATUS } = require('../shared/constants');

const TASKS_TABLE = process.env.TASKS_TABLE;
const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE;

/**
 * Get tasks assigned to the current user (Members only)
 * Assignment requirement: Members can view their assigned tasks
 * This is a dedicated handler for better separation of concerns
 */
exports.handler = async (event) => {
  console.log('Get Assigned Tasks Event:', JSON.stringify(event, null, 2));
  
  try {
    // Get user from Cognito authorizer
    const user = getUserFromEvent(event);
    
    if (!user) {
      return {
        statusCode: HTTP_STATUS.UNAUTHORIZED,
        headers: CORS_HEADERS,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }
    
    // Members can only view their own assigned tasks
    if (!isMember(user)) {
      return {
        statusCode: HTTP_STATUS.FORBIDDEN,
        headers: CORS_HEADERS,
        body: JSON.stringify({ 
          error: 'This endpoint is for members only. Admins should use /tasks instead.' 
        })
      };
    }
    
    const queryParams = event.queryStringParameters || {};
    const { status } = queryParams;
    
    // Query assignments for this user using assignee-index GSI
    const userAssignments = await queryItems(
      ASSIGNMENTS_TABLE,
      '#assigneeId = :assigneeIdValue',
      { '#assigneeId': 'assigneeId' },
      { ':assigneeIdValue': user.userId },
      'assignee-index'
    );
    
    if (!userAssignments || userAssignments.length === 0) {
      return {
        statusCode: HTTP_STATUS.OK,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          message: 'No tasks assigned to you yet',
          count: 0,
          tasks: []
        })
      };
    }
    
    console.log(`Found ${userAssignments.length} assignments for user ${user.userId}`);
    
    // Get all task details
    const tasksWithAssignments = [];
    
    for (const assignment of userAssignments) {
      try {
        const task = await getItem(TASKS_TABLE, { taskId: assignment.taskId });
        
        if (task) {
          // Filter by status if provided
          if (status && task.status !== status) {
            continue;
          }
          
          // Combine task with assignment information
          tasksWithAssignments.push({
            ...task,
            assignment: {
              assignmentId: assignment.assignmentId,
              assignedAt: assignment.assignedAt,
              assignedBy: assignment.assignedByEmail,
              assignmentStatus: assignment.status || ASSIGNMENT_STATUS.ASSIGNED
            }
          });
        } else {
          console.warn(`Task not found for assignment: ${assignment.taskId}`);
        }
      } catch (error) {
        console.error(`Error fetching task ${assignment.taskId}:`, error);
        // Continue with other tasks
      }
    }
    
    // Sort by assigned date (newest first)
    tasksWithAssignments.sort((a, b) => b.assignment.assignedAt - a.assignment.assignedAt);
    
    // Calculate statistics
    const stats = {
      total: tasksWithAssignments.length,
      byStatus: tasksWithAssignments.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {}),
      byPriority: tasksWithAssignments.reduce((acc, task) => {
        acc[task.priority] = (acc[task.priority] || 0) + 1;
        return acc;
      }, {})
    };
    
    return {
      statusCode: HTTP_STATUS.OK,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        message: 'Tasks retrieved successfully',
        user: {
          userId: user.userId,
          email: user.email
        },
        stats,
        count: tasksWithAssignments.length,
        tasks: tasksWithAssignments
      })
    };
    
  } catch (error) {
    console.error('Error getting assigned tasks:', error);
    
    return {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: CORS_HEADERS,
      body: JSON.stringify({ 
        error: 'Failed to retrieve assigned tasks',
        message: error.message 
      })
    };
  }
};
