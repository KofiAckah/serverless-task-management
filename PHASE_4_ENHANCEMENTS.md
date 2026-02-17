# Phase 4 Enhancements - Task Details & Role Management

## Overview
This document outlines the enhancements made to Phase 4, including task details page implementation, automatic role assignment, and clarifications on admin vs member roles.

---

## 1. Admin vs Member Roles - How It Works

### Automatic Role Assignment
**All new users are automatically assigned to the "Members" group** when they confirm their email after signup.

#### Implementation Details:
- **Pre-Signup Lambda** (`preSignup.js`): Validates email domain (only @amalitech.com and @amalitechtraining.org allowed)
- **Post-Confirmation Lambda** (`postConfirmation.js`): NEW - Automatically adds confirmed users to "Members" group
- **Cognito Groups**: "Admins" (precedence 1) and "Members" (precedence 2)

### Making a User an Admin
For security reasons, there is **NO admin signup option**. Users must be manually promoted to admin via AWS CLI.

#### Command to Promote User to Admin:
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id eu-west-1_j6w7VPIZj \
  --username <user-email@amalitech.com> \
  --group-name Admins \
  --region eu-west-1
```

#### Example:
```bash
aws cognito-idp admin-add-user-to-group \
  --user-pool-id eu-west-1_j6w7VPIZj \
  --username john.doe@amalitech.com \
  --group-name Admins \
  --region eu-west-1
