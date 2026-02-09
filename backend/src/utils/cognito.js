const { CognitoIdentityProviderClient, AdminGetUserCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({ 
  region: process.env.AWS_REGION // AWS Lambda automatically provides this
});

const USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

/**
 * Get user's email address from Cognito
 * @param {string} userId - Cognito user sub (ID)
 * @returns {Promise<string|null>} User's email address or null if not found
 */
async function getUserEmail(userId) {
  try {
    if (!USER_POOL_ID) {
      console.error('COGNITO_USER_POOL_ID environment variable not set');
      return null;
    }

    if (!userId) {
      console.error('getUserEmail: userId is required');
      return null;
    }

    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId
    });

    const response = await cognitoClient.send(command);
    
    // Find email attribute
    const emailAttribute = response.UserAttributes?.find(attr => attr.Name === 'email');
    
    if (!emailAttribute || !emailAttribute.Value) {
      console.error(`No email found for user: ${userId}`);
      return null;
    }

    return emailAttribute.Value;

  } catch (error) {
    console.error('Error getting user email from Cognito:', error);
    
    // Handle specific error cases
    if (error.name === 'UserNotFoundException') {
      console.error(`User not found in Cognito: ${userId}`);
    }
    
    return null;
  }
}

/**
 * Get user's role from Cognito custom attributes
 * @param {string} userId - Cognito user sub (ID)
 * @returns {Promise<string>} User's role ('admin' or 'member')
 */
async function getUserRole(userId) {
  try {
    if (!USER_POOL_ID) {
      console.error('COGNITO_USER_POOL_ID environment variable not set');
      return 'member';
    }

    if (!userId) {
      console.error('getUserRole: userId is required');
      return 'member';
    }

    const command = new AdminGetUserCommand({
      UserPoolId: USER_POOL_ID,
      Username: userId
    });

    const response = await cognitoClient.send(command);
    
    // Find custom:role attribute
    const roleAttribute = response.UserAttributes?.find(
      attr => attr.Name === 'custom:role'
    );
    
    if (!roleAttribute || !roleAttribute.Value) {
      console.log(`No custom:role found for user ${userId}, defaulting to 'member'`);
      return 'member';
    }

    return roleAttribute.Value;

  } catch (error) {
    console.error('Error getting user role from Cognito:', error);
    
    // Handle specific error cases
    if (error.name === 'UserNotFoundException') {
      console.error(`User not found in Cognito: ${userId}`);
    }
    
    // Default to member role on error
    return 'member';
  }
}

/**
 * Get all users with a specific role
 * @param {string} role - Role to filter by ('admin' or 'member')
 * @returns {Promise<Array>} Array of user objects with userId and email
 */
async function getUsersByRole(role) {
  try {
    if (!USER_POOL_ID) {
      console.error('COGNITO_USER_POOL_ID environment variable not set');
      return [];
    }

    const command = new ListUsersCommand({
      UserPoolId: USER_POOL_ID,
      Filter: `custom:role = "${role}"`
    });

    const response = await cognitoClient.send(command);
    
    if (!response.Users || response.Users.length === 0) {
      console.log(`No users found with role: ${role}`);
      return [];
    }

    // Map users to simpler format
    const users = response.Users.map(user => {
      const emailAttr = user.Attributes?.find(attr => attr.Name === 'email');
      const subAttr = user.Attributes?.find(attr => attr.Name === 'sub');
      
      return {
        userId: subAttr?.Value || user.Username,
        email: emailAttr?.Value || null
      };
    }).filter(user => user.email !== null); // Filter out users without email

    return users;

  } catch (error) {
    console.error('Error listing users by role from Cognito:', error);
    return [];
  }
}

module.exports = {
  getUserEmail,
  getUserRole,
  getUsersByRole
};
