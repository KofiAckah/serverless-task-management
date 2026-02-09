# 🚀 Deployment Checklist - AWS Serverless Task Management

## ✅ Pre-Deployment Verification (COMPLETED)

- [x] Terraform validation successful
- [x] Backend code validation successful (all 8 handlers + 4 utilities)
- [x] NPM dependencies installed (@aws-sdk/client-cognito-identity-provider added)
- [x] No syntax errors
- [x] All exports verified

## 📋 Deployment Steps

### Step 1: Review Infrastructure Changes
```bash
cd infrastructure/terraform
terraform plan -var-file=dev.tfvars
```

**Expected Changes:**
- **DynamoDB assignments table**: REPLACE (schema change)
  - Old attributes: assignmentId, taskId, userId
  - New attributes: assignmentId, taskId, assigneeId
  - Old GSIs: TaskIndex, UserIndex
  - New GSIs: task-index, assignee-index

- **Lambda Functions**: UPDATE (3 functions)
  - New environment variables (COGNITO_USER_POOL_ID, AWS_REGION)
  - New IAM policies (Cognito permissions)
  - Updated source code

- **Lambda IAM Roles**: UPDATE
  - New Cognito policies attached

⚠️ **WARNING**: DynamoDB table replacement will **DELETE ALL ASSIGNMENT DATA**

### Step 2: Backup Production Data (if applicable)
If you have production data in the assignments table, export it first:

```bash
# Export existing assignments
aws dynamodb scan \
  --table-name task-mgmt-dev-assignments \
  --region eu-west-1 > assignments_backup.json

# After deployment, you can transform and reimport with assigneeId field
```

### Step 3: Deploy Infrastructure
```bash
terraform apply -var-file=dev.tfvars
```

Type `yes` when prompted.

**Deployment Time:** ~2-3 minutes
- Creates new DynamoDB assignments table
- Updates Lambda functions with new code
- Attaches new IAM policies

### Step 4: Verify Deployment
```bash
# Check Lambda environment variables
aws lambda get-function-configuration \
  --function-name task-mgmt-dev-tasks \
  --region eu-west-1 \
  --query 'Environment.Variables'

# Expected output should include:
# - COGNITO_USER_POOL_ID
# - AWS_REGION
# - TASKS_TABLE
# - ASSIGNMENTS_TABLE

# Check IAM policies
aws iam get-role-policy \
  --role-name task-mgmt-dev-tasks-lambda-role \
  --policy-name task-mgmt-dev-lambda-cognito \
  --region eu-west-1
```

### Step 5: Test Email Notifications

#### Test 1: Task Assignment
```bash
# Create a test task (requires admin JWT token)
curl -X POST \
  https://YOUR_API_GATEWAY_URL/dev/tasks \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Task",
    "description": "Testing Cognito email lookup",
    "priority": "MEDIUM"
  }'

# Assign the task (NEW API SIGNATURE - no userEmail needed)
curl -X POST \
  https://YOUR_API_GATEWAY_URL/dev/tasks/{taskId}/assign \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "taskId": "TASK_ID_FROM_ABOVE",
    "assigneeId": "COGNITO_USER_SUB"
  }'

# Check CloudWatch logs for:
# - "Assignment email sent for assignee: ..."
# - Cognito API calls (AdminGetUser)
```

#### Test 2: Status Update
```bash
# Update task status
curl -X PUT \
  https://YOUR_API_GATEWAY_URL/dev/tasks/{taskId} \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_PROGRESS"
  }'

# Check CloudWatch logs for:
# - "Sending status update to N recipients"
# - List of admin + assignee emails
```

#### Test 3: Task Closure
```bash
# Close the task
curl -X POST \
  https://YOUR_API_GATEWAY_URL/dev/tasks/{taskId}/close \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "closureNotes": "Task completed successfully"
  }'

# Check CloudWatch logs for:
# - "Completion email sent successfully to: ..."
```

### Step 6: Monitor CloudWatch Logs
```bash
# Tasks Lambda
aws logs tail /aws/lambda/task-mgmt-dev-tasks --follow

# Notifications Lambda
aws logs tail /aws/lambda/task-mgmt-dev-notifications --follow
```

**Look for:**
- ✅ Successful Cognito API calls
- ✅ Email lookups completing
- ✅ SES emails being sent
- ❌ Any Cognito permission errors
- ❌ Missing email errors

## 🧪 Testing Scenarios