```

### Role Detection in Frontend
The AuthContext automatically detects the user's role from Cognito groups:

```javascript
const groups = session.tokens?.idToken?.payload['cognito:groups'] || [];
setUserRole(groups.includes('Admins') ? 'Admin' : 'Member');
```

This provides:
- `userRole`: "Admin" or "Member"
- `isAdmin`: boolean
- `isMember`: boolean

---

## 2. Task Details Page

### Features
A new dedicated task details page (`/tasks/:id`) with the following capabilities:

#### For All Users (Members & Admins):
- View complete task information
- See task title, description, status, priority, due date
- View assignees list
- See creation and update timestamps

#### For Assigned Members:
- Update task status (Open → In Progress, In Progress → Open)
- Cannot close tasks (admin only)
- Cannot edit task details (admin only)

#### For Admins:
- Full edit mode for all task fields
- Update status (Open → In Progress → Closed)
- Close tasks permanently
- Edit title, description, priority, due date

### Page Structure
```
/tasks/:id
├── Header (Back button, Edit/Save/Cancel actions)
├── Task Title (editable for admins)
├── Meta Information (Status, Priority, Due Date, Creator)
├── Description (editable for admins)
├── Assignees List
├── Status Actions (context-aware buttons)
└── Timestamps (Created, Last Updated)
```

### Status Update Flow

#### Members (Assigned to Task):
1. **If status is OPEN**: Show "Start Task" button → Changes to IN_PROGRESS
2. **If status is IN_PROGRESS**: Show "Move to Open" button → Changes back to OPEN
3. **If status is CLOSED**: No actions available (task is complete)

#### Admins:
1. **If status is OPEN**: Show "Start Task" button → Changes to IN_PROGRESS
2. **If status is IN_PROGRESS**: Show "Move to Open" and "Close Task" buttons
   - "Move to Open" → Changes back to OPEN
   - "Close Task" → Changes to CLOSED (with confirmation dialog)
3. **If status is CLOSED**: No actions available

### Navigation
- Click "View Details" button on any task card in the dashboard
- Navigate to `/tasks/{taskId}`  
- Use "Back to Dashboard" to return

---

## 3. Files Created

### Backend
```
backend/src/handlers/postConfirmation.js
```
- Automatically adds newly confirmed users to "Members" group
- Uses AWS SDK Cognito client
- Runs after user confirms their email

### Frontend
```
frontend/src/pages/TaskDetails.jsx
frontend/src/pages/TaskDetails.css
```
- Complete task details and editing interface
- Context-aware actions based on user role and assignment
- Responsive design matching the application theme

### Infrastructure
```
infrastructure/terraform/modules/lambda/main.tf (updated)
infrastructure/terraform/modules/lambda/output.tf (updated)
infrastructure/terraform/modules/cognito/main.tf (updated)
infrastructure/terraform/modules/cognito/variable.tf (updated)
infrastructure/terraform/main.tf (updated)
```
- Added postConfirmation Lambda function
- Added Lambda permissions for Cognito trigger
- Updated Cognito module to use post_confirmation trigger
- Added IAM policies for AdminAddUserToGroup action

---

## 4. Files Modified

### Frontend Updates
1. **`App.jsx`**
   - Added route for `/tasks/:id` → TaskDetails component
   - Protected route with authentication

2. **`TaskCard.jsx`**
   - Added "View Details" button to each task card
   - Added Eye icon from lucide-react
   - Added navigation to task details on button click

3. **`TaskCard.css`**
   - Added styles for `.view-details-btn`
   - Updated `.task-card-footer` to use flexbox for button placement

4. **`Dashboard.jsx`**
   - Fixed import from `@aws-amplify/auth` to `aws-amplify/auth`
   - Ensures compatibility with AWS Amplify v6

---

## 5. Deployment Instructions

### Step 1: Deploy Backend Changes
```bash
cd infrastructure/terraform
terraform plan -var-file="dev.tfvars" -out=tfplan
terraform apply tfplan
```

This will:
- Create the postConfirmation Lambda function
- Configure Cognito to call the Lambda after user confirmation
- Set up necessary IAM permissions

### Step 2: Test Lambda Trigger
1. Create a new user via the frontend registration:
   ```
   Navigate to: http://localhost:3000/register
   Email: test.user@amalitech.com
   Password: Test@123456
   ```

2. Confirm the user with the code from email

3. Verify user was added to Members group:
   ```bash
   aws cognito-idp admin-list-groups-for-user \
     --user-pool-id eu-west-1_j6w7VPIZj \
     --username test.user@amalitech.com \
     --region eu-west-1
   ```

4. Should see output:
   ```json
   {
     "Groups": [
       {
         "GroupName": "Members",
         "Precedence": 2
       }
     ]
   }
   ```

### Step 3: Restart Frontend (if needed)
```bash
cd frontend
npm run dev
```

---

## 6. Testing the Changes

### Test Auto-Assignment to Members Group
1. Register a new user
2. Confirm email
3. Login
4. Verify role badge shows "Member"
5. Verify dashboard shows member-specific view

### Test Admin Promotion
1. Promote a user to admin:
   ```bash
   aws cognito-idp admin-add-user-to-group \
     --user-pool-id eu-west-1_j6w7VPIZj \
     --username <email> \
     --group-name Admins \
     --region eu-west-1
   ```

2. Log out and log back in
3. Verify role badge shows "Admin"
4. Verify "Create Task" button appears
5. Verify all tasks are visible (not just assigned)

### Test Task Details Page
1. **As Admin**:
   - Click "View Details" on any task
   - Click "Edit Task" button
   - Modify title, description, priority, status, due date
   - Click "Save Changes"
   - Verify changes are saved

2. **As Member**:
   - Click "View Details" on an assigned task
   - Verify no "Edit Task" button appears
   - Click "Start Task" if status is OPEN
   - Verify status changes to IN_PROGRESS
   - Verify "Close Task" button does NOT appear

3. **Navigation**:
   - Click "View Details" from dashboard
   - Verify URL is `/tasks/{taskId}`
   - Click "Back to Dashboard"
   - Verify return to main dashboard

---

## 7. Permission Matrix

| Action | Admin | Member (Assigned) | Member (Not Assigned) |
|--------|-------|-------------------|----------------------|
| View Task Details | ✅ | ✅ | ✅ |
| Edit Task Details | ✅ | ❌ | ❌ |
| Update Status (Open ↔ In Progress) | ✅ | ✅ | ❌ |
| Close Task | ✅ | ❌ | ❌ |
| Create Task | ✅ | ❌ | ❌ |
| View All Tasks | ✅ | ❌ | ❌ |
| Assign Tasks | ✅ | ❌ | ❌ |

---

## 8. API Endpoints Used

### Task Details Page
- `GET /tasks` - Fetch all tasks (filtered by backend based on role)
- `PUT /tasks/{id}` - Update task (admins: all fields, members: status only)
- `POST /tasks/{id}/close` - Close task (admin only)

### Role Detection
- Extracted from Cognito JWT token (`cognito:groups` claim)
- No separate API call needed

---

## 9. Security Considerations

### Why No Admin Signup?
- **Security First**: Prevents unauthorized users from gaining admin privileges
- **Controlled Access**: Admins must be manually assigned by AWS administrators
- **Audit Trail**: AWS CloudTrail logs all admin group assignments
- **Industry Best Practice**: Separation of signup and privilege escalation

### Email Domain Validation
- Only @amalitech.com and @amalitechtraining.org emails allowed
- Validated at:
  1. Pre-signup Lambda trigger (server-side)
  2. Frontend form validation (client-side)
  3. Cognito user pool configuration

### Token Management
- JWT tokens contain `cognito:groups` claim
- Frontend extracts role from token on each session check
- Tokens expire after configured duration (default: 1 hour)
- Refresh tokens valid for 30 days

---

## 10. Troubleshooting

### Issue: User stuck as Member after admin promotion
**Solution**: Log out and log back in to refresh the JWT token with new groups

### Issue: postConfirmation Lambda not triggering
**Check**:
1. Verify Lambda has Cognito invoke permission:
   ```bash
   aws lambda get-policy \
     --function-name serverless-task-dev-post-confirmation \
     --region eu-west-1
   ```
2. Check Lambda logs:
   ```bash
   aws logs tail /aws/lambda/serverless-task-dev-post-confirmation --follow
   ```
3. Verify Cognito trigger configuration:
   ```bash
   aws cognito-idp describe-user-pool \
     --user-pool-id eu-west-1_j6w7VPIZj \
     --region eu-west-1 \
     --query 'UserPool.LambdaConfig'
   ```

### Issue: "View Details" button not visible on task cards
**Solution**: Hard refresh browser (Ctrl+Shift+R) to clear CSS cache

### Issue: Task details page shows loading forever
**Check**:
1. Browser console for errors
2. Verify task ID exists in database
3. Check API Gateway logs for request errors

---

## 11. Next Steps (Phase 5 - Hosting)

After testing all Phase 4 enhancements:
1. Deploy frontend to AWS Amplify Hosting
2. Configure build settings for Vite
3. Set environment variables for production
4. Connect to GitHub repository
5. Set up continuous deployment

---

## Summary of Changes

✅ **New Features**:
- Task Details page with full CRUD capabilities
- Automatic role assignment (Members group)
- Context-aware UI based on user role and task assignment
- Status update workflow for members and admins

✅ **Backend Enhancements**:
- postConfirmation Lambda trigger
- Automatic group membership

✅ **Frontend Enhancements**:
- TaskDetails component with responsive design
- "View Details" navigation from task cards
- Fixed AWS Amplify v6 import errors

✅ **Infrastructure**:
- Terraform configuration for postConfirmation Lambda
- Cognito trigger configuration
- IAM policies for group management

✅ **Documentation**:
- Clear role management instructions
- Security best practices
- Testing guidelines
- Troubleshooting guide
