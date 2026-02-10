# 📧 Cognito Email Verification Fix - Deployment Guide

## ✅ What Was Fixed

Your Cognito User Pool now uses **AWS SES** for sending verification emails instead of Cognito's default email service.

### Changes Made

#### 1. **Cognito Module** - Email Configuration Added
- [modules/cognito/main.tf](infrastructure/terraform/modules/cognito/main.tf)
  - ✅ Added `email_configuration` block to `aws_cognito_user_pool`
  - ✅ Set `email_sending_account = "DEVELOPER"` (use SES)
  - ✅ Set `source_arn` to SES email identity ARN
  - ✅ Set `from_email_address` to your sender email

- [modules/cognito/variable.tf](infrastructure/terraform/modules/cognito/variable.tf)
  - ✅ Added `ses_email_identity_arn` variable
  - ✅ Added `sender_email` variable

#### 2. **Main Terraform Configuration**
- [main.tf](infrastructure/terraform/main.tf)
  - ✅ Wired SES module output to Cognito module
  - ✅ Added `depends_on = [module.ses]` to ensure SES is created first

#### 3. **SES Module** (Already Existed)
- ✅ Email identity resource already configured
- ✅ IAM policies already set up
- ✅ Configuration set already created

---

## 🚀 Deployment Steps

### Step 1: Verify SES Email Address

**IMPORTANT:** You must verify your sender email in SES **before** deploying Cognito changes.

```bash
# Navigate to terraform directory
cd infrastructure/terraform

# Get your sender email from tfvars
grep sender_email dev.tfvars

# Verify the email in SES (this sends verification email to joel.ackah@amalitech.com)
aws ses verify-email-identity \
  --email-address joel.ackah@amalitech.com \
  --region eu-west-1
```

**Check your inbox** (joel.ackah@amalitech.com) and click the verification link from AWS SES.

### Step 2: Confirm Email Verification

```bash
# Check verification status
aws ses get-identity-verification-attributes \
  --identities joel.ackah@amalitech.com \
  --region eu-west-1

# Expected output:
# {
#   "VerificationAttributes": {
#     "joel.ackah@amalitech.com": {
#       "VerificationStatus": "Success"
#     }
#   }
# }
```

**Status must be "Success" before proceeding!**

### Step 3: Review Terraform Plan

```bash
# Review changes
terraform plan -var-file=dev.tfvars

# Expected changes:
# - Cognito User Pool will be UPDATED (email_configuration added)
# - SES email identity will be CREATED (if not exists)
```

### Step 4: Apply Changes

```bash
# Apply configuration
terraform apply -var-file=dev.tfvars
```

**Expected output:**
```
Plan: 1 to add, 1 to change, 0 to destroy.

Changes:
  + aws_ses_email_identity.sender (if not exists)
  ~ aws_cognito_user_pool.main
    + email_configuration {
      + email_sending_account = "DEVELOPER"
      + from_email_address    = "joel.ackah@amalitech.com"
      + source_arn            = "arn:aws:ses:eu-west-1:xxx:identity/joel.ackah@amalitech.com"
    }
```

---

## 🧪 Testing Email Verification

### Test 1: Register New User via API

```bash
# Get your API Gateway URL
API_URL=$(terraform output -raw api_gateway_url)

# Register a test user
curl -X POST "${API_URL}/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@amalitech.com",
    "password": "SecurePass123!",
    "role": "member"
  }'

# Expected response:
# {
#   "message": "User registered successfully. Please check your email for verification code.",
#   "userId": "abc-123...",
#   "email": "testuser@amalitech.com",
#   "role": "member",
#   "userConfirmed": false
# }
```

### Test 2: Check Email Delivery

**Check the test user's inbox** (testuser@amalitech.com) for:
- ✅ Email from: joel.ackah@amalitech.com
- ✅ Subject: "Your verification code"
- ✅ 6-digit verification code in the email body

### Test 3: Verify Email with Code

```bash
# Use the code from email
curl -X POST "${API_URL}/auth/confirm" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@amalitech.com",
    "code": "123456"
  }'

# Expected response:
# {
#   "message": "Email verified successfully. You can now log in.",
#   "email": "testuser@amalitech.com"
# }
```

