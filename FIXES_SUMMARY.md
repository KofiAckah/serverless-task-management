# AWS Serverless Task Management - Fixes Summary

## ✅ All 6 Fixes Completed

### 1. DynamoDB GSI for Assignments Table
**File**: `infrastructure/terraform/modules/dynamodb/main.tf`

**Changes**:
- ✅ Renamed `userId` attribute to `assigneeId` for semantic clarity
- ✅ Replaced `UserIndex` GSI with `assignee-index` (hash_key: assigneeId, no range key)
- ✅ Replaced `TaskIndex` GSI with `task-index` (hash_key: taskId)
- ✅ Updated composite key from `taskId#userId` to `taskId#assigneeId`
- ✅ Both GSIs use `projection_type = "ALL"`

**Impact**: More semantic naming and simpler query patterns for assignments.

---

### 2. Lambda Environment Variables
**File**: `infrastructure/terraform/modules/lambda/main.tf`

**Changes**:
- ✅ Added `COGNITO_USER_POOL_ID` to tasks Lambda
- ✅ Added `AWS_REGION` to all Lambda functions (pre_signup, tasks, notifications)
- ✅ Added `COGNITO_USER_POOL_ID` to notifications Lambda
- ✅ Pre-signup Lambda only gets AWS_REGION (no circular dependency)

**Reason**: Cognito User Pool ID is needed for AdminGetUser and ListUsers API calls.

---

### 3. Lambda IAM Policy for Cognito
**File**: `infrastructure/terraform/modules/lambda/main.tf`

**Changes**:
- ✅ Created `aws_iam_role_policy.tasks_cognito` for tasks Lambda
- ✅ Created `aws_iam_role_policy.notifications_cognito` for notifications Lambda
- ✅ Both policies allow: `cognito-idp:AdminGetUser`, `cognito-idp:ListUsers`
- ✅ Resource: `var.cognito_user_pool_arn`
- ✅ Added to Lambda `depends_on` blocks

**Impact**: Lambda functions can now query Cognito for user details.

---

### 4. Cognito User Lookup Utility
**File**: `backend/src/utils/cognito.js` (NEW FILE)

**Functions**:
```javascript
getUserEmail(userId)        // Returns user's email from Cognito
getUserRole(userId)         // Returns user's role (admin/member)
getUsersByRole(role)        // Returns all users with specific role
```

**Features**:
- ✅ Uses AWS SDK v3 (`@aws-sdk/client-cognito-identity-provider`)
- ✅ Proper error handling with try-catch
- ✅ Handles UserNotFoundException gracefully
- ✅ Default role: 'member' if custom:role not found
- ✅ Filters out users without email addresses

---

### 5. SES Email Notifications
**File**: `backend/src/utils/ses.js`

**Changes**:
- ✅ Imported `getUserEmail` and `getUsersByRole` from cognito utility
- ✅ `sendTaskAssignmentEmail(assigneeId, task, assignedByEmail)` - Now accepts assigneeId, looks up email
- ✅ `sendTaskStatusUpdateEmail(assigneeIds[], task, oldStatus, newStatus)` - Sends to all assignees + all admins
- ✅ `sendTaskCompletionEmail(adminId, task, assignedUsersCount)` - Accepts adminId, looks up email
- ✅ All functions include error handling for missing emails
- ✅ Email deduplication in status update notifications

**File**: `backend/src/handlers/notifications.js`

**Changes**:
- ✅ Updated to use new SES function signatures with assigneeId
- ✅ Changed GSI name from 'TaskIndex' to 'task-index'
- ✅ Collects all assigneeIds and passes array to sendTaskStatusUpdateEmail

**File**: `backend/src/handlers/closeTask.js`

**Changes**:
- ✅ Updated to pass `user.userId` (adminId) instead of email
- ✅ Changed GSI name from 'TaskIndex' to 'task-index'

---

### 6. Terraform Variable Definitions
**File**: `infrastructure/terraform/modules/lambda/variable.tf`

**Changes**:
- ✅ Added `cognito_user_pool_id` (string)
- ✅ Added `cognito_user_pool_arn` (string)
- ✅ Added `aws_region` (string)

**File**: `infrastructure/terraform/main.tf`

**Changes**:
- ✅ Passed all new variables to lambda module

---

## 📦 Backend Handler Updates

Since we changed the DynamoDB schema from `userId` to `assigneeId`, the following handlers were also updated:

