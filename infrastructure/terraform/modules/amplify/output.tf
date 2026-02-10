/**
 * AWS Amplify Module Outputs
 */

output "app_id" {
  description = "ID of the Amplify app"
  value       = try(aws_amplify_app.frontend[0].id, "")
}

output "app_arn" {
  description = "ARN of the Amplify app"
  value       = try(aws_amplify_app.frontend[0].arn, "")
}

output "default_domain" {
  description = "Default domain of the Amplify app"
  value       = try(aws_amplify_app.frontend[0].default_domain, "")
}

output "app_url" {
  description = "URL of the deployed Amplify app"
  value       = try("https://${var.branch_name}.${aws_amplify_app.frontend[0].default_domain}", "")
}

output "branch_name" {
  description = "Name of the deployed branch"
  value       = try(aws_amplify_branch.main[0].branch_name, "")
}
