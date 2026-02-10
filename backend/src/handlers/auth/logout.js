const { CognitoIdentityProviderClient, AdminUserGlobalSignOutCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { createSuccessResponse, createErrorResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../shared/constants');

const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

/**
 * Decode JWT token payload without verification
 * Used to extract username for admin sign out
 */
function decodeToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token format');
    }
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    return payload;
  } catch (error) {
    throw new Error('Failed to decode token: ' + error.message);
  }
}

/**
 * User Logout Handler
 * Globally signs out user and invalidates all tokens
 * Uses AdminUserGlobalSignOutCommand which works with ID tokens
 */
exports.handler = async (event) => {
  console.log('Logout Event:', JSON.stringify(event, null, 2));

  try {
    // Extract token from Authorization header
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader) {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Authorization header is required'
      );
    }

    // Remove "Bearer " prefix
    const token = authHeader.replace(/^Bearer\s+/i, '');

    if (!token) {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Token is required'
      );
    }

    // Decode token to get username
    let username;
    try {
      const payload = decodeToken(token);
      username = payload['cognito:username'] || payload.sub || payload.email;
      
      if (!username) {
        throw new Error('Username not found in token');
      }
      
      console.log('Decoded username from token:', username);
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Invalid token format',
        { error: decodeError.message }
      );
    }

    console.log('Signing out user globally:', username);

    // Admin global sign out - works with any valid token (access or ID)
    // Invalidates all tokens for the user
    const command = new AdminUserGlobalSignOutCommand({
      UserPoolId: COGNITO_USER_POOL_ID,
      Username: username
    });

    await cognitoClient.send(command);

    console.log('User signed out successfully:', username);

    return createSuccessResponse(
      HTTP_STATUS.OK,
      { username },
      'Logout successful. All tokens have been invalidated.'
    );

  } catch (error) {
    console.error('Logout error:', error);

    // Handle specific Cognito errors
    if (error.name === 'NotAuthorizedException') {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Invalid or expired token'
      );
    }

    if (error.name === 'UserNotFoundException') {
      return createErrorResponse(
        HTTP_STATUS.NOT_FOUND,
        'User not found'
      );
    }

    if (error.name === 'TooManyRequestsException') {
      return createErrorResponse(
        HTTP_STATUS.TOO_MANY_REQUESTS,
        'Too many requests. Please try again later.'
      );
    }

    return createErrorResponse(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Logout failed',
      { message: error.message }
    );
  }
};
