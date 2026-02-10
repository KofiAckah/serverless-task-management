# AWS Provider Configuration Variables
variable "aws_region" {
  description = "The AWS region to deploy resources in"
  type        = string
  default     = "eu-west-1"
}

# General Variables
variable "project_name" {
  description = "Project name used as prefix for all resources"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, stag, prod)"
  type        = string
  validation {
    condition     = contains(["dev", "stag", "prod"], var.environment)
    error_message = "Environment must be dev, stag, or prod"
  }
}

# Authentication Variables
variable "allowed_email_domains" {
  description = "List of allowed email domains for user signup"
  type        = list(string)
  default     = ["amalitech.com", "amalitechtraining.org"]
}

# Notification Variables
variable "sender_email" {
  description = "Verified email address for sending notifications via SES"
  type        = string
}

# DynamoDB Variables
variable "dynamodb_billing_mode" {
  description = "DynamoDB billing mode"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.dynamodb_billing_mode)
    error_message = "Billing mode must be PAY_PER_REQUEST or PROVISIONED"
  }
}

# Lambda Variables
variable "lambda_runtime" {
  description = "Lambda function runtime"
  type        = string
  default     = "nodejs18.x"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}

# API Gateway Variables
variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 100
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit"
  type        = number
  default     = 50
}

# Tags
variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

variable "enable_streams" {
  description = "Enable DynamoDB streams for change data capture"
  type        = bool
  default     = true
}

variable "stream_view_type" {
  description = "Stream view type (NEW_IMAGE, OLD_IMAGE, NEW_AND_OLD_IMAGES, KEYS_ONLY)"
  type        = string
  default     = "NEW_AND_OLD_IMAGES"
  validation {
    condition     = contains(["NEW_IMAGE", "OLD_IMAGE", "NEW_AND_OLD_IMAGES", "KEYS_ONLY"], var.stream_view_type)
    error_message = "Invalid stream view type"
  }
}

# Amplify Variables
variable "github_repository" {
  description = "GitHub repository URL for Amplify hosting"
  type        = string
  default     = ""
}

variable "github_branch" {
  description = "GitHub branch to deploy from Amplify"
  type        = string
  default     = "main"
}

variable "github_access_token" {
  description = "GitHub personal access token for Amplify to access the repository"
  type        = string
  sensitive   = true
  default     = ""
}

variable "enable_amplify_auto_build" {
  description = "Enable automatic builds in Amplify on code push"
  type        = bool
  default     = true
}
