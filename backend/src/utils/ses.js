const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');

const sesClient = new SESClient({ region: process.env.AWS_REGION || 'eu-west-1' });
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'joel.ackah@amalitech.com';

/**
 * Send task assignment notification email
 */
async function sendTaskAssignmentEmail(recipientEmail, recipientName, task, assignedBy) {
  const params = {
    Source: SENDER_EMAIL,
    Destination: {
      ToAddresses: [recipientEmail]
    },
    Message: {
      Subject: {
        Data: `New Task Assigned: ${task.title}`
      },
      Body: {
        Html: {
          Data: `
            <html>
              <body style="font-family: Arial, sans-serif;">
                <h2>New Task Assigned</h2>
                <p>Hello ${recipientName},</p>
                <p>You have been assigned a new task:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>${task.title}</h3>
                  <p><strong>Description:</strong> ${task.description || 'No description'}</p>
                  <p><strong>Priority:</strong> <span style="color: ${task.priority === 'HIGH' ? '#d32f2f' : task.priority === 'MEDIUM' ? '#f57c00' : '#388e3c'};">${task.priority}</span></p>
                  <p><strong>Status:</strong> ${task.status}</p>
                  ${task.dueDate ? `<p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
                  <p><strong>Assigned By:</strong> ${assignedBy}</p>
                </div>
                <p>Please log in to the Task Management System to view more details.</p>
                <p>Best regards,<br/>Task Management System</p>
              </body>
            </html>
          `
        }
      }
    }
  };
  
  const command = new SendEmailCommand(params);
  await sesClient.send(command);
}

/**
 * Send task status update notification
 */
async function sendTaskStatusUpdateEmail(recipientEmail, recipientName, task, oldStatus, newStatus) {
  const params = {
    Source: SENDER_EMAIL,
    Destination: {
      ToAddresses: [recipientEmail]
    },
    Message: {
      Subject: {
        Data: `Task Status Updated: ${task.title}`
      },
      Body: {
        Html: {
          Data: `
            <html>
              <body style="font-family: Arial, sans-serif;">
                <h2>Task Status Updated</h2>
                <p>Hello ${recipientName},</p>
                <p>The status of your assigned task has been updated:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>${task.title}</h3>
                  <p><strong>Previous Status:</strong> ${oldStatus}</p>
                  <p><strong>New Status:</strong> <span style="color: #1976d2;">${newStatus}</span></p>
                  <p><strong>Priority:</strong> ${task.priority}</p>
                </div>
                <p>Please log in to the Task Management System to view more details.</p>
                <p>Best regards,<br/>Task Management System</p>
              </body>
            </html>
          `
        }
      }
    }
  };
  
  const command = new SendEmailCommand(params);
  await sesClient.send(command);
}

/**
 * Send task completion notification to admin
 */
async function sendTaskCompletionEmail(recipientEmail, task, completedBy) {
  const params = {
    Source: SENDER_EMAIL,
    Destination: {
      ToAddresses: [recipientEmail]
    },
    Message: {
      Subject: {
        Data: `Task Completed: ${task.title}`
      },
      Body: {
        Html: {
          Data: `
            <html>
              <body style="font-family: Arial, sans-serif;">
                <h2>Task Completed</h2>
                <p>A task has been marked as completed:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3>${task.title}</h3>
                  <p><strong>Description:</strong> ${task.description || 'No description'}</p>
                  <p><strong>Priority:</strong> ${task.priority}</p>
                  <p><strong>Completed By:</strong> ${completedBy}</p>
                  <p><strong>Completion Date:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
                <p>Best regards,<br/>Task Management System</p>
              </body>
            </html>
          `
        }
      }
    }
  };
  
  const command = new SendEmailCommand(params);
  await sesClient.send(command);
}

module.exports = {
  sendTaskAssignmentEmail,
  sendTaskStatusUpdateEmail,
  sendTaskCompletionEmail
};
