output "api_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.id
}

output "api_arn" {
  description = "ARN of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.main.arn
}

output "api_endpoint" {
  description = "Base URL of the API Gateway endpoint"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "api_stage_name" {
  description = "Name of the API Gateway stage"
  value       = aws_api_gateway_stage.main.stage_name
}

output "api_execution_arn" {
  description = "Execution ARN of the API Gateway"
  value       = aws_api_gateway_rest_api.main.execution_arn
}

output "authorizer_id" {
  description = "ID of the Cognito authorizer"
  value       = aws_api_gateway_authorizer.cognito.id
}

output "api_endpoints" {
  description = "Complete API endpoints for all routes"
  value = {
    create_task        = "${aws_api_gateway_stage.main.invoke_url}/tasks"
    get_tasks          = "${aws_api_gateway_stage.main.invoke_url}/tasks"
    get_assigned_tasks = "${aws_api_gateway_stage.main.invoke_url}/tasks/assigned"
    update_task        = "${aws_api_gateway_stage.main.invoke_url}/tasks/{taskId}"
    assign_task        = "${aws_api_gateway_stage.main.invoke_url}/tasks/{taskId}/assign"
    close_task         = "${aws_api_gateway_stage.main.invoke_url}/tasks/{taskId}/close"
  }
}

output "cloudwatch_log_group" {
  description = "CloudWatch Log Group name for API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway.name
}
