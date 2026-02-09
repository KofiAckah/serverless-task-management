variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "runtime" {
  description = "Lambda function runtime"
  type        = string
  default     = "nodejs18.x"
}

variable "timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "memory_size" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}

variable "allowed_email_domains" {
  description = "List of allowed email domains"
  type        = list(string)
}

variable "tasks_table_name" {
  description = "Name of the tasks DynamoDB table"
  type        = string
}

variable "tasks_table_arn" {
  description = "ARN of the tasks DynamoDB table"
  type        = string
}

variable "assignments_table_name" {
  description = "Name of the assignments DynamoDB table"
  type        = string
}

variable "assignments_table_arn" {
  description = "ARN of the assignments DynamoDB table"
  type        = string
}

variable "tasks_table_stream_arn" {
  description = "Stream ARN of the tasks table"
  type        = string
}

variable "assignments_table_stream_arn" {
  description = "Stream ARN of the assignments table"
  type        = string
}

variable "sender_email" {
  description = "Verified SES sender email address"
  type        = string
}

variable "ses_policy_arn" {
  description = "ARN of the SES send email policy"
  type        = string
}

variable "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  type        = string
}

variable "cognito_user_pool_arn" {
  description = "Cognito User Pool ARN"
  type        = string
}

variable "tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}

variable "lambda_source_dir" {
  description = "Base directory for Lambda function source code"
  type        = string
  default     = "../../backend"
}
