const { USER_ROLES } = require('../shared/constants');

/**
 * Extract user information from API Gateway event
 */
function getUserFromEvent(event) {
  if (!event.requestContext || !event.requestContext.authorizer || !event.requestContext.authorizer.claims) {
    throw new Error('User is not authenticated');
  }
  
  const claims = event.requestContext.authorizer.claims;
  
  // Parse Cognito groups
  const groupsString = claims['cognito:groups'] || '[]';
  const groups = JSON.parse(groupsString.replace(/'/g, '"'));
  
  return {
    userId: claims.sub,
    email: claims.email,
    groups: groups,
    role: groups.includes(USER_ROLES.ADMIN) ? USER_ROLES.ADMIN : USER_ROLES.MEMBER
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
