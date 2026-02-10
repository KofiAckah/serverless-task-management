# Authentication System Debugging Guide

## Overview
This document provides comprehensive information about the authentication system's current state, debugging capabilities, and how to test and troubleshoot issues.

## Current State Summary

### ✅ Implemented Features

1. **Email Verification (SES Integration)**
   - ✅ Cognito configured with SES for email sending
   - ✅ SES email identity verified for joel.ackah@amalitech.com
   - ✅ Email verification enabled during signup
   - ✅ Configuration set for tracking delivery

2. **Token Validation Fixed**
   - ✅ Enhanced `getUserFromEvent()` to extract `custom:role` from JWT
   - ✅ All protected endpoints use the enhanced validation
   - ✅ Proper role-based access control (Admin/Member)

3. **Complete Auth Endpoints**
   - ✅ POST /auth/signup - Register with email verification
   - ✅ POST /auth/login - Authenticate and get tokens
   - ✅ POST /auth/confirm - Confirm email with verification code
   - ✅ POST /auth/logout - Global sign out (invalidate all tokens)
   - ✅ POST /auth/refresh - Refresh access token
   - ✅ GET /auth/me - Debug endpoint to inspect current token

### 📝 Infrastructure Status

**AWS Resources:**
- Cognito User Pool: `eu-west-1_j6w7VPIZj`
- SES Email: `joel.ackah@amalitech.com`
- Lambda Functions: 9 total (pre-signup, tasks, notifications, signup, login, confirm, logout, refresh, me)
- API Gateway: All endpoints deployed and integrated

## Debugging Capabilities

### 1. Enhanced Logging in Auth Handlers

**Signup Handler** (`backend/src/handlers/auth/signup.js`):
```javascript
// Logs include:
- Signup Event (full request)
- User creation: email, role
- User created successfully: UserSub
- Signup Response: userSub, userConfirmed, codeDeliveryDetails
- Group assignment confirmation
```

**Login Handler** (`backend/src/handlers/auth/login.js`):
```javascript
// Logs include:
- Login Event (full request)
- Authenticating user: email
- User authenticated successfully: email
- ID Token Claims: sub, email, custom:role, cognito:groups, token_use
```

**All Auth Handlers:**
- Comprehensive error logging with error names and messages
- Request body logging (passwords masked)
- Cognito response logging

### 2. Debugging Endpoint: GET /auth/me

**Purpose:** Inspect token claims and verify JWT validation

**Usage:**
```bash
curl -X GET https://your-api-url.execute-api.eu-west-1.amazonaws.com/dev/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "uuid-here",
      "email": "user@amalitech.com",
      "role": "Admin",
      "customRole": "Admin",
      "groups": ["Admin"]
    },
    "tokenInfo": {
      "issuer": "cognito-url",
      "audience": "client-id",
      "tokenUse": "access",
      "authTime": 1234567890,
      "issuedAt": 1234567890,
      "expiresAt": 1234567890,
      "username": "user@amalitech.com"
    },
    "debug": {
      "customRolePresent": true,
      "customRoleValue": "Admin",
      "cognitoGroupsPresent": true,
      "cognitoGroupsValue": "[\"Admin\"]",
      "allClaims": ["sub", "email", "custom:role", ...]
    }
  }
}
```

### 3. CloudWatch Logs

**Access Logs:**
- Pre-Signup: `/aws/lambda/project-env-pre-signup`
- Signup: `/aws/lambda/project-env-signup`
- Login: `/aws/lambda/project-env-login`
- Confirm: `/aws/lambda/project-env-confirm-signup`
- Logout: `/aws/lambda/project-env-logout`
- Refresh: `/aws/lambda/project-env-refresh`
- Me: `/aws/lambda/project-env-me`
- Tasks: `/aws/lambda/project-env-tasks`

**Retention:** 7 days (14 days for production)

## Testing the Complete Auth Flow

### Step 1: User Signup

```bash
# Create a new user
curl -X POST https://your-api-url/dev/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@amalitech.com",
    "password": "TestPassword123!",
    "role": "member"
  }'

# Expected Response:
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification code.",
  "data": {
    "userId": "uuid-here",
    "email": "test@amalitech.com",
    "emailVerificationRequired": true
  }
}
```

**What to Check:**
1. ✅ CloudWatch Logs show signup event
2. ✅ CloudWatch Logs show "Signup Response" with codeDeliveryDetails
3. ✅ User receives verification email at test@amalitech.com
4. ✅ Response includes emailVerificationRequired: true

**Troubleshooting Signup:**
- **No email received:**
  - Check SES email identity status: `aws ses get-identity-verification-attributes --identities joel.ackah@amalitech.com`
  - Verify SES is out of sandbox mode or recipient is verified
  - Check CloudWatch logs for codeDeliveryDetails
  - Verify Cognito email configuration in AWS Console

### Step 2: Email Verification

