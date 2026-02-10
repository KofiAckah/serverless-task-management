variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
}

variable "lambda_invoke_arn" {
  description = "Invoke ARN of the Lambda function to integrate with API Gateway"
  type        = string
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
}

variable "signup_lambda_invoke_arn" {
  description = "Invoke ARN of the signup Lambda function"
  type        = string
}

variable "signup_lambda_function_name" {
  description = "Name of the signup Lambda function"
  type        = string
}

variable "login_lambda_invoke_arn" {
  description = "Invoke ARN of the login Lambda function"
  type        = string
}

variable "login_lambda_function_name" {
  description = "Name of the login Lambda function"
  type        = string
}

variable "confirm_signup_lambda_invoke_arn" {
  description = "Invoke ARN of the confirm signup Lambda function"
  type        = string
}

variable "confirm_signup_lambda_function_name" {
  description = "Name of the confirm signup Lambda function"
  type        = string
}

variable "logout_lambda_invoke_arn" {
  description = "Invoke ARN of the logout Lambda function"
  type        = string
}

variable "logout_lambda_function_name" {
  description = "Name of the logout Lambda function"
  type        = string
}

variable "refresh_lambda_invoke_arn" {
  description = "Invoke ARN of the refresh token Lambda function"
  type        = string
}

variable "refresh_lambda_function_name" {
  description = "Name of the refresh token Lambda function"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "ARN of the Cognito User Pool for authorization"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "ID of the Cognito User Pool"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
  default     = "eu-west-1"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
