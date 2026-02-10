# Authentication Endpoints - Testing Guide

## 📋 Overview

Your serverless task management system now has **3 new public authentication endpoints**:

| Endpoint | Method | Description | Authorization |
|----------|--------|-------------|---------------|
| `/auth/signup` | POST | Register new user | None (Public) |
| `/auth/login` | POST | Login user | None (Public) |
| `/auth/confirm` | POST | Confirm email | None (Public) |

---

## 🚀 Deployment Instructions

### 1. Deploy Infrastructure

```bash
cd infrastructure/terraform
terraform plan
terraform apply
```

**Expected Resources:**
- ✅ 3 new Lambda functions (signup, login, confirm-signup)
- ✅ 3 new API Gateway resources (/auth/signup, /auth/login, /auth/confirm)
- ✅ 6 new methods (3 POST + 3 OPTIONS for CORS)
- ✅ 3 new Lambda permissions
- ✅ Updated Cognito configuration (USER_PASSWORD_AUTH enabled)

### 2. Get API Gateway URL

```bash
terraform output api_gateway_url
```

---

## 🧪 Testing the Endpoints

### 1. User Signup

**Endpoint:** `POST /auth/signup`

**Request Body:**
```json
{
  "email": "john.doe@amalitech.com",
  "password": "SecurePass123!",
  "role": "member"
}
```

**Response (201):**
```json
{
  "message": "User registered successfully. Please check your email for verification code.",
  "userId": "abc-123-def-456",
  "email": "john.doe@amalitech.com",
  "role": "member",
  "userConfirmed": false
}
```

**cURL Example:**
```bash
API_URL="https://your-api-id.execute-api.eu-west-1.amazonaws.com/dev"

curl -X POST "${API_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@amalitech.com",
    "password": "SecurePass123!",
    "role": "member"
  }'
```

**Validation Rules:**
- ✅ Email must be `@amalitech.com` or `@amalitechtraining.org`
- ✅ Password: min 8 chars, uppercase, lowercase, numbers, symbols
- ✅ Role: `admin` or `member` (defaults to `member`)

---

### 2. Email Confirmation

**Endpoint:** `POST /auth/confirm`

**Request Body:**
```json
{
  "email": "john.doe@amalitech.com",
  "code": "123456"
}
```

**Response (200):**
```json
{
  "message": "Email verified successfully. You can now log in.",
  "email": "john.doe@amalitech.com"
}
```

**cURL Example:**
```bash
curl -X POST "${API_URL}/auth/confirm" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@amalitech.com",
    "code": "123456"
  }'
```

**Notes:**
- 📧 Verification code sent to email after signup
- ⏱️ Code expires after a period (default: 24 hours)
- 🔄 Can resend code via Cognito if needed

---

### 3. User Login

**Endpoint:** `POST /auth/login`

**Request Body:**
```json
{
  "email": "john.doe@amalitech.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "message": "Login successful",
  "accessToken": "eyJraWQiOiJ...",
  "idToken": "eyJraWQiOiJZ...",
  "refreshToken": "eyJjdHkiOiJ...",
  "expiresIn": 3600,
  "tokenType": "Bearer"
}
```

**cURL Example:**
```bash
curl -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@amalitech.com",
    "password": "SecurePass123!"
  }'
```

**Important:**
- 🔐 Use `idToken` for API Gateway authorization
- 📝 Store tokens securely (not in localStorage for production)
- ⏱️ Access token expires in 1 hour
- 🔄 Use `refreshToken` to get new access token

---

### 4. Using Authentication with Task Endpoints

After login, use the `idToken` to access protected endpoints:

```bash
# Save the token
ID_TOKEN="eyJraWQiOiJZ..."

# Create a task (Admin only)
curl -X POST "${API_URL}/tasks" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${ID_TOKEN}" \
  -d '{
    "title": "Complete project",
    "description": "Finish the serverless setup",
    "priority": "HIGH"
  }'

# Get all tasks
curl -X GET "${API_URL}/tasks" \
  -H "Authorization: Bearer ${ID_TOKEN}"
```

---

## 🔍 Complete Endpoint List

### Public Endpoints (No Authorization)
```
POST   /auth/signup      - Register new user
POST   /auth/login       - Login user
POST   /auth/confirm     - Confirm email
```

### Protected Endpoints (Require JWT Token)
```
POST   /tasks                     - Create task (Admin)
GET    /tasks                     - List tasks
GET    /tasks/assigned            - Get assigned tasks (Member)
PUT    /tasks/{taskId}            - Update task (Admin)
POST   /tasks/{taskId}/assign     - Assign task (Admin)
POST   /tasks/{taskId}/close      - Close task (Admin)
```