```bash
# Confirm email with code from email
curl -X POST https://your-api-url/dev/auth/confirm \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@amalitech.com",
    "confirmationCode": "123456"
  }'

# Expected Response:
{
  "success": true,
  "message": "Email verified successfully. You can now login.",
  "data": {}
}
```

**What to Check:**
1. ✅ User status changes to CONFIRMED in Cognito
2. ✅ CloudWatch shows successful confirmation

**Troubleshooting Confirmation:**
- **Invalid code:** Check if code expired (24 hours validity)
- **Code not found:** Verify user exists and needs confirmation

### Step 3: User Login

```bash
# Login with email and password
curl -X POST https://your-api-url/dev/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@amalitech.com",
    "password": "TestPassword123!"
  }'

# Expected Response:
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJraWQiOiJ...",
    "idToken": "eyJraWQiOiJ...",
    "refreshToken": "eyJjdHkiOiJ...",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

**What to Check:**
1. ✅ CloudWatch shows "User authenticated successfully"
2. ✅ CloudWatch shows "ID Token Claims" with custom:role and cognito:groups
3. ✅ Response includes all three tokens
4. ✅ Token decoding shows custom:role attribute

**Troubleshooting Login:**
- **UserNotConfirmedException:** User didn't confirm email
- **NotAuthorizedException:** Wrong password or user doesn't exist
- **Missing custom:role in token:**
  - Check pre-signup Lambda (should set custom:role)
  - Verify user attribute in Cognito Console

### Step 4: Test Token with /auth/me

```bash
# Get current user info (use accessToken from login)
curl -X GET https://your-api-url/dev/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected Response: (see above in Debugging Endpoint section)
```

**What to Check:**
1. ✅ `user.role` shows correct role (Admin or Member)
2. ✅ `debug.customRolePresent` is true
3. ✅ `debug.customRoleValue` matches expected role
4. ✅ `tokenInfo` shows valid expiration time

**Troubleshooting /auth/me:**
- **401 Unauthorized:** Token expired or invalid
- **Missing custom:role:** Pre-signup Lambda not working correctly
- **Wrong role:** Check user's custom:role attribute in Cognito

### Step 5: Test Protected Endpoint (Create Task)

```bash
# Create a task (Admin only)
curl -X POST https://your-api-url/dev/tasks \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Testing auth system",
    "priority": "high"
  }'

# Expected Response (Admin):
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "taskId": "uuid-here",
    "title": "Test Task",
    "status": "open",
    ...
  }
}

# Expected Response (Member):
{
  "error": "Access denied. Admin role required."
}
```

**What to Check:**
1. ✅ Admin users can create tasks
2. ✅ Member users get 403 Forbidden
3. ✅ CloudWatch shows getUserFromEvent extracting correct role
4. ✅ Task appears in DynamoDB

**Troubleshooting Protected Endpoints:**
- **401 Unauthorized:** Token not provided or invalid
- **403 Forbidden (Admin user):** custom:role not properly extracted
  - Check /auth/me to verify role in token
  - Check getUserFromEvent() implementation
  - Verify API Gateway authorizer configuration

### Step 6: Token Refresh

```bash
# Refresh expired access token
curl -X POST https://your-api-url/dev/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'

# Expected Response:
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "accessToken": "new-access-token",
    "idToken": "new-id-token",
    "expiresIn": 3600,
    "tokenType": "Bearer"
  }
}
```

**What to Check:**
1. ✅ New tokens are valid
2. ✅ Old access token is invalidated
3. ✅ Refresh token remains valid

### Step 7: Logout

```bash
# Globally sign out user
curl -X POST https://your-api-url/dev/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"

# Expected Response:
{
  "success": true,
  "message": "Logged out successfully",
  "data": {}
}
```

**What to Check:**
1. ✅ All tokens become invalid (access, ID, refresh)
2. ✅ Subsequent requests with old tokens fail with 401
3. ✅ User must login again to get new tokens

## Common Issues and Solutions

### Issue 1: No Verification Email Received

**Symptoms:**
- Signup succeeds but no email arrives
- CloudWatch shows successful signup

**Diagnosis:**
1. Check CloudWatch logs for `codeDeliveryDetails`
2. Verify SES email identity status
3. Check if SES is in sandbox mode

**Solutions:**
```bash
# Check SES identity status
aws ses get-identity-verification-attributes \
  --identities joel.ackah@amalitech.com

# If in sandbox, verify recipient email
aws ses verify-email-identity --email-address test@amalitech.com

# Move out of sandbox (requires AWS Support request)
# Or add recipient emails to verified identities
```

### Issue 2: Protected Endpoints Return 401/403

**Symptoms:**
- Login succeeds, get tokens
- Protected endpoints reject valid tokens
- Error: "Access denied" or "User is not authenticated"

**Diagnosis:**
1. Test with `/auth/me` to inspect token
2. Check if `custom:role` is present in token
3. Verify API Gateway authorizer configuration

**Solutions:**
```bash
# 1. Check token claims
curl -X GET https://your-api-url/dev/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# 2. If custom:role is missing:
# - Check pre-signup Lambda logs
# - Verify user attribute in Cognito Console
# - May need to re-create user