### Test 4: Login with Verified User

```bash
curl -X POST "${API_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@amalitech.com",
    "password": "SecurePass123!"
  }'

# Should return JWT tokens
```

---

## 🔍 Troubleshooting

### Issue 1: Email Not Received

**Check SES Verification Status:**
```bash
aws ses get-identity-verification-attributes \
  --identities joel.ackah@amalitech.com \
  --region eu-west-1
```

**Check SES Sending Limits:**
```bash
aws ses get-send-quota --region eu-west-1

# Output shows:
# - Max24HourSend: Maximum emails per 24 hours
# - MaxSendRate: Maximum emails per second
# - SentLast24Hours: Emails sent in last 24 hours
```

**Check if SES is in Sandbox Mode:**
```bash
aws ses get-account-sending-enabled --region eu-west-1

# If in sandbox mode, you can only send to verified email addresses
```

### Issue 2: SES Sandbox Restrictions

If SES is in **sandbox mode**, you can only send emails to verified addresses.

**Verify recipient email:**
```bash
# Verify the test user's email
aws ses verify-email-identity \
  --email-address testuser@amalitech.com \
  --region eu-west-1
```

**Request Production Access:**
```bash
# Go to SES Console
# Navigate to: Account dashboard > Sending statistics
# Click "Request production access"
# Fill out the form explaining your use case
```

### Issue 3: Cognito User Pool Already Has Users

If your user pool already has users, they won't receive verification emails until they request a new code.

**Resend verification code:**
```bash
# Via AWS CLI
aws cognito-idp resend-confirmation-code \
  --client-id $(terraform output -raw cognito_client_id) \
  --username testuser@amalitech.com \
  --region eu-west-1
```

Or create a new API endpoint to handle resend (optional):
```javascript
// backend/src/handlers/auth/resendCode.js
const { CognitoIdentityProviderClient, ResendConfirmationCodeCommand } = require('@aws-sdk/client-cognito-identity-provider');

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body);
  
  const command = new ResendConfirmationCodeCommand({
    ClientId: process.env.COGNITO_CLIENT_ID,
    Username: email
  });
  
  await cognitoClient.send(command);
  
  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Verification code resent' })
  };
};
```

### Issue 4: Check CloudWatch Logs

**View Cognito email sending logs:**
```bash
# Check recent log streams
aws logs tail /aws/cognito/userpool/$(terraform output -raw cognito_user_pool_id) \
  --follow \
  --region eu-west-1
```

**View SES CloudWatch metrics:**
```bash
# Check SES send events
aws logs tail /aws/ses/$(terraform output -raw project_name)-dev-config-set \
  --follow \
  --region eu-west-1
```

---

## 📊 Verification Checklist

### Pre-Deployment
- [x] ✅ Code changes applied (Cognito email_configuration added)
- [ ] 📧 Sender email verified in SES (joel.ackah@amalitech.com)
- [ ] 🔍 SES verification status = "Success"
- [ ] ✅ Terraform validation passed

### Deployment
- [ ] 📋 Terraform plan reviewed
- [ ] 🚀 Terraform apply successful
- [ ] ✅ Cognito user pool updated with email_configuration

### Testing
- [ ] 📝 Test user registered via `/auth/signup`
- [ ] 📧 Verification email received at test user's inbox
- [ ] 🔐 Email verified via `/auth/confirm`
- [ ] 🎯 Login successful via `/auth/login`

---

## 🔐 SES Configuration Details

### Current SES Setup

Your SES module includes:

1. **Email Identity**
   - Resource: `aws_ses_email_identity.sender`
   - Email: `joel.ackah@amalitech.com`
   - Domain: `amalitech.com`

2. **Configuration Set**
   - Name: `task-management-dev-config-set`
   - TLS Policy: Required
   - Event tracking: Enabled

3. **Event Destination**
   - Type: CloudWatch
   - Events tracked: send, reject, bounce, complaint, delivery

4. **IAM Policy**
   - Actions: `ses:SendEmail`, `ses:SendRawEmail`
   - Condition: Only from verified sender email

