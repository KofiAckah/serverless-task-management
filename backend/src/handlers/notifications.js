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
    
    // Send assignment notification email
    try {
      await sendTaskAssignmentEmail(
        newAssignment.userEmail,
        newAssignment.userEmail.split('@')[0], // Use email prefix as name
        task,
        newAssignment.assignedByEmail
      );
      console.log('Assignment email sent to:', newAssignment.userEmail);
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
      
      // Get all assignments for this task
      const assignments = await queryItems(
        ASSIGNMENTS_TABLE,
        '#taskId = :taskIdValue',
        { '#taskId': 'taskId' },
        { ':taskIdValue': newTask.taskId },
        'TaskIndex'
      );
      
      // Send status update email to all assigned users
      for (const assignment of assignments) {
        try {
          await sendTaskStatusUpdateEmail(
            assignment.userEmail,
            assignment.userEmail.split('@')[0],
            newTask,
            oldTask.status,
            newTask.status
          );
          console.log('Status update email sent to:', assignment.userEmail);
        } catch (emailError) {
          console.error('Failed to send status update email:', emailError);
        }
      }
    }
  }
}

/**
 * Helper function to unmarshall DynamoDB item
 */
function unmarshall(item) {
  const result = {};
  
  for (const [key, value] of Object.entries(item)) {
    if (value.S !== undefined) result[key] = value.S;
    else if (value.N !== undefined) result[key] = Number(value.N);
    else if (value.BOOL !== undefined) result[key] = value.BOOL;
    else if (value.NULL !== undefined) result[key] = null;
    else if (value.L !== undefined) result[key] = value.L.map(unmarshall);
    else if (value.M !== undefined) result[key] = unmarshall(value.M);
  }
  
  return result;
}
