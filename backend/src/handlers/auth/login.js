const { CognitoIdentityProviderClient, InitiateAuthCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { createSuccessResponse, createErrorResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../shared/constants');

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

/**
 * User Login Handler
 * Authenticates user with email and password
 */
exports.handler = async (event) => {
  console.log('Login Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { email, password } = body;

    // Validate required fields
    if (!email || !password) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        'Email and password are required'
      );
    }

    // Authenticate with Cognito
    const authParams = {
      ClientId: COGNITO_CLIENT_ID,
      AuthFlow: 'USER_PASSWORD_AUTH',
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password
      }
    };

    console.log('Authenticating user:', email);

    const authCommand = new InitiateAuthCommand(authParams);
    const authResponse = await cognitoClient.send(authCommand);

    // Check if authentication was successful
    if (!authResponse.AuthenticationResult) {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication failed'
      );
    }

    const {
      AccessToken,
      IdToken,
      RefreshToken,
      ExpiresIn,
      TokenType
    } = authResponse.AuthenticationResult;

    console.log('User authenticated successfully:', email);

    return createSuccessResponse(
      HTTP_STATUS.OK,
      {
        accessToken: AccessToken,
        idToken: IdToken,
        refreshToken: RefreshToken,
        expiresIn: ExpiresIn,
        tokenType: TokenType || 'Bearer'
      },
      'Login successful'
    );

  } catch (error) {
    console.error('Login error:', error);

    // Handle specific Cognito errors
    if (error.name === 'NotAuthorizedException') {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Incorrect email or password'
      );
    }

    if (error.name === 'UserNotConfirmedException') {
      return createErrorResponse(
        HTTP_STATUS.FORBIDDEN,
        'User not confirmed. Please verify your email with the confirmation code.'
      );
    }

    if (error.name === 'UserNotFoundException') {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Incorrect email or password'
      );
    }

    if (error.name === 'TooManyRequestsException') {
      return createErrorResponse(
        HTTP_STATUS.TOO_MANY_REQUESTS || 429,
        'Too many login attempts. Please try again later.'
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
      'Login failed',
      { message: error.message }
    );
  }
};
