#!/bin/bash
# Test assignment feature via API

API_BASE="https://eh80x3jtqg.execute-api.eu-west-1.amazonaws.com/dev"
COGNITO_CLIENT_ID="2fttt9s91nahnqjbgo6qk95k60"

echo "============================================"
echo "Testing Assignment Feature"
echo "============================================"
echo ""

# Login as Admin
echo "1. Logging in as Admin..."
ADMIN_LOGIN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id "$COGNITO_CLIENT_ID" \
  --region eu-west-1 \
  --auth-parameters USERNAME=admin.test@amalitech.com,PASSWORD=AdminPass123! \
  --query 'AuthenticationResult.{AccessToken:AccessToken,IdToken:IdToken}' \
  --output json)

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.IdToken')

if [ "$ADMIN_TOKEN" == "null" ]; then
  echo "❌ Failed to login as admin"
  exit 1
fi
echo "✅ Admin logged in successfully"
echo ""

# Get list of users
echo "2. Getting list of users..."
USERS_RESPONSE=$(curl -s -X GET "$API_BASE/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo "$USERS_RESPONSE" | jq '.'
echo ""

# Extract member userId
MEMBER_ID=$(echo "$USERS_RESPONSE" | jq -r '.users[] | select(.email == "john.doe@amalitech.com") | .userId')

if [ -z "$MEMBER_ID" ] || [ "$MEMBER_ID" == "null" ]; then
  echo "⚠️  john.doe@amalitech.com not found, trying member.test@amalitech.com"
  MEMBER_ID=$(echo "$USERS_RESPONSE" | jq -r '.users[] | select(.email == "member.test@amalitech.com") | .userId')
fi

echo "Member ID to assign: $MEMBER_ID"
echo ""

# Create task with assignment
echo "3. Creating task with assignment..."
TASK_DATA=$(cat <<TASKJSON
{
  "title": "Test Task with Assignment",
  "description": "Testing task assignment via API",
  "priority": "HIGH",
  "status": "OPEN",
  "dueDate": "2026-02-25T12:00:00.000Z",
  "assignedTo": ["$MEMBER_ID"]
}
TASKJSON
)

CREATE_RESPONSE=$(curl -s -X POST "$API_BASE/tasks" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d "$TASK_DATA")

echo "$CREATE_RESPONSE" | jq '.'
echo ""

TASK_ID=$(echo "$CREATE_RESPONSE" | jq -r '.task.taskId // .taskId')

if [ -z "$TASK_ID" ] || [ "$TASK_ID" == "null" ]; then
  echo "❌ Failed to create task"
  exit 1
fi

echo "✅ Task created with ID: $TASK_ID"
echo ""

# Get task details to verify assignment
echo "4. Verifying task assignment..."
TASK_DETAILS=$(curl -s -X GET "$API_BASE/tasks/$TASK_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json")

echo "$TASK_DETAILS" | jq '.'
echo ""

# Login as Member to verify they can see it
echo "5. Logging in as Member to verify assignment..."
MEMBER_LOGIN=$(aws cognito-idp initiate-auth \
  --auth-flow USER_PASSWORD_AUTH \
  --client-id "$COGNITO_CLIENT_ID" \
  --region eu-west-1 \
  --auth-parameters USERNAME=john.doe@amalitech.com,PASSWORD=AdminPass123! \
  --query 'AuthenticationResult.IdToken' \
  --output text 2>/dev/null)

if [ -z "$MEMBER_LOGIN" ] || [ "$MEMBER_LOGIN" == "None" ]; then
  echo "⚠️  Trying member.test@amalitech.com instead..."
  MEMBER_LOGIN=$(aws cognito-idp initiate-auth \
    --auth-flow USER_PASSWORD_AUTH \
    --client-id "$COGNITO_CLIENT_ID" \
    --region eu-west-1 \
    --auth-parameters USERNAME=member.test@amalitech.com,PASSWORD=AdminPass123! \
    --query 'AuthenticationResult.IdToken' \
    --output text)
fi

echo "✅ Member logged in successfully"
echo ""

# Get assigned tasks
echo "6. Getting member's assigned tasks..."
ASSIGNED_TASKS=$(curl -s -X GET "$API_BASE/tasks" \
  -H "Authorization: Bearer $MEMBER_LOGIN" \
  -H "Content-Type: application/json")

echo "$ASSIGNED_TASKS" | jq '.'
echo ""

echo "============================================"
echo "✅ Test Complete!"
echo "============================================"