### `backend/src/handlers/assignTask.js`
- Changed API input from `{ taskId, userId, userEmail }` to `{ taskId, assigneeId }`
- No longer requires `userEmail` in request (looked up from Cognito)
- Updated composite key: `taskId#assigneeId`

### `backend/src/handlers/getTasks.js`
- Changed GSI query from 'UserIndex' to 'assignee-index'
- Updated query attribute from 'userId' to 'assigneeId'

### `backend/src/handlers/getAssignedTasks.js`
- Changed GSI query from 'UserIndex' to 'assignee-index'
- Updated query attribute from 'userId' to 'assigneeId'

---

## 📋 Post-Deployment Steps

### 1. Install New Dependencies
```bash
cd backend
npm install
```

This will install the new `@aws-sdk/client-cognito-identity-provider` package.

### 2. Deploy Infrastructure
```bash
cd infrastructure/terraform
terraform plan -var-file=dev.tfvars
terraform apply -var-file=dev.tfvars
```

⚠️ **WARNING**: The DynamoDB assignments table schema has changed. Terraform will likely need to replace the table, which will **delete existing assignment data**. If you have production data:
- Consider exporting existing assignments first
- Migrate userId → assigneeId
- Or use a blue-green deployment strategy

### 3. API Contract Changes

The **POST /tasks/{taskId}/assign** endpoint has changed:

**OLD Request**:
```json
{
  "taskId": "task-123",
  "userId": "user-sub-id",
  "userEmail": "user@example.com"
}
```

**NEW Request**:
```json
{
  "taskId": "task-123",
  "assigneeId": "user-sub-id"
}
```

The email is now automatically looked up from Cognito.

### 4. Testing Recommendations

1. **Test Cognito Integration**:
   - Verify Lambda functions can read user pool
   - Check CloudWatch logs for Cognito API calls
   - Ensure AdminGetUser permissions are working

2. **Test Email Notifications**:
   - Create a new assignment (tests Cognito email lookup)
   - Update task status (tests admin + assignee email collection)
   - Close a task (tests admin notification)

3. **Test GSI Queries**:
   - Query tasks by assignee (GET /tasks/assigned)
   - Admin view of all tasks with member filtering

---

## 🔍 Validation Results

- ✅ Terraform validation: **Success**
- ✅ No circular dependencies
- ✅ All Lambda functions have proper IAM policies
- ✅ Environment variables correctly configured
- ✅ Backend code uses AWS SDK v3 throughout
- ✅ Error handling implemented in all new code

---

## 🎯 Key Improvements

1. **Better Data Model**: `assigneeId` is more semantic than `userId` in assignments context
2. **Single Source of Truth**: Email addresses come from Cognito, not duplicated in DynamoDB
3. **Enhanced Notifications**: Status updates now notify both assignees AND all admins
4. **Simplified API**: Clients don't need to pass email addresses (reduces errors)
5. **Proper GSI Naming**: kebab-case names match AWS best practices
6. **Comprehensive IAM**: Lambda functions have precise Cognito permissions

---

## 📚 Architecture Notes

### Cognito Integration
- User emails are fetched on-demand from Cognito
- Reduces data duplication and keeps user info current
- AdminGetUser requires User Pool ID environment variable

### Email Notification Flow
1. Assignment created → DynamoDB Stream → Notifications Lambda
2. Notifications Lambda extracts assigneeId from stream
3. Cognito utility looks up user email
4. SES sends formatted email

### Status Update Notifications
- Collects all assigneeIds for a task via task-index GSI
- Fetches all admin users via ListUsers with role filter
- Combines and deduplicates email list
- Sends single email to all recipients

---

## ⚠️ Breaking Changes Summary

1. **DynamoDB Schema**: `userId` → `assigneeId` in assignments table
2. **Composite Keys**: `taskId#userId` → `taskId#assigneeId`
3. **GSI Names**: `UserIndex` → `assignee-index`, `TaskIndex` → `task-index`
4. **API Signature**: assignTask no longer requires `userEmail` parameter
5. **SES Functions**: Now accept user IDs instead of emails (internal change)

---

## 🚀 Next Steps

1. Run `npm install` in backend directory
2. Review Terraform plan carefully (table replacement!)
3. Deploy with `terraform apply`
4. Update any frontend/API clients to use new assignTask signature
5. Test all email notification scenarios
6. Monitor CloudWatch logs for Cognito API calls

---

**All fixes completed successfully!** ✅
