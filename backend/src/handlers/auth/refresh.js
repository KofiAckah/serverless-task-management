const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { createSuccessResponse, createErrorResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../shared/constants');

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

/**
 * Token Refresh Handler
 * Refreshes access token and ID token using refresh token
 */
exports.handler = async (event) => {
  console.log('Token Refresh Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { refreshToken } = body;

    // Validate required fields
    if (!refreshToken) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        'Refresh token is required'
      );
    }

    console.log('Refreshing tokens');

    // Use REFRESH_TOKEN_AUTH flow
    const authParams = {
      ClientId: COGNITO_CLIENT_ID,
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      AuthParameters: {
        REFRESH_TOKEN: refreshToken
      }
    };

    const authCommand = new InitiateAuthCommand(authParams);
    const authResponse = await cognitoClient.send(authCommand);

    // Check if refresh was successful
    if (!authResponse.AuthenticationResult) {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Token refresh failed'
      );
    }

    const {
      AccessToken,
      IdToken,
      ExpiresIn,
      TokenType
    } = authResponse.AuthenticationResult;

    console.log('Tokens refreshed successfully');

    return createSuccessResponse(
      HTTP_STATUS.OK,
      {
        accessToken: AccessToken,
        idToken: IdToken,
        expiresIn: ExpiresIn,
        tokenType: TokenType || 'Bearer'
      },
      'Tokens refreshed successfully'
    );

  } catch (error) {
    console.error('Token refresh error:', error);

    // Handle specific Cognito errors
    if (error.name === 'NotAuthorizedException') {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Invalid or expired refresh token. Please log in again.'
      );
    }

    if (error.name === 'TooManyRequestsException') {
      return createErrorResponse(
        HTTP_STATUS.TOO_MANY_REQUESTS,
        'Too many refresh requests. Please try again later.'
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
      'Token refresh failed',
      { message: error.message }
    );
  }
};
