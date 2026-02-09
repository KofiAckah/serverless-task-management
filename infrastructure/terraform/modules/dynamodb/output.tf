# Tasks Table Outputs
output "tasks_table_name" {
  description = "Name of the tasks DynamoDB table"
  value       = aws_dynamodb_table.tasks.name
}

output "tasks_table_arn" {
  description = "ARN of the tasks DynamoDB table"
  value       = aws_dynamodb_table.tasks.arn
}

output "tasks_table_id" {
  description = "ID of the tasks DynamoDB table"
  value       = aws_dynamodb_table.tasks.id
}

output "tasks_table_stream_arn" {
  description = "Stream ARN of the tasks table (if enabled)"
  value       = aws_dynamodb_table.tasks.stream_arn
}

# Assignments Table Outputs
output "assignments_table_name" {
  description = "Name of the assignments DynamoDB table"
  value       = aws_dynamodb_table.assignments.name
}

output "assignments_table_arn" {
  description = "ARN of the assignments DynamoDB table"
  value       = aws_dynamodb_table.assignments.arn
}

output "assignments_table_id" {
  description = "ID of the assignments DynamoDB table"
  value       = aws_dynamodb_table.assignments.id
}

output "assignments_table_stream_arn" {
  description = "Stream ARN of the assignments table (if enabled)"
  value       = aws_dynamodb_table.assignments.stream_arn
}
