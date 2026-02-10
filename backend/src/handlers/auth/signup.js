const { CognitoIdentityProviderClient, SignUpCommand, AdminAddUserToGroupCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { createSuccessResponse, createErrorResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../shared/constants');

const COGNITO_CLIENT_ID = process.env.COGNITO_CLIENT_ID;
const COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID;
const ALLOWED_EMAIL_DOMAINS = (process.env.ALLOWED_EMAIL_DOMAINS || 'amalitech.com,amalitechtraining.org').split(',');

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION
});

/**
 * User Signup Handler
 * Validates email domain and creates new Cognito user with role
 */
exports.handler = async (event) => {
  console.log('Signup Event:', JSON.stringify(event, null, 2));

  try {
    // Parse request body
    const body = JSON.parse(event.body || '{}');
    const { email, password, role = 'member' } = body;

    // Validate required fields
    if (!email || !password) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        'Email and password are required'
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        'Invalid email format'
      );
    }

    // Validate email domain
    const emailDomain = email.split('@')[1]?.toLowerCase();
    if (!ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        `Email domain not allowed. Must be one of: ${ALLOWED_EMAIL_DOMAINS.join(', ')}`
      );
    }

    // Validate role
    const validRoles = ['admin', 'member'];
    const normalizedRole = role.toLowerCase();
    if (!validRoles.includes(normalizedRole)) {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        `Invalid role. Must be 'admin' or 'member'`
      );
    }

    // Create user with Cognito
    const signUpParams = {
      ClientId: COGNITO_CLIENT_ID,
      Username: email,
      Password: password,
      UserAttributes: [
        {
          Name: 'email',
          Value: email
        },
        {
          Name: 'custom:role',
          Value: normalizedRole === 'admin' ? 'Admin' : 'Member'
        }
      ]
    };

    console.log('Creating user:', email, 'with role:', normalizedRole);

    const signUpCommand = new SignUpCommand(signUpParams);
    const signUpResponse = await cognitoClient.send(signUpCommand);

    console.log('User created successfully:', signUpResponse.UserSub);

    // Add user to appropriate Cognito group
    const groupName = normalizedRole === 'admin' ? 'Admin' : 'Member';
    try {
      const addToGroupCommand = new AdminAddUserToGroupCommand({
        UserPoolId: COGNITO_USER_POOL_ID,
        Username: email,
        GroupName: groupName
      });
      await cognitoClient.send(addToGroupCommand);
      console.log(`User added to ${groupName} group`);
    } catch (groupError) {
      console.warn('Failed to add user to group:', groupError.message);
      // Non-critical error, continue with response
    }

    return createSuccessResponse(
      HTTP_STATUS.CREATED,
      {
        userId: signUpResponse.UserSub,
        email,
        role: normalizedRole,
        userConfirmed: signUpResponse.UserConfirmed
      },
      'User registered successfully. Please check your email for verification code.'
    );

  } catch (error) {
    console.error('Signup error:', error);

    // Handle specific Cognito errors
    if (error.name === 'UsernameExistsException') {
      return createErrorResponse(
        HTTP_STATUS.CONFLICT,
        'User with this email already exists'
      );
    }

    if (error.name === 'InvalidPasswordException') {
      return createErrorResponse(
        HTTP_STATUS.BAD_REQUEST,
        'Password does not meet requirements',
        {
          requirements: 'Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols'
        }
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
      'Failed to register user',
      { message: error.message }
    );
  }
};
