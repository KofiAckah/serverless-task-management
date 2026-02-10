const { HTTP_STATUS, CORS_HEADERS } = require('../shared/constants');

/**
 * Create a successful API response
 * @param {number} statusCode - HTTP status code (default 200)
 * @param {object} data - Response data
 * @param {string} message - Optional success message
 * @returns {object} API Gateway response object
 */
function createSuccessResponse(statusCode = HTTP_STATUS.OK, data = {}, message = null) {
  const body = message ? { message, ...data } : data;
  
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify(body)
  };
}

/**
 * Create an error API response
 * @param {number} statusCode - HTTP status code
 * @param {string} error - Error message
 * @param {object} details - Optional error details
 * @returns {object} API Gateway response object
 */
function createErrorResponse(statusCode, error, details = {}) {
  return {
    statusCode,
    headers: CORS_HEADERS,
    body: JSON.stringify({
      error,
      ...details
    })
  };
}

module.exports = {
  createSuccessResponse,
  createErrorResponse
};
