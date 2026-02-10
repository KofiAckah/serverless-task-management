const { CognitoIdentityProviderClient, GlobalSignOutCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { createSuccessResponse, createErrorResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../shared/constants');

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

/**
 * User Logout Handler
 * Globally signs out user and invalidates all tokens
 */
exports.handler = async (event) => {
  console.log('Logout Event:', JSON.stringify(event, null, 2));

  try {
    // Extract access token from Authorization header
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    
    if (!authHeader) {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Authorization header is required'
      );
    }

    // Remove "Bearer " prefix
    const accessToken = authHeader.replace(/^Bearer\s+/i, '');

    if (!accessToken) {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Access token is required'
      );
    }

    console.log('Signing out user globally');

    // Global sign out - invalidates all tokens for the user
    const command = new GlobalSignOutCommand({
      AccessToken: accessToken
    });

    await cognitoClient.send(command);

    console.log('User signed out successfully');

    return createSuccessResponse(
      HTTP_STATUS.OK,
      {},
      'Logout successful. All tokens have been invalidated.'
    );

  } catch (error) {
    console.error('Logout error:', error);

    // Handle specific Cognito errors
    if (error.name === 'NotAuthorizedException') {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Invalid or expired access token'
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
