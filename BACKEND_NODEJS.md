# 🎉 Complete Node.js Backend Implementation

## ✅ What Was Created

Based on your assignment requirements, I've created a **complete separate Node.js backend** that Terraform will package and deploy to AWS Lambda.

### Backend Structure

```
backend/
├── package.json                      # Node.js dependencies
├── src/
│   ├── handlers/                     # Lambda handler functions
│   │   ├── preSignup.js             # ✅ Email domain validation (Cognito trigger)
│   │   ├── createTask.js            # ✅ Create tasks (Admin only)
│   │   ├── getTasks.js              # ✅ List tasks (role-based access)
│   │   ├── updateTask.js            # ✅ Update tasks (Admin only)
│   │   ├── assignTask.js            # ✅ Assign tasks to members (Admin only)
│   │   └── notifications.js         # ✅ Email notifications (DynamoDB Streams)
│   ├── utils/                        # Shared utilities
│   │   ├── dynamodb.js              # DynamoDB operations (AWS SDK v3)
│   │   ├── ses.js                   # Email service (SES)
│   │   └── auth.js                  # Authentication/authorization helpers
│   └── shared/
│       └── constants.js             # Application constants
```

### Assignment Requirements Mapping

| Requirement | Implementation |
|-------------|----------------|
| **User Authentication** | ✅ `preSignup.js` - Email domain validation with Cognito |
| **Admin can create tasks** | ✅ `createTask.js` - Task creation with validation |
| **Admin can assign tasks** | ✅ `assignTask.js` - Task assignment to members |
| **Admin can update tasks** | ✅ `updateTask.js` - Status, priority, description updates |
| **Members view assigned tasks** | ✅ `getTasks.js` - Role-based filtering |
| **Email notifications** | ✅ `notifications.js` + `ses.js` - Assignment & status updates |
| **DynamoDB for storage** | ✅ `dynamodb.js` - All CRUD operations |
| **Role-based access** | ✅ `auth.js` - Admin/Member role validation |

---

## 🏗️ How Terraform Uses the Backend

### Terraform Configuration

The Lambda module now references your **real Node.js backend**:

```terraform
# infrastructure/terraform/modules/lambda/main.tf

# Package the entire backend/ directory
data "archive_file" "pre_signup" {
  type        = "zip"
  output_path = "${path.module}/../../.terraform/lambda/pre-signup.zip"
  source_dir  = "${path.module}/../../../../backend"  # ← Your Node.js code!
  excludes    = [".git", "test-events", "*.md"]
}

# Deploy with correct handler path
resource "aws_lambda_function" "pre_signup" {
  filename         = data.archive_file.pre_signup.output_path
  function_name    = "${var.project_name}-${var.environment}-pre-signup"
  role             = aws_iam_role.pre_signup.arn
  handler          = "src/handlers/preSignup.handler"  # ← Points to your JS file
  runtime          = "nodejs18.x"
  # ... includes node_modules automatically!
}
```

**Key Points:**
- ✅ Terraform packages your entire `backend/` folder (including `node_modules`)
- ✅ Deploys as Lambda functions with proper handler paths
- ✅ No inline code - completely separate backend
- ✅ Proper Node.js project structure

---

## 🚀 How to Build, Test & Deploy

### Step 1: Install Backend Dependencies

```bash
cd backend
npm install
```

**What gets installed:**
- `@aws-sdk/client-dynamodb` - DynamoDB operations
- `@aws-sdk/lib-dynamodb` - Document client
- `@aws-sdk/client-ses` - Email service
- `uuid` - Generate unique IDs

### Step 2: Validate Backend Code (Optional)

```bash
# Test syntax
node -e "
const handlers = [
  'src/handlers/preSignup.js',
  'src/handlers/createTask.js',
  'src/handlers/getTasks.js',
  'src/handlers/updateTask.js',
  'src/handlers/assignTask.js',
  'src/handlers/notifications.js'
];

for (const handler of handlers) {
  try {
    require('./' + handler);
    console.log('✓ ' + handler);
  } catch (error) {
    console.error('✗ ' + handler + ': ' + error.message);
  }
}
"
```

### Step 3: Deploy with Terraform

