const { CognitoIdentityProviderClient, ListUsersInGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { getUserFromEvent, validateAdminRole } = require('../utils/auth');
const { HTTP_STATUS, CORS_HEADERS } = require('../shared/constants');

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

/**
 * Get all users (Admin only)
 * Used for task assignment - returns both Admin and Member users
 */
exports.handler = async (event) => {
  console.log('Get Users Event:', JSON.stringify(event, null, 2));
  
  try {
    // Get user from Cognito authorizer
    const user = getUserFromEvent(event);
    
    // Validate admin role (only admins can see users list)
    validateAdminRole(user);
    
    // Get all members
    const membersCommand = new ListUsersInGroupCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      GroupName: 'Member'
    });
    
    const membersResponse = await cognitoClient.send(membersCommand);
    
    // Get all admins
    const adminsCommand = new ListUsersInGroupCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      GroupName: 'Admin'
    });
    
    const adminsResponse = await cognitoClient.send(adminsCommand);
    
    // Combine and format users
    const allCognitoUsers = [
      ...(membersResponse.Users || []),
      ...(adminsResponse.Users || [])
    ];
    
    // Remove duplicates (users can be in multiple groups)
    const uniqueUsers = allCognitoUsers.reduce((acc, cognitoUser) => {
      const userId = cognitoUser.Attributes?.find(attr => attr.Name === 'sub')?.Value;
      
      if (userId && !acc.find(u => u.userId === userId)) {
        const email = cognitoUser.Attributes?.find(attr => attr.Name === 'email')?.Value;
        const name = cognitoUser.Attributes?.find(attr => attr.Name === 'name')?.Value;
        const role = cognitoUser.Attributes?.find(attr => attr.Name === 'custom:role')?.Value;
        
        acc.push({
          userId,
          email,
          name: name || email,
          role: role || 'Member',
          status: cognitoUser.UserStatus
        });
      }
      
      return acc;
    }, []);
    
    // Sort by name
    uniqueUsers.sort((a, b) => a.name.localeCompare(b.name));
    
    console.log(`Found ${uniqueUsers.length} users`);
    
    return {
      statusCode: HTTP_STATUS.OK,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        users: uniqueUsers,
        count: uniqueUsers.length
      })
    };
    
  } catch (error) {
    console.error('Error getting users:', error);
    
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
      body: JSON.stringify({ error: 'Failed to get users' })
    };
  }
};
