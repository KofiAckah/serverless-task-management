# Pre-Signup Lambda Outputs
output "pre_signup_function_name" {
  description = "Name of the pre-signup Lambda function"
  value       = aws_lambda_function.pre_signup.function_name
}

output "pre_signup_function_arn" {
  description = "ARN of the pre-signup Lambda function"
  value       = aws_lambda_function.pre_signup.arn
}

output "pre_signup_invoke_arn" {
  description = "Invoke ARN of the pre-signup Lambda function"
  value       = aws_lambda_function.pre_signup.invoke_arn
}

output "pre_signup_role_arn" {
  description = "ARN of the pre-signup Lambda IAM role"
  value       = aws_iam_role.pre_signup.arn
}

# Tasks Lambda Outputs
output "tasks_function_name" {
  description = "Name of the tasks Lambda function"
  value       = aws_lambda_function.tasks.function_name
}

output "tasks_function_arn" {
  description = "ARN of the tasks Lambda function"
  value       = aws_lambda_function.tasks.arn
}

output "tasks_invoke_arn" {
  description = "Invoke ARN of the tasks Lambda function (for API Gateway)"
  value       = aws_lambda_function.tasks.invoke_arn
}

output "tasks_role_arn" {
  description = "ARN of the tasks Lambda IAM role"
  value       = aws_iam_role.tasks.arn
}

# Notifications Lambda Outputs
output "notifications_function_name" {
  description = "Name of the notifications Lambda function"
  value       = aws_lambda_function.notifications.function_name
}

output "notifications_function_arn" {
  description = "ARN of the notifications Lambda function"
  value       = aws_lambda_function.notifications.arn
}

output "notifications_invoke_arn" {
  description = "Invoke ARN of the notifications Lambda function"
  value       = aws_lambda_function.notifications.invoke_arn
}

output "notifications_role_arn" {
  description = "ARN of the notifications Lambda IAM role"
  value       = aws_iam_role.notifications.arn
}

# Auth Lambda Outputs
output "signup_function_name" {
  description = "Name of the signup Lambda function"
  value       = aws_lambda_function.signup.function_name
}

output "signup_function_arn" {
  description = "ARN of the signup Lambda function"
  value       = aws_lambda_function.signup.arn
}

output "signup_invoke_arn" {
  description = "Invoke ARN of the signup Lambda function"
  value       = aws_lambda_function.signup.invoke_arn
}

output "login_function_name" {
  description = "Name of the login Lambda function"
  value       = aws_lambda_function.login.function_name
}

output "login_function_arn" {
  description = "ARN of the login Lambda function"
  value       = aws_lambda_function.login.arn
}

output "login_invoke_arn" {
  description = "Invoke ARN of the login Lambda function"
  value       = aws_lambda_function.login.invoke_arn
}

output "confirm_signup_function_name" {
  description = "Name of the confirm signup Lambda function"
  value       = aws_lambda_function.confirm_signup.function_name
}

output "confirm_signup_function_arn" {
  description = "ARN of the confirm signup Lambda function"
  value       = aws_lambda_function.confirm_signup.arn
}

output "confirm_signup_invoke_arn" {
  description = "Invoke ARN of the confirm signup Lambda function"
  value       = aws_lambda_function.confirm_signup.invoke_arn
}

output "auth_role_arn" {
  description = "ARN of the auth Lambda IAM role"
  value       = aws_iam_role.auth.arn
}

# CloudWatch Log Groups
output "log_groups" {
  description = "CloudWatch Log Group names for all Lambda functions"
  value = {
    pre_signup     = aws_cloudwatch_log_group.pre_signup.name
    tasks          = aws_cloudwatch_log_group.tasks.name
    notifications  = aws_cloudwatch_log_group.notifications.name
    signup         = aws_cloudwatch_log_group.signup.name
    login          = aws_cloudwatch_log_group.login.name
    confirm_signup = aws_cloudwatch_log_group.confirm_signup.name
  }
}