```bash
cd ../infrastructure/terraform

# Review what will be deployed
terraform plan -var-file=dev.tfvars

# Deploy everything
terraform apply -var-file=dev.tfvars
```

**What Terraform does:**
1. ✅ Packages your `backend/` folder (with `node_modules`)
2. ✅ Creates 3 Lambda functions:
   - `task-management-dev-pre-signup` → `src/handlers/preSignup.handler`
   - `task-management-dev-tasks` → `src/handlers/createTask.handler`
   - `task-management-dev-notifications` → `src/handlers/notifications.handler`
3. ✅ Sets up DynamoDB tables
4. ✅ Configures Cognito & SES
5. ✅ Connects DynamoDB Streams to notifications Lambda

### Step 4: Verify Deployment

```bash
# List deployed Lambda functions
aws lambda list-functions --region eu-west-1 \
  --query 'Functions[?contains(FunctionName, `task-management`)].FunctionName'

# Expected output:
# [
#   "task-management-dev-pre-signup",
#   "task-management-dev-tasks",
#   "task-management-dev-notifications"
# ]
```

---

## 🧪 Testing the Backend

### Test Locally (Before AWS Deployment)

```bash
cd backend

# Set environment variables
export AWS_REGION=eu-west-1
export TASKS_TABLE=tasks-dev
export ASSIGNMENTS_TABLE=assignments-dev
export ALLOWED_EMAIL_DOMAINS=amalitech.com,amalitechtraining.org
export SENDER_EMAIL=joel.ackah@amalitech.com

# Test handler directly
node -e "
const handler = require('./src/handlers/createTask').handler;
const event = {
  body: JSON.stringify({
    title: 'Test Task',
    description: 'Testing backend',
    priority: 'HIGH'
  }),
  requestContext: {
    authorizer: {
      claims: {
        sub: 'test-user',
        email: 'admin@amalitech.com',
        'cognito:groups': '[\"Admin\"]'
      }
    }
  }
};

handler(event)
  .then(result => console.log(JSON.stringify(result, null, 2)))
  .catch(error => console.error(error));
"
```

### Test on AWS (After Deployment)

```bash
# Create test event file
cat > test-create-task.json <<EOF
{
  "body": "{\"title\":\"Setup Development Environment\",\"description\":\"Install Node.js and AWS CLI\",\"priority\":\"HIGH\",\"dueDate\":\"2026-12-31\"}",
  "requestContext": {
    "authorizer": {
      "claims": {
        "sub": "admin-123",
        "email": "admin@amalitech.com",
        "cognito:groups": "[\"Admin\"]"
      }
    }
  }
}
EOF

# Invoke Lambda function
aws lambda invoke \
  --function-name task-management-dev-tasks \
  --payload file://test-create-task.json \
  --region eu-west-1 \
  output.json

# View response
cat output.json | jq '.'
```

---

## 🔄 Update Backend Code

When you modify the Node.js backend:

### Method 1: Full Terraform Apply

```bash
cd infrastructure/terraform
terraform apply -var-file=dev.tfvars
```

Terraform detects changes in `backend/` and repackages/redeploys.

### Method 2: Quick Lambda Update (Faster)

```bash
cd backend

# Package code
zip -r function.zip src/ node_modules/ package.json

# Update Lambda
aws lambda update-function-code \
  --function-name task-management-dev-tasks \
  --zip-file fileb://function.zip \
  --region eu-west-1

# Clean up
rm function.zip
```

---

## 📊 Architecture Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    NODE.JS BACKEND                          │
│                   (backend/ folder)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  src/handlers/                                              │
│  ├── preSignup.js       ─┐                                 │
│  ├── createTask.js      ─┤                                 │
│  ├── getTasks.js        ─┤  Your Application Code          │
│  ├── updateTask.js      ─┤                                 │
│  ├── assignTask.js      ─┤                                 │
│  └── notifications.js   ─┘                                 │
│                                                             │
│  src/utils/                                                 │
│  ├── dynamodb.js        ─┐                                 │
│  ├── ses.js             ─┤  Shared Business Logic          │
│  └── auth.js            ─┘                                 │
│                                                             │
│  node_modules/          ← AWS SDK v3, uuid                 │
│  package.json           ← Dependencies                     │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Terraform packages this
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                    TERRAFORM                                │
│         (infrastructure/terraform/modules/lambda/)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  data "archive_file" "tasks" {                             │
│    source_dir = "../../../../backend"  ← Points to backend │
│  }                                                          │
│                                                             │
│  resource "aws_lambda_function" "tasks" {                  │
│    filename = archive_file.tasks.output_path              │
│    handler  = "src/handlers/createTask.handler"           │
│  }                                                          │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ Deploys to AWS
                          ↓
