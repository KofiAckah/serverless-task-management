#=============================================================================
# Amplify Module Outputs
#=============================================================================

output "app_id" {
  description = "Amplify App ID"
  value       = aws_amplify_app.frontend.id
}

output "app_arn" {
  description = "Amplify App ARN"
  value       = aws_amplify_app.frontend.arn
}

output "default_domain" {
  description = "Default Amplify domain"
  value       = aws_amplify_app.frontend.default_domain
}

output "app_url" {
  description = "Full Amplify App URL"
  value       = "https://${var.branch_name}.${aws_amplify_app.frontend.default_domain}"
}

output "branch_name" {
  description = "Deployed branch name"
  value       = aws_amplify_branch.main.branch_name
}

output "iam_role_arn" {
  description = "IAM role ARN for Amplify"
  value       = aws_iam_role.amplify.arn
}
