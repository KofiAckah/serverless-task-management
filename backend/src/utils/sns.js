const { SNSClient, PublishCommand, SubscribeCommand, ListSubscriptionsByTopicCommand } = require('@aws-sdk/client-sns');
const { getUserEmail, getAdminEmails } = require('./cognito');

const snsClient = new SNSClient({ region: process.env.AWS_REGION });
const SNS_TOPIC_ARN = process.env.SNS_TOPIC_ARN;
const SENDER_EMAIL = process.env.SENDER_EMAIL || 'kofiackah360@gmail.com';

/**
 * Subscribe an email to SNS topic
 * User will receive confirmation email from AWS
 */
async function subscribeEmail(email) {
  try {
    const params = {
      Protocol: 'email',
      TopicArn: SNS_TOPIC_ARN,
      Endpoint: email,
      ReturnSubscriptionArn: true
    };

    const command = new SubscribeCommand(params);
    const result = await snsClient.send(command);
    
    console.log(`Subscription request sent to ${email}. User must confirm subscription.`);
    return result.SubscriptionArn;
  } catch (error) {
    console.error('Error subscribing email:', error);
    throw error;
  }
}

/**
 * Check if email is already subscribed
 */
async function isEmailSubscribed(email) {
  try {
    const params = {
      TopicArn: SNS_TOPIC_ARN
    };

    const command = new ListSubscriptionsByTopicCommand(params);
    const result = await snsClient.send(command);

    const subscription = result.Subscriptions?.find(
      sub => sub.Endpoint === email && sub.SubscriptionArn !== 'PendingConfirmation'
    );

    return !!subscription;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

/**
 * Send task assignment notification via SNS
 */
async function sendTaskAssignmentEmail(assigneeId, task, assignedByEmail) {
  try {
    // Get assignee email from Cognito
    const recipientEmail = await getUserEmail(assigneeId);
    
    if (!recipientEmail) {
      console.error(`Cannot send assignment email: No email found for assignee ${assigneeId}`);
      return;
    }

    // Check if user is subscribed, if not subscribe them
    const isSubscribed = await isEmailSubscribed(recipientEmail);
    if (!isSubscribed) {
      console.log(`User ${recipientEmail} not subscribed. Sending subscription request...`);
      await subscribeEmail(recipientEmail);
      console.log(`Note: User must confirm subscription before receiving emails.`);
    }

    const recipientName = recipientEmail.split('@')[0];

    const message = `
New Task Assigned: ${task.title}

Hello ${recipientName},

You have been assigned a new task:

Task: ${task.title}
Description: ${task.description || 'No description'}
Priority: ${task.priority}
Status: ${task.status}
${task.dueDate ? `Due Date: ${new Date(task.dueDate).toLocaleDateString()}` : ''}
Assigned By: ${assignedByEmail || 'System'}

Please log in to the Task Management System to view more details.

Best regards,
Task Management System
`;

    const params = {
      TopicArn: SNS_TOPIC_ARN,
      Subject: `New Task Assigned: ${task.title}`,
      Message: message,
      MessageAttributes: {
        email: {
          DataType: 'String',
          StringValue: recipientEmail
        },
        eventType: {
          DataType: 'String',
          StringValue: 'task_assignment'
        },
        priority: {
          DataType: 'String',
          StringValue: task.priority
        }
      }
    };

    const command = new PublishCommand(params);
    await snsClient.send(command);
    console.log(`Assignment notification published to SNS for: ${recipientEmail}`);

  } catch (error) {
    console.error('Error sending task assignment notification:', error);
    // Don't throw - notification failure shouldn't break task creation
  }
}

/**
 * Send task status update notification via SNS
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
        return email;
      })
    );

    // Get admin emails
    const adminEmails = await getAdminEmails();

    // Combine and deduplicate emails
    const allEmails = [...new Set([
      ...assigneeEmails.filter(email => email !== null),
      ...adminEmails.filter(email => email !== null)
    ])];

    if (allEmails.length === 0) {
      console.error('No valid email addresses found for status update notification');
      return;
    }

    console.log(`Publishing status update to SNS for ${allEmails.length} recipients`);

    // Subscribe any unsubscribed emails
    for (const email of allEmails) {
      const isSubscribed = await isEmailSubscribed(email);
      if (!isSubscribed) {
        await subscribeEmail(email);
      }
    }

    const message = `
Task Status Updated: ${task.title}

Hello,

The status of a task has been updated:

Task: ${task.title}
Previous Status: ${oldStatus}
New Status: ${newStatus}
Priority: ${task.priority}
${task.description ? `Description: ${task.description}` : ''}

Please log in to the Task Management System to view more details.

Best regards,
Task Management System
`;

    const params = {
      TopicArn: SNS_TOPIC_ARN,
      Subject: `Task Status Updated: ${task.title}`,
      Message: message,
      MessageAttributes: {
        eventType: {
          DataType: 'String',
          StringValue: 'status_update'
        },
        oldStatus: {
          DataType: 'String',
          StringValue: oldStatus
        },
        newStatus: {
          DataType: 'String',
          StringValue: newStatus
        }
      }
    };

    const command = new PublishCommand(params);
    await snsClient.send(command);
    console.log(`Status update notification published to SNS`);

  } catch (error) {
    console.error('Error sending status update notification:', error);
  }
}

/**
 * Send task completion notification via SNS
 */
async function sendTaskCompletionEmail(adminId, task, assignedUsersCount) {
  try {
    const recipientEmail = await getUserEmail(adminId);
    
    if (!recipientEmail) {
      console.error(`Cannot send completion email: No email found for admin ${adminId}`);
      return;
    }

    // Ensure admin is subscribed
    const isSubscribed = await isEmailSubscribed(recipientEmail);
    if (!isSubscribed) {
      await subscribeEmail(recipientEmail);
    }

    const recipientName = recipientEmail.split('@')[0];

    const message = `
✅ Task Closed: ${task.title}

Hello ${recipientName},

The following task has been closed:

Task: ${task.title}
Description: ${task.description || 'No description'}
Priority: ${task.priority}
Status: CLOSED
Assigned Users: ${assignedUsersCount}
${task.closedAt ? `Closed At: ${new Date(task.closedAt).toLocaleString()}` : ''}
${task.closureNotes ? `Closure Notes: ${task.closureNotes}` : ''}

Best regards,
Task Management System
`;

    const params = {
      TopicArn: SNS_TOPIC_ARN,
      Subject: `Task Closed: ${task.title}`,
      Message: message,
      MessageAttributes: {
        email: {
          DataType: 'String',
          StringValue: recipientEmail
        },
        eventType: {
          DataType: 'String',
          StringValue: 'task_completion'
        }
      }
    };

    const command = new PublishCommand(params);
    await snsClient.send(command);
    console.log(`Completion notification published to SNS for: ${recipientEmail}`);

  } catch (error) {
    console.error('Error sending completion notification:', error);
  }
}

module.exports = {
  sendTaskAssignmentEmail,
  sendTaskStatusUpdateEmail,
  sendTaskCompletionEmail,
  subscribeEmail,
  isEmailSubscribed
};