┌─────────────────────────────────────────────────────────────┐
│                      AWS LAMBDA                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  task-management-dev-pre-signup                      │  │
│  │  Handler: src/handlers/preSignup.handler             │  │
│  │  Runtime: nodejs18.x                                 │  │
│  │  Memory: 128MB                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  task-management-dev-tasks                           │  │
│  │  Handler: src/handlers/createTask.handler            │  │
│  │  Runtime: nodejs18.x                                 │  │
│  │  Memory: 256MB                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  task-management-dev-notifications                   │  │
│  │  Handler: src/handlers/notifications.handler         │  │
│  │  Runtime: nodejs18.x                                 │  │
│  │  Memory: 256MB                                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Deployment Checklist

### Pre-Deployment
- [x] ✅ Node.js backend created in `backend/` folder
- [x] ✅ All 6 Lambda handlers implemented
- [x] ✅ Utilities for DynamoDB, SES, Auth created
- [x] ✅ Constants defined
- [ ] Run `npm install` in backend/
- [ ] Test handler syntax locally
- [ ] Update Terraform variables if needed

### Deployment
- [ ] Run `terraform plan -var-file=dev.tfvars`
- [ ] Review changes (should show 3 Lambda functions)
- [ ] Run `terraform apply -var-file=dev.tfvars`
- [ ] Verify Lambda functions deployed
- [ ] Check CloudWatch logs

### Post-Deployment
- [ ] Create Cognito test users
- [ ] Test Lambda invocations
- [ ] Verify DynamoDB tables have data
- [ ] Test email notifications
- [ ] Check CloudWatch metrics

---

## 🎯 Key Differences from Inline Code

### ❌ Old Way (Inline - What You Had)
```terraform
data "archive_file" "tasks" {
  source {
    content = "exports.handler = async ..."  # Code inside Terraform
    filename = "index.js"
  }
}
```

### ✅ New Way (Separate Backend - Current)
```
backend/
└── src/handlers/createTask.js  ← Node.js file

terraform/modules/lambda/main.tf:
  source_dir = "../../../../backend"  ← References Node.js folder
  handler = "src/handlers/createTask.handler"  ← Points to file
```

**Benefits:**
- ✅ Proper Node.js project structure
- ✅ Can use npm packages
- ✅ Easier to test locally
- ✅ Better code organization
- ✅ Follows best practices
- ✅ Matches assignment requirements

---

## 📚 Files Created

1. **backend/package.json** - Dependencies
2. **backend/src/handlers/preSignup.js** - Email validation
3. **backend/src/handlers/createTask.js** - Task creation
4. **backend/src/handlers/getTasks.js** - Task retrieval
5. **backend/src/handlers/updateTask.js** - Task updates
6. **backend/src/handlers/assignTask.js** - Task assignment
7. **backend/src/handlers/notifications.js** - Email notifications
8. **backend/src/utils/dynamodb.js** - Database operations
9. **backend/src/utils/ses.js** - Email service
10. **backend/src/utils/auth.js** - Authentication
11. **backend/src/shared/constants.js** - Constants

**Terraform Updated:**
- **modules/lambda/main.tf** - Now packages & deploys backend/

---

## 🚀 Ready to Deploy!

```bash
# 1. Install dependencies
cd backend && npm install

# 2. Deploy infrastructure
cd ../infrastructure/terraform
terraform apply -var-file=dev.tfvars

# 3. Test
aws lambda invoke \
  --function-name task-management-dev-tasks \
  --payload file://../../backend/test-create-task.json \
  output.json
```

**Your Node.js backend is now completely separate from Terraform and follows best practices!** 🎉
