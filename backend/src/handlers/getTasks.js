const { getItem, queryItems, scanItems, getTaskAssignments } = require('../utils/dynamodb');
const { getUserFromEvent, isAdmin } = require('../utils/auth');
const { HTTP_STATUS, CORS_HEADERS } = require('../shared/constants');
const { AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { CognitoIdentityProviderClient } = require('@aws-sdk/client-cognito-identity-provider');

const TASKS_TABLE = process.env.TASKS_TABLE;
const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE;
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

/**
 * Get tasks based on user role
 * Assignment requirement:
 * - Admins: View all tasks
 * - Members: View only assigned tasks
 */
exports.handler = async (event) => {
  console.log('Get Tasks Event:', JSON.stringify(event, null, 2));
  
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
    
    const queryParams = event.queryStringParameters || {};
    const { status, taskId } = queryParams;
    
    let tasks = [];
    
    // If specific task requested
    if (taskId) {
      const task = await getItem(TASKS_TABLE, { taskId });
      
      if (!task) {
        return {
          statusCode: HTTP_STATUS.NOT_FOUND,
          headers: CORS_HEADERS,
          body: JSON.stringify({ error: 'Task not found' })
        };
      }
      
      // Check if member has access to this task
      if (!isAdmin(user)) {
        const assignment = await getAssignment(taskId, user.userId);
        if (!assignment) {
          return {
            statusCode: HTTP_STATUS.FORBIDDEN,
            headers: CORS_HEADERS,
            body: JSON.stringify({ error: 'Access denied' })
          };
        }
      }
      
      tasks = [task];
    }
    // If filtering by status
    else if (status) {
      tasks = await queryItems(
        TASKS_TABLE,
        '#status = :statusValue',
        { '#status': 'status' },
        { ':statusValue': status },
        'StatusIndex'
      );
    }
    // Get all tasks
    else {
      tasks = await scanItems(TASKS_TABLE);
    }
    
    // If member, filter to only their assigned tasks
    if (!isAdmin(user) && !taskId) {
      const userAssignments = await queryItems(
        ASSIGNMENTS_TABLE,
        '#assigneeId = :assigneeIdValue',
        { '#assigneeId': 'assigneeId' },
        { ':assigneeIdValue': user.userId },
        'assignee-index'
      );
      
      const assignedTaskIds = userAssignments.map(a => a.taskId);
      tasks = tasks.filter(task => assignedTaskIds.includes(task.taskId));
    }
    
    // Enrich tasks with assignment information
    for (const task of tasks) {
      try {
        const assignments = await getTaskAssignments(task.taskId);
        
        if (assignments && assignments.length > 0) {
          // Get assignee details from  Cognito
          const assignees = [];
          
          for (const assignment of assignments) {
            try {
              const command = new AdminGetUserCommand({
                UserPoolId: COGNITO_USER_POOL_ID,
                Username: assignment.assigneeId
              });
              
              const cognitoUser = await cognitoClient.send(command);
              const email = cognitoUser.UserAttributes?.find(attr => attr.Name === 'email')?.Value;
              const name = cognitoUser.UserAttributes?.find(attr => attr.Name === 'name')?.Value;
              
              assignees.push({
                userId: assignment.assigneeId,
                email: email,
                name: name || email,
                assignedAt: assignment.assignedAt,
                assignedBy: assignment.assignedByName || assignment.assignedByEmail
              });
            } catch (error) {
              console.error(`Error fetching user ${assignment.assigneeId}:`, error);
              // Include partial info if Cognito fetch fails
              assignees.push({
                userId: assignment.assigneeId,
                email: 'Unknown',
                name: 'Unknown User',
                assignedAt: assignment.assignedAt
              });
            }
          }
          
          // Add assignees to task
          task.assignees = assignees;
          task.assignedTo = assignees.map(a => a.email); // For backwards compatibility
        } else {
          task.assignees = [];
          task.assignedTo = [];
        }
      } catch (error) {
        console.error(`Error fetching assignments for task ${task.taskId}:`, error);
        task.assignees = [];
        task.assignedTo = [];
      }
    }
    
    // Sort by createdAt (newest first)
    tasks.sort((a, b) => b.createdAt - a.createdAt);
    
    return {
      statusCode: HTTP_STATUS.OK,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        count: tasks.length,
        tasks
      })
    };
    
  } catch (error) {
    console.error('Error getting tasks:', error);
    return {
      statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
      headers: CORS_HEADERS,
      body: JSON.stringify({ error: 'Failed to get tasks' })
    };
  }
};

// Helper function to get assignment
async function getAssignment(taskId, userId) {
  const assignmentId = `${taskId}#${userId}`;
  return await getItem(ASSIGNMENTS_TABLE, { assignmentId });
}
