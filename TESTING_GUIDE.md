# Testing Guide - Serverless Task Management System

## Prerequisites

Before running tests, ensure:
- ✅ Terraform has successfully deployed all infrastructure
- ✅ Backend Lambda functions are deployed and updated
- ✅ Frontend is running (or will be started)

## Step 1: Clean Data and Create Test Users

Run the cleanup script:

```bash
chmod +x cleanup-and-test.sh
./cleanup-and-test.sh
```

This script will:
1. Delete all existing Cognito users
2. Clean all tasks from DynamoDB
3. Clean all assignments from DynamoDB
4. Create two test users:
   - **Admin**: `admin.test@amalitech.com` / `Admin Test` / `AdminPass123!`
   - **Member**: `member.test@amalitech.com` / `Member Test` / `AdminPass123!`

## Step 2: Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend should be available at: `http://localhost:5173`

## Step 3: Test Admin Functionality

### 3.1 Admin Login
1. Navigate to `http://localhost:5173`
2. Login with:
   - Email: `admin.test@amalitech.com`
   - Password: `AdminPass123!`
3. ✅ Verify: Redirected to dashboard
4. ✅ Verify: Dashboard shows "Admin" role

### 3.2 Create Task (Without Assignment)
1. Click "Create Task" button
2. Fill in:
   - Title: "Test Task 1"
   - Description: "Testing task creation without assignment"
   - Priority: High
   - Due Date: (any future date)
   - Assign To: (leave empty)
3. Click "Create Task"
4. ✅ Verify: Task appears in task list
5. ✅ Verify: Task created by "Admin Test"
6. ✅ Verify: No one assigned to task

### 3.3 Create Task (With Assignment)
1. Click "Create Task" button
2. Fill in:
   - Title: "Test Task 2"
   - Description: "Testing task creation with assignment"
   - Priority: Medium
   - Assign To: Select "Member Test (member.test@amalitech.com)"
3. Click "Create Task"
4. ✅ Verify: Task appears in task list
5. ✅ Verify: Task shows it's assigned (check task details)

### 3.4 Edit Task - Modify Details
1. Click on "Test Task 1"
2. Click "Edit Task" button
3. Change:
   - Title: "Updated Task 1"
   - Description: "Updated description"
   - Priority: Low
4. Click "Save Changes"
5. ✅ Verify: Changes are saved
6. ✅ Verify: Task shows updated information

### 3.5 Edit Task - Add Assignment
1. Click on "Updated Task 1"
2. Click "Edit Task" button
3. In "Assign To Users" section:
   - Select both "Admin Test" and "Member Test" (hold Ctrl/Cmd)
4. Click "Save Changes"
5. ✅ Verify: Task now has both users assigned
6. Log out and log in as Member (see section 4)
7. ✅ Verify: Member can now see this task

### 3.6 Edit Task - Remove Assignment
1. (As Admin) Click on "Updated Task 1"
2. Click "Edit Task" button
3. In "Assign To Users" section:
   - Deselect all users (or select neither)
4. Click "Save Changes"
5. ✅ Verify: Task has no assignments
6. Log out and log in as Member
7. ✅ Verify: Member cannot see this task anymore

### 3.7 Edit Task - Reassign
1. (As Admin) Create "Test Task 3" and assign to Member
2. Edit "Test Task 3"
3. Change assignment from Member to Admin (only select Admin)
4. Click "Save Changes"
5. ✅ Verify: Assignment changed
6. Log out and log in as Member
7. ✅ Verify: Member cannot see "Test Task 3"

### 3.8 Close Task
1. (As Admin) Click on any open task
2. Change status to "Closed" OR use close button
3. ✅ Verify: Task status is CLOSED
4. ✅ Verify: Task shows "Closed by: Admin Test"

## Step 4: Test Member Functionality

### 4.1 Member Login
1. Log out from admin account
2. Login with:
   - Email: `member.test@amalitech.com`
   - Password: `AdminPass123!`
3. ✅ Verify: Redirected to dashboard
4. ✅ Verify: Dashboard shows "Member" role

### 4.2 View Assigned Tasks Only
1. Check task list
2. ✅ Verify: Only sees tasks assigned to "Member Test"
3. ✅ Verify: Does NOT see unassigned tasks
4. ✅ Verify: Does NOT see tasks assigned only to others

### 4.3 Member Cannot Create Tasks
1. ✅ Verify: "Create Task" button is NOT visible
2. ✅ Verify: Cannot access task creation

### 4.4 Member Can Update Status
1. Click on a task assigned to Member
2. Change status from OPEN to IN_PROGRESS
3. ✅ Verify: Status change works
4. ✅ Verify: Task appears in "In Progress" section

### 4.5 Member Cannot Edit Task Details
1. Click on assigned task
2. ✅ Verify: "Edit Task" button is NOT visible
3. ✅ Verify: Cannot change title, description, priority

### 4.6 Member Cannot Assign/Reassign Tasks
1. Click on assigned task
2. ✅ Verify: No assignment UI visible
3. ✅ Verify: Cannot add/remove assignees

### 4.7 Member Cannot Close Tasks
1. Click on assigned task in IN_PROGRESS
2. ✅ Verify: No "Close Task" button
3. ✅ Verify: Can only change between OPEN and IN_PROGRESS

## Step 5: Backend API Testing