### Scenario 1: New Assignment Flow
1. Admin creates task → Task stored in DynamoDB
2. Admin assigns to user with assigneeId only (no email) → Assignment stored
3. DynamoDB Stream triggers Notifications Lambda
4. Lambda calls getUserEmail(assigneeId) → Cognito lookup
5. Lambda calls sendTaskAssignmentEmail() → SES sends email

**Expected Result:** User receives assignment email with their Cognito email address

### Scenario 2: Status Update Flow
1. Admin updates task status → DynamoDB MODIFY event
2. Notifications Lambda queries assignments via task-index
3. Lambda extracts all assigneeIds
4. Lambda calls getUserEmail() for each + getUsersByRole('admin')
5. Lambda combines and deduplicates emails
6. SES sends single email to all recipients

**Expected Result:** All assignees + all admins receive status update email

### Scenario 3: Task Closure Flow
1. Admin closes task with closure notes
2. closeTask handler calls sendTaskCompletionEmail(adminId, ...)
3. SES utility calls getUserEmail(adminId)
4. Email sent to admin with task summary

**Expected Result:** Admin receives closure confirmation email

## 🐛 Troubleshooting

### Issue: "Cannot find module @aws-sdk/client-cognito-identity-provider"
**Solution:**
```bash
cd backend
npm install
cd ../infrastructure/terraform
terraform apply -var-file=dev.tfvars
```

### Issue: "AccessDeniedException: User is not authorized to perform: cognito-idp:AdminGetUser"
**Solution:** Check IAM policy is attached:
```bash
aws iam get-role-policy \
  --role-name task-mgmt-dev-tasks-lambda-role \
  --policy-name task-mgmt-dev-lambda-cognito
```

### Issue: "No email found for assignee"
**Solution:** Verify user exists in Cognito:
```bash
aws cognito-idp admin-get-user \
  --user-pool-id YOUR_USER_POOL_ID \
  --username COGNITO_SUB
```

### Issue: Circular dependency error
**Solution:** Already fixed - pre-signup Lambda doesn't get COGNITO_USER_POOL_ID

### Issue: Old assignments don't work
**Solution:** The assignmentId composite key changed from `taskId#userId` to `taskId#assigneeId`. You'll need to migrate existing data or start fresh.

## 📊 What Changed - Quick Reference

### API Changes
| Endpoint | Old Request | New Request |
|----------|-------------|-------------|
| POST /tasks/{taskId}/assign | `{ taskId, userId, userEmail }` | `{ taskId, assigneeId }` |

### DynamoDB Schema
| Table | Old Field | New Field |
|-------|-----------|-----------|
| assignments | userId | assigneeId |
| assignments (key) | taskId#userId | taskId#assigneeId |

### GSI Names
| Old Name | New Name | Hash Key | Range Key |
|----------|----------|----------|-----------|
| UserIndex | assignee-index | assigneeId | - |
| TaskIndex | task-index | taskId | - |

### Environment Variables
| Lambda Function | New Variables |
|----------------|---------------|
| pre-signup | AWS_REGION |
| tasks | COGNITO_USER_POOL_ID, AWS_REGION |
| notifications | COGNITO_USER_POOL_ID, AWS_REGION |

### IAM Permissions
| Lambda Function | New Policies |
|----------------|--------------|
| tasks | cognito-idp:AdminGetUser, cognito-idp:ListUsers |
| notifications | cognito-idp:AdminGetUser, cognito-idp:ListUsers |

## ✅ Post-Deployment Verification

Run this checklist after deployment:

- [ ] Terraform apply completed without errors
- [ ] DynamoDB assignments table exists with new schema
- [ ] Lambda functions show updated environment variables
- [ ] IAM roles have Cognito policies attached
- [ ] Test task creation works
- [ ] Test task assignment with new API signature works
- [ ] Assignment notification email received
- [ ] Status update notification received by assignees + admins
- [ ] Task closure notification received by admin
- [ ] CloudWatch logs show successful Cognito API calls
- [ ] No permission errors in CloudWatch logs

## 🎉 Success Criteria

Your deployment is successful when:
1. ✅ All Terraform resources created/updated without errors
2. ✅ Backend validation shows all handlers OK
3. ✅ Test assignment sends email successfully
4. ✅ CloudWatch shows Cognito email lookups working
5. ✅ Status updates notify both assignees and admins
6. ✅ No IAM permission errors
7. ✅ API accepts new assignTask signature (without userEmail)

---

**Ready to deploy!** 🚀

Run: `cd infrastructure/terraform && terraform apply -var-file=dev.tfvars`
