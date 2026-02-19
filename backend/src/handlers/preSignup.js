/**
 * Pre-Signup Lambda Trigger for Cognito
 * Validates email domain against allowed domains from assignment requirements
 */

exports.handler = async (event) => {
  console.log('Pre-Signup Trigger Event:', JSON.stringify(event, null, 2));
  
  try {
    // Get allowed domains from environment variable
    const allowedDomains = process.env.ALLOWED_EMAIL_DOMAINS.split(',');
    
    // Extract email from user attributes
    const email = event.request.userAttributes.email;
    
    if (!email) {
      throw new Error('Email is required for signup');
    }
    
    // Extract domain from email
    const domain = email.split('@')[1];
    
    // Validate domain against allowed list
    if (!allowedDomains.includes(domain)) {
      throw new Error(`Email domain '${domain}' is not allowed. Allowed domains: ${allowedDomains.join(', ')}`);
    }
    
    console.log(`Email domain '${domain}' validated successfully`);
    
    // Don't auto-confirm - let Cognito send verification email
    event.response.autoConfirmUser = false;
    event.response.autoVerifyEmail = false;
    
    return event;
  } catch (error) {
    console.error('Pre-signup validation error:', error);
    throw error;
  }
};
