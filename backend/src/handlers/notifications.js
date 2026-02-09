const { unmarshall } = require('@aws-sdk/util-dynamodb');
const { getItem, queryItems } = require('../utils/dynamodb');
const { sendTaskAssignmentEmail, sendTaskStatusUpdateEmail } = require('../utils/ses');

const TASKS_TABLE = process.env.TASKS_TABLE;
const ASSIGNMENTS_TABLE = process.env.ASSIGNMENTS_TABLE;

/**
 * Process DynamoDB Stream events and send email notifications
 * Assignment requirement: Implement notifications using SES for task assignments and updates
 */
exports.handler = async (event) => {
  console.log('DynamoDB Stream Event:', JSON.stringify(event, null, 2));
  
  for (const record of event.Records) {
    try {
      console.log('Processing record:', record.eventID);
      console.log('Event type:', record.eventName);
      
      const tableName = record.eventSourceARN.split('/')[1];
      
      // Handle different table events
      if (tableName.includes('assignments')) {
        await handleAssignmentEvent(record);
      } else if (tableName.includes('tasks')) {
        await handleTaskEvent(record);
      }
      
    } catch (error) {
      console.error('Error processing record:', error);
      // Continue processing other records even if one fails
    }
  }
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Notifications processed' })
  };
};

/**
 * Handle assignment table events
 */
async function handleAssignmentEvent(record) {
  if (record.eventName === 'INSERT') {
    const newAssignment = unmarshall(record.dynamodb.NewImage);
    console.log('New assignment:', newAssignment);
    
    // Get task details
    const task = await getItem(TASKS_TABLE, { taskId: newAssignment.taskId });
    
    if (!task) {
      console.error('Task not found:', newAssignment.taskId);
      return;
    }
    
    // Send assignment notification email using assigneeId
    try {
      // assigneeId is the Cognito user sub, email will be looked up from Cognito
      await sendTaskAssignmentEmail(
        newAssignment.assigneeId,
        task,
        newAssignment.assignedByEmail || 'System'
      );
      console.log('Assignment email sent for assignee:', newAssignment.assigneeId);
    } catch (emailError) {
      console.error('Failed to send assignment email:', emailError);
    }
  }
}

/**
 * Handle task table events
 */
async function handleTaskEvent(record) {
  if (record.eventName === 'MODIFY') {
    const oldTask = unmarshall(record.dynamodb.OldImage);
    const newTask = unmarshall(record.dynamodb.NewImage);
    
    // Check if status changed
    if (oldTask.status !== newTask.status) {
      console.log('Task status changed:', {
        taskId: newTask.taskId,
        oldStatus: oldTask.status,
        newStatus: newTask.status
      });
      
      // Get all assignments for this task using the new task-index GSI
      const assignments = await queryItems(
        ASSIGNMENTS_TABLE,
        '#taskId = :taskIdValue',
        { '#taskId': 'taskId' },
        { ':taskIdValue': newTask.taskId },
        'task-index'
      );
      
      // Extract assigneeIds from all assignments
      const assigneeIds = assignments.map(assignment => assignment.assigneeId);
      
      if (assigneeIds.length === 0) {
        console.log('No assignees found for task:', newTask.taskId);
        return;
      }
      
      // Send status update email to all assignees + all admins (done in SES utility)
      try {
        await sendTaskStatusUpdateEmail(
          assigneeIds,
          newTask,
          oldTask.status,
          newTask.status
        );
        console.log(`Status update email sent for ${assigneeIds.length} assignees`);
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }
  }
}

// Note: unmarshall is now imported from @aws-sdk/util-dynamodb at the top
