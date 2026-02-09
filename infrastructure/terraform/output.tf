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

output "tasks_table_name" {
  description = "Name of the tasks DynamoDB table"
  value       = module.dynamodb.tasks_table_name
}

output "tasks_table_arn" {
  description = "ARN of the tasks DynamoDB table"
  value       = module.dynamodb.tasks_table_arn
}

output "assignments_table_name" {
  description = "Name of the assignments DynamoDB table"
  value       = module.dynamodb.assignments_table_name
}

output "assignments_table_arn" {
  description = "ARN of the assignments DynamoDB table"
  value       = module.dynamodb.assignments_table_arn
}