---

## 🛠️ Error Handling

### Signup Errors

**409 Conflict - User Exists:**
```json
{
  "error": "User with this email already exists"
}
```

**400 Bad Request - Invalid Password:**
```json
{
  "error": "Password does not meet requirements",
  "requirements": "Password must be at least 8 characters with uppercase, lowercase, numbers, and symbols"
}
```

**400 Bad Request - Invalid Email Domain:**
```json
{
  "error": "Email domain not allowed. Must be one of: amalitech.com, amalitechtraining.org"
}
```

### Login Errors

**401 Unauthorized:**
```json
{
  "error": "Incorrect email or password"
}
```

**403 Forbidden - Not Confirmed:**
```json
{
  "error": "User not confirmed. Please verify your email with the confirmation code."
}
```

### Confirm Errors

**400 Bad Request - Code Mismatch:**
```json
{
  "error": "Invalid confirmation code. Please check and try again."
}
```

**400 Bad Request - Code Expired:**
```json
{
  "error": "Confirmation code has expired. Please request a new code."
}
```

---

## 🧩 Backend Code Structure

### New Files Created

```
backend/src/
├── handlers/
│   └── auth/
│       ├── signup.js          ✨ New - User registration
│       ├── login.js           ✨ New - User authentication
│       └── confirmSignup.js   ✨ New - Email verification
└── utils/
    └── response.js            ✨ New - Response helpers
```

### Terraform Changes

```
infrastructure/terraform/modules/
├── lambda/
│   ├── main.tf         ✅ Added 3 auth Lambda functions
│   ├── output.tf       ✅ Added auth Lambda outputs
│   └── variable.tf     ✅ Added cognito_client_id variable
├── api-gateway/
│   ├── main.tf         ✅ Added /auth endpoints + permissions
│   └── variable.tf     ✅ Added auth Lambda variables
└── cognito/
    └── main.tf         ✅ USER_PASSWORD_AUTH already enabled
```

---

## 🔐 Security Features

### Built-in Security

- ✅ **Email domain validation** - Only @amalitech.com and @amalitechtraining.org
- ✅ **Password policy** - Min 8 chars, uppercase, lowercase, numbers, symbols
- ✅ **Email verification** - Must confirm email before login
- ✅ **Token-based auth** - JWT tokens with expiration
- ✅ **Rate limiting** - Cognito built-in protection
- ✅ **CORS enabled** - Proper CORS headers on all endpoints
- ✅ **Group-based access** - Automatic assignment to Admin/Member groups

### Token Information

- **Access Token:** Short-lived (1 hour), used for API calls
- **ID Token:** Contains user claims, used for authorization
- **Refresh Token:** Long-lived (30 days), used to get new tokens

---

## 📊 Testing Workflow

### Complete User Journey

```bash
# 1. Register
curl -X POST "${API_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@amalitech.com","password":"Test123!","role":"member"}'

# 2. Check email for code (or check CloudWatch logs in dev)

# 3. Confirm
curl -X POST "${API_URL}/auth/confirm" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@amalitech.com","code":"123456"}'

# 4. Login
curl -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@amalitech.com","password":"Test123!"}'

# 5. Use token to access tasks
curl -X GET "${API_URL}/tasks" \
  -H "Authorization: Bearer eyJraWQ..."
```

---

## 🎯 Next Steps

1. ✅ **Deploy the changes:** `terraform apply`
2. ✅ **Test signup flow:** Register a test user
3. ✅ **Verify email:** Use confirmation code
4. ✅ **Test login:** Authenticate user
5. ✅ **Test protected endpoints:** Use JWT token
6. 🔜 **Build frontend:** Integrate auth UI
7. 🔜 **Add refresh token flow:** Handle token expiration
8. 🔜 **Add forgot password:** Additional Cognito endpoints

---

## 💡 Pro Tips

### Development Testing

For development, you can check Cognito verification codes in:
- AWS Console → Cognito User Pools → Users
- CloudWatch Logs (if SES sandbox mode)
- Email inbox (if email verified in SES)

### Production Considerations

- Use AWS Secrets Manager for sensitive config
- Enable MFA for admin accounts
- Set up custom email templates in Cognito
- Configure proper CORS origins (not *)
- Enable CloudWatch alarms for failed logins
- Set up AWS WAF for API Gateway

---

## 📞 Support

For issues or questions:
1. Check CloudWatch Logs: `/aws/lambda/{function-name}`
2. Verify Cognito User Pool settings
3. Test with API Gateway console
4. Review IAM permissions

---

**Status:** ✅ Complete and ready for deployment!
