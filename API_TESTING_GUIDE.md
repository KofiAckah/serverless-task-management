# 🧪 API Testing Guide

## 📋 Table of Contents
- [Quick Start](#quick-start)
- [Testing Methods](#testing-methods)
- [Authentication Setup](#authentication-setup)
- [Testing with Postman](#testing-with-postman)
- [Testing with curl](#testing-with-curl)
- [Testing with Browser](#testing-with-browser)
- [AWS Console Testing](#aws-console-testing)
- [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

### 1. Deploy Infrastructure

```bash
cd infrastructure/terraform
terraform apply -var-file=dev.tfvars
```

### 2. Get API Endpoint

```bash
terraform output api_gateway_url
# Example Output: https://abc123xyz.execute-api.eu-west-1.amazonaws.com/dev
```

### 3. Create Test Users

```bash
# Get Cognito User Pool ID
POOL_ID=$(terraform output -raw cognito_user_pool_id)

# Create Admin user
aws cognito-idp admin-create-user \
  --user-pool-id $POOL_ID \
  --username admin@amalitech.com \
  --user-attributes Name=email,Value=admin@amalitech.com Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --region eu-west-1

# Add to Admin group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $POOL_ID \
  --username admin@amalitech.com \
  --group-name Admin \
  --region eu-west-1

# Create Member user
aws cognito-idp admin-create-user \
  --user-pool-id $POOL_ID \
  --username member@amalitech.com \
  --user-attributes Name=email,Value=member@amalitech.com Name=email_verified,Value=true \
  --temporary-password "TempPass123!" \
  --region eu-west-1

# Add to Member group
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $POOL_ID \
  --username member@amalitech.com \
  --group-name Member \
  --region eu-west-1
```

---

## 🔐 Authentication Setup

### Get Cognito Client ID

```bash
CLIENT_ID=$(terraform output -raw cognito_user_pool_client_id)
echo $CLIENT_ID
```

### Get JWT Token (AWS CLI Method)

```bash
# Initial login (admin user)
aws cognito-idp admin-initiate-auth \
  --user-pool-id $POOL_ID \
  --client-id $CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=admin@amalitech.com,PASSWORD="TempPass123!" \
  --region eu-west-1

# If you need to set permanent password:
aws cognito-idp admin-set-user-password \
  --user-pool-id $POOL_ID \
  --username admin@amalitech.com \
  --password "SecurePass123!" \
  --permanent \
  --region eu-west-1

# Login with permanent password
aws cognito-idp admin-initiate-auth \
  --user-pool-id $POOL_ID \
  --client-id $CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=admin@amalitech.com,PASSWORD="SecurePass123!" \
  --region eu-west-1
```

**Save the `IdToken` from the response - you'll need it for API calls!**

---

## 📮 Testing with Postman

### Setup

1. **Download Postman**: https://www.postman.com/downloads/
2. **Import Environment Variables**

Create a new environment:
```json
{
  "API_URL": "https://your-api-gateway-url.amazonaws.com/dev",
  "ID_TOKEN": "your-jwt-token-here"
}
```

### Test Collection

#### 1. **Create Task** (Admin Only)

```
Method: POST
URL: {{API_URL}}/tasks
Headers:
  - Authorization: {{ID_TOKEN}}
  - Content-Type: application/json
Body (raw JSON):
{
  "title": "Implement User Authentication",
  "description": "Set up Cognito and JWT authentication",
  "priority": "HIGH",
  "dueDate": "2026-02-28"
}
```

**Expected Response (201):**
```json
{
  "message": "Task created successfully",
  "task": {
    "taskId": "uuid-here",
    "title": "Implement User Authentication",
    "description": "Set up Cognito and JWT authentication",
    "priority": "HIGH",
    "status": "OPEN",
    "createdAt": 1707494400000,
    "createdBy": "admin-user-id"
  }
}
```

#### 2. **Get All Tasks** (Admin)

```
Method: GET
URL: {{API_URL}}/tasks
Headers:
  - Authorization: {{ID_TOKEN}}
Query Parameters (optional):
  - status: OPEN
```

**Expected Response (200):**
```json
{
  "count": 5,
  "tasks": [
    {
      "taskId": "uuid-1",
      "title": "Task 1",
      "status": "OPEN",
      ...
    }
  ]
}
```

#### 3. **Update Task** (Admin Only)

```
Method: PUT
URL: {{API_URL}}/tasks/{{TASK_ID}}
Headers:
  - Authorization: {{ID_TOKEN}}
  - Content-Type: application/json
Body (raw JSON):
{
  "status": "IN_PROGRESS",
  "description": "Updated description"
}
```

#### 4. **Assign Task** (Admin Only)

```
Method: POST
URL: {{API_URL}}/tasks/{{TASK_ID}}/assign
Headers:
  - Authorization: {{ID_TOKEN}}
  - Content-Type: application/json
Body (raw JSON):
{
  "userId": "member-user-id",
  "userEmail": "member@amalitech.com"
}
```

**Expected Response (201):**
```json
{
  "message": "Task assigned successfully",
  "assignment": {
    "assignmentId": "taskId#userId",
    "taskId": "task-uuid",
    "userId": "member-id",
    "userEmail": "member@amalitech.com",
    "assignedAt": 1707494500000
  }
}
```

**📧 Email Notification:** Member receives assignment email via SES!

#### 5. **Close Task** (Admin Only)

```
Method: POST
URL: {{API_URL}}/tasks/{{TASK_ID}}/close
Headers:
  - Authorization: {{ID_TOKEN}}
  - Content-Type: application/json
Body (raw JSON):
{
  "closureNotes": "All requirements completed and tested"
}
```

#### 6. **Get Assigned Tasks** (Member Only)

```
Method: GET
URL: {{API_URL}}/tasks/assigned
Headers:
  - Authorization: {{MEMBER_ID_TOKEN}}
Query Parameters (optional):
  - status: IN_PROGRESS
```

**Expected Response (200):**
```json
{
  "message": "Tasks retrieved successfully",
  "user": {
    "userId": "member-id",
    "email": "member@amalitech.com"
  },
  "stats": {
    "total": 3,
    "byStatus": {
      "OPEN": 1,
      "IN_PROGRESS": 2
    },
    "byPriority": {
      "HIGH": 2,
      "MEDIUM": 1
    }
  },
  "count": 3,
  "tasks": [...]
}
```

---

## 💻 Testing with curl

### Set Environment Variables

```bash
export API_URL="https://your-api-id.execute-api.eu-west-1.amazonaws.com/dev"
export ID_TOKEN="your-jwt-token-here"
```

### 1. Create Task

```bash
curl -X POST "$API_URL/tasks" \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Deploy to Production",
    "description": "Final deployment after testing",
    "priority": "HIGH",
    "dueDate": "2026-03-01"
  }' | jq '.'
```

### 2. Get All Tasks

```bash
curl -X GET "$API_URL/tasks" \
  -H "Authorization: $ID_TOKEN" | jq '.'

# With status filter
curl -X GET "$API_URL/tasks?status=OPEN" \
  -H "Authorization: $ID_TOKEN" | jq '.'
```

### 3. Update Task

```bash
TASK_ID="your-task-id-here"

curl -X PUT "$API_URL/tasks/$TASK_ID" \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS",
    "description": "Work in progress"
  }' | jq '.'
```

### 4. Assign Task

```bash
curl -X POST "$API_URL/tasks/$TASK_ID/assign" \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "member-user-id",
    "userEmail": "member@amalitech.com"
  }' | jq '.'
```

### 5. Close Task

```bash
curl -X POST "$API_URL/tasks/$TASK_ID/close" \
  -H "Authorization: $ID_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "closureNotes": "Successfully completed"
  }' | jq '.'
```

### 6. Get Assigned Tasks (as Member)

```bash
export MEMBER_TOKEN="member-jwt-token-here"

curl -X GET "$API_URL/tasks/assigned" \
  -H "Authorization: $MEMBER_TOKEN" | jq '.'
```

---

## 🌐 Testing with Browser

### ⚠️ Limitation
**Browser can only test GET requests without authentication.**

For authenticated requests, you need:
- A frontend application (React, Vue, Angular)
- OR browser extension like "ModHeader" to add Authorization header
- OR use Postman/curl

### Simple Browser Tests (No Auth)

These endpoints require authentication, so browser testing is limited to:

1. **Test CORS (OPTIONS request)**
   - Open browser DevTools → Console
   ```javascript
   fetch('https://your-api-url/dev/tasks', {
     method: 'OPTIONS'
   }).then(r => console.log(r.headers.get('Access-Control-Allow-Origin')))
   ```

2. **Test API Endpoint Existence**
   ```javascript
   fetch('https://your-api-url/dev/tasks')
     .then(r => r.json())
     .then(console.log)
     .catch(console.error)
   ```
   
   **Expected:** 401 Unauthorized (because no auth token)

### With Browser Extension (ModHeader)

1. Install **ModHeader** extension
2. Add Request Header:
   - Name: `Authorization`
   - Value: `your-jwt-token`
3. Navigate to: `https://your-api-url/dev/tasks`
4. View JSON response in browser

### Best Practice for Browser Testing
**Build a simple frontend!** Create a React/Vue app with:
- Login page (Cognito authentication)
- Dashboard (displays tasks)
- Forms (create/update tasks)

---

## 🔧 AWS Console Testing

### Lambda Function Testing

1. **Go to Lambda Console**
2. **Select Function:** `task-management-dev-tasks`
3. **Configure Test Event:**

```json
{
  "httpMethod": "POST",
  "path": "/tasks",
  "headers": {
    "Authorization": "Bearer token-not-validated-in-lambda"
  },
  "body": "{\"title\":\"Test Task\",\"description\":\"Testing from console\",\"priority\":\"HIGH\"}",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "test-admin-id",
        "email": "admin@amalitech.com",
        "cognito:groups": "[\"Admin\"]"
      }
    }
  }
}
```

4. **Click "Test"** button
5. **View Logs** in CloudWatch

### API Gateway Testing

1. **Go to API Gateway Console**
2. **Select API:** `task-management-dev-api`
3. **Click "Resources"**
4. **Select a Method** (e.g., GET /tasks)
5. **Click "Test" tab**
6. **Add Headers:**
   - `Authorization`: `your-jwt-token`
7. **Click "Test" button**

### DynamoDB Data Verification

```bash
# View tasks
aws dynamodb scan \
  --table-name tasks-dev \
  --region eu-west-1

# View assignments
aws dynamodb scan \
  --table-name assignments-dev \
  --region eu-west-1
```

### CloudWatch Logs

```bash
# View Lambda logs
aws logs tail /aws/lambda/task-management-dev-tasks --follow

# View API Gateway logs
aws logs tail /aws/api-gateway/task-management-dev --follow
```

---

## 🐛 Troubleshooting

### Issue: 401 Unauthorized

**Problem:** API returns "Unauthorized"

**Solutions:**
1. Verify JWT token is valid:
   ```bash
   # Decode token (first part after first dot)
   echo "your-jwt-token" | cut -d'.' -f2 | base64 -d | jq '.'
   ```
2. Check token expiration (JWT expires after 1 hour by default)
3. Regenerate token if expired
4. Ensure Authorization header format: `Authorization: token` (no "Bearer" prefix for Cognito)

### Issue: 403 Forbidden

**Problem:** "Only Admin users have permissions"

**Solutions:**
1. Verify user is in correct Cognito group:
   ```bash
   aws cognito-idp admin-list-groups-for-user \
     --user-pool-id $POOL_ID \
     --username admin@amalitech.com \
     --region eu-west-1
   ```
2. Check JWT token contains correct groups:
   ```bash
   echo "$ID_TOKEN" | cut -d'.' -f2 | base64 -d | jq '.["cognito:groups"]'
   ```

### Issue: 404 Not Found

**Problem:** "Route not found"

**Solutions:**
1. Verify API endpoint URL:
   ```bash
   terraform output api_gateway_url
   ```
2. Check available routes:
   ```bash
   curl "$API_URL/invalid-route" | jq '.availableRoutes'
   ```
3. Verify router.js is deployed:
   ```bash
   aws lambda get-function-configuration \
     --function-name task-management-dev-tasks \
     --query 'Handler' \
     --output text
   # Should output: src/router.handler
   ```

### Issue: 500 Internal Server Error

**Problem:** Lambda execution error

**Solutions:**
1. Check CloudWatch logs:
   ```bash
   aws logs tail /aws/lambda/task-management-dev-tasks --follow
   ```
2. Verify environment variables are set:
   ```bash
   aws lambda get-function-configuration \
     --function-name task-management-dev-tasks \
     --query 'Environment'
   ```
3. Verify DynamoDB tables exist:
   ```bash
   aws dynamodb describe-table --table-name tasks-dev
   aws dynamodb describe-table --table-name assignments-dev
   ```

### Issue: CORS Error

**Problem:** "No 'Access-Control-Allow-Origin' header"

**Solutions:**
1. Verify OPTIONS methods are deployed
2. Check API Gateway CORS configuration
3. Test CORS manually:
   ```bash
   curl -X OPTIONS "$API_URL/tasks" -H "Origin: http://localhost:3000" -v
   ```

### Issue: Email Not Received

**Problem:** Assignment/notification emails not arriving

**Solutions:**
1. Verify SES email is verified:
   ```bash
   aws ses list-verified-email-addresses --region eu-west-1
   ```
2. Check if SES is in sandbox mode (can only send to verified emails)
3. View CloudWatch logs for SES errors:
   ```bash
   aws logs tail /aws/lambda/task-management-dev-notifications --follow
   ```
4. Verify DynamoDB Streams are enabled and connected

---

## 📊 Testing Checklist

### Pre-Testing
- [ ] Infrastructure deployed (`terraform apply`)
- [ ] API Gateway URL retrieved
- [ ] Cognito users created (Admin & Member)
- [ ] Users added to correct groups
- [ ] JWT tokens obtained for both users
- [ ] SES email verified

### Admin Tests
- [ ] ✅ POST /tasks - Create task
- [ ] ✅ GET /tasks - View all tasks
- [ ] ✅ PUT /tasks/{id} - Update task
- [ ] ✅ POST /tasks/{id}/assign - Assign task to member
- [ ] ✅ POST /tasks/{id}/close - Close task
- [ ] ✅ Verify assignment email sent to member

### Member Tests
- [ ] ✅ GET /tasks/assigned - View assigned tasks only
- [ ] ❌ POST /tasks - Should fail (403 Forbidden)
- [ ] ❌ PUT /tasks/{id} - Should fail (403 Forbidden)
- [ ] ❌ POST /tasks/{id}/assign - Should fail (403 Forbidden)

### Email Notifications
- [ ] ✅ Assignment email received by member
- [ ] ✅ Status update email received by member
- [ ] ✅ Completion email received by admin

### Error Scenarios
- [ ] ✅ No auth token → 401 Unauthorized
- [ ] ✅ Invalid route → 404 Not Found
- [ ] ✅ Member tries admin action → 403 Forbidden
- [ ] ✅ Invalid task ID → 404 Not Found
- [ ] ✅ Duplicate assignment → 409 Conflict

---

## 🎯 Quick Test Script

Save as `test-api.sh`:

```bash
#!/bin/bash

# Configuration
export API_URL=$(cd infrastructure/terraform && terraform output -raw api_gateway_url)
export POOL_ID=$(cd infrastructure/terraform && terraform output -raw cognito_user_pool_id)
export CLIENT_ID=$(cd infrastructure/terraform && terraform output -raw cognito_user_pool_client_id)

# Get Admin token
echo "🔐 Getting Admin token..."
ADMIN_AUTH=$(aws cognito-idp admin-initiate-auth \
  --user-pool-id $POOL_ID \
  --client-id $CLIENT_ID \
  --auth-flow ADMIN_NO_SRP_AUTH \
  --auth-parameters USERNAME=admin@amalitech.com,PASSWORD="SecurePass123!" \
  --region eu-west-1)

export ADMIN_TOKEN=$(echo $ADMIN_AUTH | jq -r '.AuthenticationResult.IdToken')

echo "✅ Admin token obtained"

# Test 1: Create Task
echo ""
echo "📝 Test 1: Creating task..."
CREATE_RESPONSE=$(curl -s -X POST "$API_URL/tasks" \
  -H "Authorization: $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Automated Test Task",
    "description": "Created by test script",
    "priority": "HIGH"
  }')

echo "$CREATE_RESPONSE" | jq '.'
TASK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.task.taskId')
echo "✅ Task created: $TASK_ID"

# Test 2: Get Tasks
echo ""
echo "📋 Test 2: Getting all tasks..."
curl -s -X GET "$API_URL/tasks" \
  -H "Authorization: $ADMIN_TOKEN" | jq '.count, .tasks[0].title'

echo "✅ Tasks retrieved"

# Test 3: Update Task
echo ""
echo "✏️  Test 3: Updating task..."
curl -s -X PUT "$API_URL/tasks/$TASK_ID" \
  -H "Authorization: $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS"
  }' | jq '.message'

echo "✅ Task updated"

echo ""
echo "🎉 All tests completed!"
```

Make executable and run:
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## 🎓 Recommendations

### For Development
**Use:** Postman or curl
- Easiest to test individual endpoints
- Can save requests for reuse
- Built-in authentication management

### For Automated Testing
**Use:** Jest + Axios or Postman Collections
- Create test suites
- Run tests in CI/CD pipeline
- Verify all scenarios automatically

### For End-to-End Testing
**Use:** Frontend Application
- Build React/Vue/Angular app
- Integrate AWS Amplify for authentication
- Test complete user workflows

### Best Testing Tool
**Recommendation: Postman**
1. ✅ Easy to use
2. ✅ Save and organize requests
3. ✅ Environment management
4. ✅ Can generate code (curl, Python, etc.)
5. ✅ Team collaboration features
6. ✅ Automated testing support

---

## 📚 Additional Resources

- [Postman Documentation](https://learning.postman.com/docs/)
- [AWS API Gateway Testing](https://docs.aws.amazon.com/apigateway/latest/developerguide/how-to-test-method.html)
- [Cognito JWT Tokens](https://docs.aws.amazon.com/cognito/latest/developerguide/amazon-cognito-user-pools-using-tokens-with-identity-providers.html)
- [curl Documentation](https://curl.se/docs/)

---

**🎉 Happy Testing!** 🚀
