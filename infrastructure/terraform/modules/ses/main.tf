# Get current AWS region
data "aws_region" "current" {}

# SES Email Identity Verification (NO RESTRICTIONS)
resource "aws_ses_email_identity" "sender" {
  email = var.sender_email
}

# SES Email Identity Verification (optional: domain-based)
# Uncomment if you want to verify entire domain instead of individual email
# resource "aws_ses_domain_identity" "main" {
#   domain = "amalitech.com"
# }

# Configuration Set for tracking (optional but recommended)
resource "aws_ses_configuration_set" "main" {
  name = "${var.project_name}-${var.environment}-config-set"

  delivery_options {
    tls_policy = "Require"
  }
}

# Event destination for bounce/complaint tracking (optional)
resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "${var.project_name}-${var.environment}-cloudwatch"
  configuration_set_name = aws_ses_configuration_set.main.name
  enabled                = true
  matching_types         = ["send", "reject", "bounce", "complaint", "delivery"]

  cloudwatch_destination {
    default_value  = "default"
    dimension_name = "ses:configuration-set"
    value_source   = "messageTag"
  }
}


# IAM Policy Document for Lambda to send emails via SES
data "aws_iam_policy_document" "ses_send_email" {
  statement {
    sid    = "AllowSESSendEmail"
    effect = "Allow"

    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail"
    ]

    resources = [
      aws_ses_email_identity.sender.arn
    ]

    condition {
      test     = "StringEquals"
      variable = "ses:FromAddress"
      values   = [var.sender_email]
    }
  }
}

# Create IAM policy
resource "aws_iam_policy" "ses_send_email" {
  name        = "${var.project_name}-${var.environment}-ses-send-email"
  description = "Allow Lambda functions to send emails via SES"
  policy      = data.aws_iam_policy_document.ses_send_email.json

  tags = var.tags
}
