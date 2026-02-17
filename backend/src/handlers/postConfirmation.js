/**
 * Post-Confirmation Lambda Trigger for Cognito
 * Automatically adds newly confirmed users to the "Members" group
 * Admins must be manually assigned via AWS CLI for security
 */

const {
  CognitoIdentityProviderClient,
  AdminAddUserToGroupCommand,
} = require('@aws-sdk/client-cognito-identity-provider');

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'eu-west-1',
});

exports.handler = async (event) => {
  console.log('Post-Confirmation Trigger Event:', JSON.stringify(event, null, 2));
  
  try {
    const userPoolId = event.userPoolId;
    const username = event.userName;
    
    // Add user to Members group by default
    const params = {
      GroupName: 'Members',
      UserPoolId: userPoolId,
      Username: username,
    };
    
    const command = new AdminAddUserToGroupCommand(params);
    await cognitoClient.send(command);
    
    console.log(`Successfully added user ${username} to Members group`);
    
    return event;
  } catch (error) {
    console.error('Error adding user to group:', error);
    // Don't throw error - allow signup to continue even if group assignment fails
    return event;
  }
};
