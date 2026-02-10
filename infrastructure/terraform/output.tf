output "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  value       = module.cognito.user_pool_id
}

output "cognito_user_pool_client_id" {
  description = "ID of the Cognito User Pool Client"
  value       = module.cognito.client_id
}

output "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool"
  value       = module.cognito.user_pool_arn
}

output "cognito_user_pool_endpoint" {
  description = "Endpoint of the Cognito User Pool"
  value       = module.cognito.user_pool_endpoint
}

output "dynamodb_tasks_table_name" {
  description = "Name of the tasks DynamoDB table"
  value       = module.dynamodb.tasks_table_name
}

output "dynamodb_tasks_table_arn" {
  description = "ARN of the tasks DynamoDB table"
  value       = module.dynamodb.tasks_table_arn
}

output "dynamodb_assignments_table_name" {
  description = "Name of the assignments DynamoDB table"
  value       = module.dynamodb.assignments_table_name
}

output "dynamodb_assignments_table_arn" {
  description = "ARN of the assignments DynamoDB table"
  value       = module.dynamodb.assignments_table_arn
}

output "ses_sender_email_arn" {
  description = "ARN of the SES sender email identity"
  value       = module.ses.ses_identity_arn
}

output "ses_sender_email" {
  description = "Verified SES sender email address"
  value       = module.ses.verified_email
}

# API Gateway Outputs
output "api_gateway_url" {
  description = "Base URL of the API Gateway"
  value       = module.api_gateway.api_endpoint
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = module.api_gateway.api_id
}

output "api_endpoints" {
  description = "All API endpoints"
  value       = module.api_gateway.api_endpoints
}

# Amplify Outputs
output "amplify_app_id" {
  description = "ID of the Amplify app"
  value       = try(module.amplify.app_id, "Not configured")
}

output "amplify_app_url" {
  description = "URL of the deployed Amplify app"
  value       = try(module.amplify.app_url, "Not configured")
}

output "amplify_default_domain" {
  description = "Default domain of the Amplify app"
  value       = try(module.amplify.default_domain, "Not configured")
}