### Cognito Email Configuration

```hcl
email_configuration {
  email_sending_account = "DEVELOPER"  # Use SES instead of Cognito default
  source_arn            = "arn:aws:ses:eu-west-1:xxx:identity/joel.ackah@amalitech.com"
  from_email_address    = "joel.ackah@amalitech.com"
}
```

**Benefits:**
- ✅ Higher sending limits (vs Cognito default 50 emails/day)
- ✅ Better deliverability
- ✅ Detailed metrics and tracking
- ✅ Custom email templates (future enhancement)
- ✅ Production-ready at scale

---

## 📈 Monitoring Email Delivery

### SES Sending Statistics

```bash
# Get sending statistics
aws ses get-send-statistics --region eu-west-1

# View SES dashboard
aws ses get-account-sending-enabled --region eu-west-1
```

### CloudWatch Metrics

Monitor these metrics in CloudWatch:
- `AWS/SES` namespace:
  - `Send` - Successful email sends
  - `Delivery` - Successful deliveries
  - `Bounce` - Bounced emails
  - `Complaint` - Spam complaints
  - `Reject` - Rejected emails

```bash
# View metrics via CLI
aws cloudwatch get-metric-statistics \
  --namespace AWS/SES \
  --metric-name Send \
  --start-time $(date -u -d '1 hour ago' +%Y-%m-%dT%H:%M:%S) \
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
  --period 3600 \
  --statistics Sum \
  --region eu-west-1
```

---

## 🎯 What's Different Now?

### Before (Cognito Default Email Service)
```
User Signup
    ↓
Cognito Default Email Service
    ↓
❌ Limited to 50 emails/day
❌ No detailed metrics
❌ Poor deliverability
❌ Limited customization
```

### After (SES Integration)
```
User Signup
    ↓
Cognito → SES (joel.ackah@amalitech.com)
    ↓
✅ Higher sending limits
✅ Detailed CloudWatch metrics
✅ Better deliverability
✅ Full control over emails
✅ Production-ready
```

---

## 🎉 Success Indicators

You'll know it's working when:

1. ✅ **Terraform apply** completes without errors
2. ✅ **User registration** returns success (201)
3. ✅ **Verification email** arrives in user's inbox within 1-2 minutes
4. ✅ **Email shows** `From: joel.ackah@amalitech.com`
5. ✅ **Verification code** successfully confirms user
6. ✅ **User can login** after confirmation

---

## 🚨 Important Notes

### SES Sandbox Mode
If you're in SES sandbox:
- Can only send to **verified email addresses**
- Limit: ~200 emails per day
- **Action:** Request production access via SES console

### Email Domain Verification (Optional Enhancement)
Instead of verifying individual emails, you can verify the entire domain:

```terraform
# In modules/ses/main.tf (optional)
resource "aws_ses_domain_identity" "main" {
  domain = "amalitech.com"
}

resource "aws_route53_record" "ses_verification" {
  zone_id = var.route53_zone_id
  name    = "_amazonses.amalitech.com"
  type    = "TXT"
  ttl     = "600"
  records = [aws_ses_domain_identity.main.verification_token]
}
```

### Custom Email Templates (Future Enhancement)
You can customize verification email templates:

```bash
# Create custom template
aws ses create-template \
  --template '{
    "TemplateName": "VerificationEmail",
    "SubjectPart": "Verify your email for Task Management",
    "TextPart": "Your verification code is: {{code}}",
    "HtmlPart": "<h1>Welcome!</h1><p>Your code: <strong>{{code}}</strong></p>"
  }' \
  --region eu-west-1
```

---

## 📞 Next Steps

After successful deployment:

1. ✅ **Test thoroughly** with multiple users
2. 🔍 **Monitor SES metrics** in CloudWatch
3. 📧 **Request production access** if in sandbox
4. 🎨 **Customize email templates** (optional)
5. 📊 **Set up CloudWatch alarms** for bounces/complaints
6. 🔒 **Configure SPF/DKIM** for better deliverability

---

**Status:** ✅ Ready to deploy! Run `terraform apply` after verifying sender email.
