const { getUserFromEvent } = require('../../utils/auth');
const { createSuccessResponse, createErrorResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Get Current User Handler
 * Returns current user's information from JWT token for debugging
 * This endpoint helps verify that token validation is working correctly
 */
exports.handler = async (event) => {
  console.log('Get Current User Event:', JSON.stringify(event, null, 2));
  
  try {
    // Extract user from token via API Gateway authorizer
    const user = getUserFromEvent(event);
    
    // Get raw claims for debugging
    const rawClaims = event.requestContext?.authorizer?.claims || {};
    
    console.log('User extracted from token:', JSON.stringify(user, null, 2));
    console.log('Raw JWT claims:', JSON.stringify(rawClaims, null, 2));
    
    // Return comprehensive user information
    return createSuccessResponse({
      user: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        customRole: user.customRole,
        groups: user.groups
      },
      tokenInfo: {
        issuer: rawClaims.iss,
        audience: rawClaims.aud,
        tokenUse: rawClaims.token_use,
        authTime: rawClaims.auth_time,
        issuedAt: rawClaims.iat,
        expiresAt: rawClaims.exp,
        username: rawClaims['cognito:username']
      },
      debug: {
        customRolePresent: !!rawClaims['custom:role'],
        customRoleValue: rawClaims['custom:role'],
        cognitoGroupsPresent: !!rawClaims['cognito:groups'],
        cognitoGroupsValue: rawClaims['cognito:groups'],
        allClaims: Object.keys(rawClaims)
      }
    });
    
  } catch (error) {
    console.error('Get current user error:', error);
    
    // If authentication error, return 401
    if (error.message.includes('not authenticated')) {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Authentication required',
        { error: error.message }
      );
    }
    
    // Generic error response
    return createErrorResponse(
      HTTP_STATUS.INTERNAL_ERROR,
      'Failed to get user information',
      { error: error.message }
    );
  }
};
