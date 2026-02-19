#=============================================================================
# Amplify Module Variables
#=============================================================================

variable "project_name" {
  description = "Project name used as prefix"
  type        = string
}

variable "environment" {
  description = "Environment (dev, stag, prod)"
  type        = string
}

variable "repository_url" {
  description = "GitHub repository URL (e.g., https://github.com/username/repo)"
  type        = string
}

variable "branch_name" {
  description = "Git branch to deploy (e.g., main, develop)"
  type        = string
  default     = "main"
}

variable "api_gateway_url" {
  description = "API Gateway base URL"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_client_id" {
  description = "Cognito User Pool Client ID"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}

variable "github_access_token" {
  description = "GitHub personal access token for Amplify to access the repository"
  type        = string
  sensitive   = true
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