### 5.1 Get Users Endpoint (Admin Only)
```bash
# Get admin token from frontend (check browser console or network tab)
TOKEN="<your-admin-id-token>"

curl -X GET \
  https://64qbg3irni.execute-api.eu-west-1.amazonaws.com/dev/users \
  -H "Authorization: Bearer $TOKEN"
```

✅ Verify: Returns list of all users (Admin and Member)

### 5.2 Create Task with Assignment
```bash
TOKEN="<your-admin-id-token>"
MEMBER_USER_ID="<member-userId-from-get-users>"

curl -X POST \
  https://64qbg3irni.execute-api.eu-west-1.amazonaws.com/dev/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Task",
    "description": "Created via API",
    "priority": "HIGH",
    "assignedTo": ["'$MEMBER_USER_ID'"]
  }'
```

✅ Verify: Returns success with task and assignments

### 5.3 Update Task with New Assignment
```bash
TOKEN="<your-admin-id-token>"
TASK_ID="<taskId-from-create-response>"
ADMIN_USER_ID="<admin-userId>"

curl -X PUT \
  https://64qbg3irni.execute-api.eu-west-1.amazonaws.com/dev/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated API Task",
    "assignedTo": ["'$ADMIN_USER_ID'", "'$MEMBER_USER_ID'"]
  }'
```

✅ Verify: Returns success with assignment changes

### 5.4 Update Task - Remove All Assignments
```bash
curl -X PUT \
  https://64qbg3irni.execute-api.eu-west-1.amazonaws.com/dev/tasks/$TASK_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "assignedTo": []
  }'
```

✅ Verify: Returns success, all assignments removed

## Step 6: Assignment Requirements Verification

Based on the assignment PDF, verify these requirements:

### ✅ Core Requirements
- [x] Admin can create tasks
- [x] Admin can assign tasks to users (during creation)
- [x] Admin can assign tasks to users (after creation via edit)
- [x] Admin can assign to both Admin and Member roles
- [x] Admin can reassign tasks (change assignments)
- [x] Admin can unassign tasks (remove all assignments)
- [x] Tasks can be created without assignments
- [x] Member can only see assigned tasks
- [x] Member can update status of assigned tasks
- [x] Member cannot edit task details
- [x] Member cannot assign/reassign tasks
- [x] Task shows who created it (createdByName)
- [x] Task shows who closed it (closedByName)

### ✅ Data Display
- [x] Task cards show creator name
- [x] Task cards show closer name (if closed)
- [x] Task details show creator
- [x] Task details show closer (if closed)
- [x] User names stored and displayed correctly

## Step 7: Edge Cases Testing

### 7.1 Assign to Multiple Users
1. Create task and assign to both Admin and Member
2. ✅ Verify: Both users can see the task
3. ✅ Verify: Both can update status

### 7.2 Empty Assignment List
1. Edit a task and deselect all users
2. ✅ Verify: No one can see the task (except admin in all tasks view)

### 7.3 Task Status Flow
1. Create task (OPEN)
2. Assign to member
3. Member changes to IN_PROGRESS
4. Admin closes task (CLOSED)
5. ✅ Verify: Full workflow works

### 7.4 Permission Boundaries
1. Member tries to access /users endpoint
2. ✅ Verify: Gets 403 Forbidden
3. Member tries to create task
4. ✅ Verify: UI doesn't allow it

## Troubleshooting

### Issue: "Cannot read property 'userId'"
- **Cause**: User not properly authenticated
- **Fix**: Clear browser cache, log out and log in again

### Issue: "Task not found" when clicking View Details
- **Cause**: task.id vs task.taskId mismatch (FIXED)
- **Fix**: Clear browser cache and reload

### Issue: Assignment dropdown empty
- **Cause**: GET /users returns no users OR admin not logged in
- **Fix**: 
  1. Verify users exist in Cognito
  2. Check browser console for errors
  3. Verify admin token is valid

### Issue: Assignment changes not saving
- **Cause**: Backend updateTask not receiving assignedTo
- **Fix**: Check network tab, verify assignedTo array in request

## Cleanup After Testing

To start fresh for another test run:

```bash
./cleanup-and-test.sh
```

This will delete all data and recreate test users.

## Expected Results Summary

| Action | Admin | Member |
|--------|-------|--------|
| Create Task | ✅ | ❌ |
| Assign Task (Create) | ✅ | ❌ |
| Assign Task (Edit) | ✅ | ❌ |
| View All Tasks | ✅ | ❌ |
| View Assigned Tasks | ✅ | ✅ |
| Edit Task Details | ✅ | ❌ |
| Update Task Status | ✅ | ✅ (assigned only) |
| Close Task | ✅ | ❌ |
| Delete Task | ❌ | ❌ |

## Test Completion Checklist

- [ ] All Cognito users deleted
- [ ] All DynamoDB tables cleaned
- [ ] Test users created successfully
- [ ] Admin can log in
- [ ] Member can log in
- [ ] Admin can create tasks without assignment
- [ ] Admin can create tasks with assignment
- [ ] Admin can edit task and add assignment
- [ ] Admin can edit task and remove assignment
- [ ] Admin can edit task and reassign users
- [ ] Member sees only assigned tasks
- [ ] Member can update status
- [ ] Member cannot edit details
- [ ] Member cannot assign/reassign
- [ ] Task creator name displayed correctly
- [ ] Task closer name displayed correctly (when closed)
- [ ] All backend API endpoints work
- [ ] All assignment requirements verified

---

**Note**: Make sure the backend deployment (terraform apply) has completed before running these tests!
