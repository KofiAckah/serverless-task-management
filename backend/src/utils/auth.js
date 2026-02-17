const { USER_ROLES } = require('../shared/constants');

/**
 * Extract user information from API Gateway event
 */
function getUserFromEvent(event) {
  if (!event.requestContext || !event.requestContext.authorizer || !event.requestContext.authorizer.claims) {
    throw new Error('User is not authenticated');
  }
  
  const claims = event.requestContext.authorizer.claims;
  
  // Get role from custom:role attribute (set during signup)
  const customRole = claims['custom:role'];
  
  // Parse Cognito groups - handle both string and array formats
  let groups = [];
  const cognitoGroups = claims['cognito:groups'];
  
  if (cognitoGroups) {
    if (typeof cognitoGroups === 'string') {
      // Could be a plain string like "Admin" or a JSON array string like "['Admin']"
      if (cognitoGroups.startsWith('[') || cognitoGroups.startsWith('{')) {
        try {
          groups = JSON.parse(cognitoGroups.replace(/'/g, '"'));
        } catch (e) {
          // If parsing fails, treat as single group
          groups = [cognitoGroups];
        }
      } else {
        // Plain string - single group
        groups = [cognitoGroups];
      }
    } else if (Array.isArray(cognitoGroups)) {
      groups = cognitoGroups;
    }
  }
  
  // Determine user role - prioritize custom:role, then check groups
  let userRole = USER_ROLES.MEMBER; // Default role
  
  if (customRole) {
    userRole = customRole;
  } else if (groups.includes(USER_ROLES.ADMIN)) {
    userRole = USER_ROLES.ADMIN;
  } else if (groups.includes(USER_ROLES.MEMBER)) {
    userRole = USER_ROLES.MEMBER;
  }
  
  return {
    userId: claims.sub,
    email: claims.email,
    name: claims.name || claims.email, // Use email as fallback if name not set
    groups: groups,
    role: userRole,
    customRole: customRole // Keep original for reference
  };
}

/**
 * Check if user is an admin
 */
function isAdmin(user) {
  return user.role === USER_ROLES.ADMIN || user.groups.includes(USER_ROLES.ADMIN);
}

/**
 * Check if user is a member
 */
function isMember(user) {
  return user.role === USER_ROLES.MEMBER || user.groups.includes(USER_ROLES.MEMBER);
}

/**
 * Validate that user has admin role, throw error if not
 */
function validateAdminRole(user) {
  if (!isAdmin(user)) {
    throw new Error('User does not have required permissions. Admin role required.');
  }
}

/**
 * Check if user is the owner of a resource
 */
function isResourceOwner(user, resourceOwnerId) {
  return user.userId === resourceOwnerId;
}

module.exports = {
  getUserFromEvent,
  isAdmin,
  isMember,
  validateAdminRole,
  isResourceOwner
};
