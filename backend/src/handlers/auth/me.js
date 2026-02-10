const { createSuccessResponse, createErrorResponse } = require('../../utils/response');
const { HTTP_STATUS } = require('../../shared/constants');

/**
 * Decode JWT token payload without verification
 * Used for debugging and extracting user information
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
 * Extract user information from decoded JWT payload
 */
function extractUserFromPayload(payload) {
  // Get role from custom:role attribute (set during signup)
  const customRole = payload['custom:role'];
  
  // Parse Cognito groups as fallback
  const groupsString = payload['cognito:groups'] || '[]';
  let groups = [];
  try {
    groups = JSON.parse(groupsString.replace(/'/g, '"'));
  } catch (e) {
    groups = [];
  }
  
  // Determine user role - prioritize custom:role, then check groups
  let userRole = 'Member'; // Default role
  
  if (customRole) {
    userRole = customRole;
  } else if (groups.includes('Admin')) {
    userRole = 'Admin';
  } else if (groups.includes('Member')) {
    userRole = 'Member';
  }
  
  return {
    userId: payload.sub,
    email: payload.email,
    groups: groups,
    role: userRole,
    customRole: customRole
  };
}

/**
 * Get Current User Handler
 * Returns current user's information from JWT token for debugging
 * This endpoint helps verify that token validation is working correctly
 * 
 * Note: Uses manual token decoding instead of API Gateway authorizer
 * to avoid authorizer configuration issues
 */
exports.handler = async (event) => {
  console.log('Get Current User Event:', JSON.stringify(event, null, 2));
  
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

    // Decode token to get payload
    let payload;
    try {
      payload = decodeToken(token);
      console.log('Decoded token payload:', JSON.stringify(payload, null, 2));
    } catch (decodeError) {
      console.error('Token decode error:', decodeError);
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Invalid token format',
        { error: decodeError.message }
      );
    }

    // Check token expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return createErrorResponse(
        HTTP_STATUS.UNAUTHORIZED,
        'Token has expired'
      );
    }

    // Extract user from payload
    const user = extractUserFromPayload(payload);
    
    console.log('User extracted from token:', JSON.stringify(user, null, 2));
    
    // Return comprehensive user information
    return createSuccessResponse(
      HTTP_STATUS.OK,
      {
        user: {
          userId: user.userId,
          email: user.email,
          role: user.role,
          customRole: user.customRole,
          groups: user.groups
        },
        tokenInfo: {
          issuer: payload.iss,
          audience: payload.aud,
          tokenUse: payload.token_use,
          authTime: payload.auth_time,
          issuedAt: payload.iat,
          expiresAt: payload.exp,
          username: payload['cognito:username'],
          isExpired: payload.exp ? payload.exp < Math.floor(Date.now() / 1000) : false
        },
        debug: {
          customRolePresent: !!payload['custom:role'],
          customRoleValue: payload['custom:role'],
          cognitoGroupsPresent: !!payload['cognito:groups'],
          cognitoGroupsValue: payload['cognito:groups'],
          allClaims: Object.keys(payload)
        }
      },
      'User information retrieved successfully'
    );
    
  } catch (error) {
    console.error('Get current user error:', error);
    
    // Generic error response
    return createErrorResponse(
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      'Failed to get user information',
      { error: error.message }
    );
  }
};
