const { CognitoIdentityProviderClient, ConfirmSignUpCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { createSuccessResponse, createErrorResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../shared/constants');

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

/**
 * Confirm User Signup Handler
 * Verifies user email with confirmation code
 */
exports.handler = async (event) => {
  console.log('Confirm Signup Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { email, code } = body;

    // Validate required fields
    if (!email || !code) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        'Email and confirmation code are required'
      );
    }

    // Confirm signup with Cognito
    const confirmParams = {
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      ConfirmationCode: code.toString().trim()
    };

    console.log('Confirming user:', email);

    const confirmCommand = new ConfirmSignUpCommand(confirmParams);
    await cognitoClient.send(confirmCommand);

    console.log('User confirmed successfully:', email);

    return createSuccessResponse(
      HTTP_STATUS.OK,
      { email },
      'Email verified successfully. You can now log in.'
    );

  } catch (error) {
    console.error('Confirm signup error:', error);

    // Handle specific Cognito errors
    if (error.name === 'CodeMismatchException') {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid confirmation code. Please check and try again.'
      );
    }

    if (error.name === 'ExpiredCodeException') {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        'Confirmation code has expired. Please request a new code.'
      );
    }

    if (error.name === 'UserNotFoundException') {
      return createErrorResponse(
        HTTP_STATUS.NOT_FOUND,
        'User not found'
      );
    }

    if (error.name === 'NotAuthorizedException') {
      return createErrorResponse(
        HTTP_STATUS.FORBIDDEN,
        'User is already confirmed or confirmation not allowed'
      );
    }

    if (error.name === 'TooManyFailedAttemptsException') {
      return createErrorResponse(
        HTTP_STATUS.TOO_MANY_REQUESTS || 429,
        'Too many failed attempts. Please try again later.'
      );
    }

    if (error.name === 'InvalidParameterException') {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        error.message || 'Invalid parameters provided'
      );
    }

    return createErrorResponse(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to confirm signup',
      { message: error.message }
    );
  }
};
