const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const { getUserEmail, getUsersByRole, getAdminEmails } = require('./cognito');

const sesClient = new SESClient({ region: process.env.AWS_REGION }); // AWS Lambda automatically provides this
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'kofiackah360@gmail.com';

/**
 * Send task assignment notification email
 * Converts assigneeId to email via Cognito lookup
 */
async function sendTaskAssignmentEmail(assigneeId, task, assignedByEmail) {
  try {
    // Get assignee email from Cognito
    const recipientEmail = await getUserEmail(assigneeId);
    
    if (!recipientEmail) {
      console.error(`Cannot send assignment email: No email found for assignee ${assigneeId}`);
      return;
    }

    // Extract name from email (simple approach)
    const recipientName = recipientEmail.split('@')[0];

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
                    <p><strong>Assigned By:</strong> ${assignedByEmail || 'System'}</p>
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
    console.log(`Assignment email sent successfully to: ${recipientEmail}`);

  } catch (error) {
    console.error('Error sending task assignment email:', error);
    throw error;
  }
}

/**
 * Send task status update notification to all assignees and admins
 * Gets emails for all assignees + all admins via Cognito
 */
async function sendTaskStatusUpdateEmail(assigneeIds, task, oldStatus, newStatus) {
  try {
    if (!assigneeIds || assigneeIds.length === 0) {
      console.log('No assignees to notify for status change');
      return;
    }

    // Get emails for all assignees
    const assigneeEmails = await Promise.all(
      assigneeIds.map(async (assigneeId) => {
        const email = await getUserEmail(assigneeId);
        if (!email) {
          console.error(`No email found for assignee: ${assigneeId}`);
        }
        return email;
      })
    );

    // Get all admin emails using dedicated function
    const adminEmails = await getAdminEmails();

    // Combine and deduplicate emails, filter out nulls
    const validEmails = [...new Set([
      ...assigneeEmails.filter(email => email !== null),
      ...adminEmails.filter(email => email !== null)
    ])];

    if (validEmails.length === 0) {
      console.error('No valid email addresses found for status update notification');
      return;
    }

    console.log(`Sending status update to ${validEmails.length} recipients:`, validEmails);

    // Send email to all recipients
    const params = {
      Source: SENDER_EMAIL,
      Destination: {
        ToAddresses: validEmails
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
                  <p>Hello,</p>
                  <p>The status of a task has been updated:</p>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>${task.title}</h3>
                    <p><strong>Previous Status:</strong> ${oldStatus}</p>
                    <p><strong>New Status:</strong> <span style="color: #1976d2;">${newStatus}</span></p>
                    <p><strong>Priority:</strong> ${task.priority}</p>
                    ${task.description ? `<p><strong>Description:</strong> ${task.description}</p>` : ''}
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
    console.log(`Status update email sent successfully to ${validEmails.length} recipients`);

  } catch (error) {
    console.error('Error sending task status update email:', error);
    throw error;
  }
}

/**
 * Send task completion notification to admin
 */
async function sendTaskCompletionEmail(adminId, task, assignedUsersCount) {
  try {
    // Get admin email from Cognito
    const recipientEmail = await getUserEmail(adminId);
    
    if (!recipientEmail) {
      console.error(`Cannot send completion email: No email found for admin ${adminId}`);
      return;
    }

    // Extract name from email
    const recipientName = recipientEmail.split('@')[0];

    const params = {
      Source: SENDER_EMAIL,
      Destination: {
        ToAddresses: [recipientEmail]
      },
      Message: {
        Subject: {
          Data: `Task Closed: ${task.title}`
        },
        Body: {
          Html: {
            Data: `
              <html>
                <body style="font-family: Arial, sans-serif;">
                  <h2 style="color: #2e7d32;">✅ Task Closed</h2>
                  <p>Hello ${recipientName},</p>
                  <p>The following task has been closed:</p>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3>${task.title}</h3>
                    <p><strong>Description:</strong> ${task.description || 'No description'}</p>
                    <p><strong>Priority:</strong> ${task.priority}</p>
                    <p><strong>Status:</strong> <span style="color: #2e7d32;">CLOSED</span></p>
                    <p><strong>Assigned Users:</strong> ${assignedUsersCount}</p>
                    ${task.closedAt ? `<p><strong>Closed At:</strong> ${new Date(task.closedAt).toLocaleString()}</p>` : ''}
                    ${task.closureNotes ? `<p><strong>Closure Notes:</strong> ${task.closureNotes}</p>` : ''}
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
    console.log(`Completion email sent successfully to: ${recipientEmail}`);

  } catch (error) {
    console.error('Error sending task completion email:', error);
    throw error;
  }
}

module.exports = {
  sendTaskAssignmentEmail,
  sendTaskStatusUpdateEmail,
  sendTaskCompletionEmail
};