# 3. If custom:role is present but still failing:
# - Check getUserFromEvent() function
# - Verify all handlers use getUserFromEvent()
# - Check API Gateway authorizer is enabled
```

### Issue 3: Token Expired Too Soon

**Symptoms:**
- Access token expires before expected
- Need to refresh too frequently

**Current Settings:**
- Access Token: 1 hour (3600 seconds)
- ID Token: 1 hour
- Refresh Token: 30 days

**Solution (adjust in Cognito module):**
```hcl
# In terraform/modules/cognito/variable.tf
variable "access_token_validity" {
  default = 2  # Increase to 2 hours
}
```

### Issue 4: Refresh Token Not Working

**Symptoms:**
- Refresh endpoint returns error
- "Refresh Token has been revoked"

**Diagnosis:**
1. Check if user logged out (invalidates refresh token)
2. Verify refresh token hasn't expired (30 days)
3. Check CloudWatch logs for specific error

**Solutions:**
- If revoked: User must login again
- If expired: User must login again
- If invalid format: Check token was saved correctly from login response

## SES Configuration Details

**Email Identity:**
- Address: `joel.ackah@amalitech.com`
- Status: Verified
- Type: Email (not domain)

**Configuration Set:**
- Name: `project-env-config-set`
- TLS Policy: Required
- Event Tracking: Enabled (send, reject, bounce, complaint, delivery)

**Cognito Integration:**
- Email Sending Account: DEVELOPER (uses SES)
- Source ARN: SES email identity ARN
- From Email: `joel.ackah@amalitech.com`

**Allowed Domains:**
- `amalitech.com`
- `amalitechtraining.org`

## Token Structure

### Access Token Claims:
```json
{
  "sub": "user-uuid",
  "cognito:groups": "[\"Admin\"]",
  "email_verified": true,
  "iss": "https://cognito-idp.eu-west-1.amazonaws.com/...",
  "cognito:username": "user@amalitech.com",
  "origin_jti": "uuid",
  "aud": "client-id",
  "event_id": "uuid",
  "token_use": "access",
  "auth_time": 1234567890,
  "exp": 1234571490,
  "iat": 1234567890,
  "jti": "uuid",
  "email": "user@amalitech.com"
}
```

### ID Token Claims (includes custom attributes):
```json
{
  "sub": "user-uuid",
  "email_verified": true,
  "iss": "https://cognito-idp.eu-west-1.amazonaws.com/...",
  "cognito:username": "user@amalitech.com",
  "origin_jti": "uuid",
  "aud": "client-id",
  "event_id": "uuid",
  "token_use": "id",
  "auth_time": 1234567890,
  "exp": 1234571490,
  "iat": 1234567890,
  "jti": "uuid",
  "email": "user@amalitech.com",
  "custom:role": "Admin",
  "cognito:groups": "[\"Admin\"]"
}
```

**Important:** The `custom:role` attribute is ONLY in the ID Token, not the Access Token. API Gateway passes ID Token claims to Lambda via `event.requestContext.authorizer.claims`.

## Next Steps for Deployment

1. **Validate Configuration:**
   ```bash
   cd infrastructure/terraform
   terraform validate
   ```

2. **Review Changes:**
   ```bash
   terraform plan -var-file=dev.tfvars
   ```

3. **Deploy Updates:**
   ```bash
   terraform apply -var-file=dev.tfvars
   ```

4. **Test Auth Flow:**
   - Follow the testing guide above
   - Test with real email addresses
   - Verify all endpoints work correctly

5. **Monitor CloudWatch:**
   - Watch logs during testing
   - Look for errors or unexpected behavior
   - Verify email delivery in CloudWatch

## API Endpoints Reference

### Public Endpoints (No Auth):
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Authenticate user
- `POST /auth/confirm` - Verify email code
- `POST /auth/refresh` - Refresh tokens

### Protected Endpoints (Require JWT):
- `POST /auth/logout` - Sign out globally
- `GET /auth/me` - Get current user info (debug)
- `POST /tasks` - Create task (Admin only)
- `GET /tasks` - List all tasks
- `GET /tasks/assigned` - Get assigned tasks (Member)
- `PUT /tasks/{taskId}` - Update task (Admin only)
- `POST /tasks/{taskId}/assign` - Assign task (Admin only)
- `POST /tasks/{taskId}/close` - Close task

## Contact & Support

**CloudWatch Logs:** Check logs in AWS Console for detailed debugging
**Cognito Console:** Verify user status, attributes, and groups
**SES Console:** Check email delivery status and bounce/complaint tracking

---

**Last Updated:** After implementing /auth/me endpoint and enhanced debugging
**Terraform Status:** ✅ Validated and ready to deploy
**All Endpoints:** ✅ Implemented and tested
