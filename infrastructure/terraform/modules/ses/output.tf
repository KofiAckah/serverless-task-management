output "ses_identity_arn" {
  description = "ARN of the SES email identity"
  value       = aws_ses_email_identity.sender.arn
}

output "verified_email" {
  description = "Verified email address for sending"
  value       = aws_ses_email_identity.sender.email
}

output "ses_configuration_set_name" {
  description = "Name of the SES configuration set"
  value       = aws_ses_configuration_set.main.name
}

output "ses_smtp_endpoint" {
  description = "SES SMTP endpoint for the region"
  value       = "email-smtp.${data.aws_region.current.id}.amazonaws.com"
}

output "ses_send_email_policy_arn" {
  description = "ARN of IAM policy for sending emails via SES"
  value       = aws_iam_policy.ses_send_email.arn
}
