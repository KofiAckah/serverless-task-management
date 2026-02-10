variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "allowed_email_domains" {
  description = "List of allowed email domains for signup"
  type        = list(string)
}

variable "pre_signup_lambda_arn" {
  description = "ARN of the pre-signup Lambda function"
  type        = string
  default     = null
}

variable "ses_email_identity_arn" {
  description = "ARN of the SES email identity for sending Cognito emails"
  type        = string
}

variable "sender_email" {
  description = "Sender email address for Cognito verification emails"
  type        = string
}

variable "tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}

# Cognito User Pool Configuration
variable "username_attributes" {
  description = "Attributes to use as username"
  type        = list(string)
  default     = ["email"]
}

variable "auto_verified_attributes" {
  description = "Attributes to auto-verify"
  type        = list(string)
  default     = ["email"]
}

# Password Policy
variable "password_minimum_length" {
  description = "Minimum password length"
  type        = number
  default     = 8
}

variable "password_require_lowercase" {
  description = "Require lowercase characters in password"
  type        = bool
  default     = true
}

variable "password_require_numbers" {
  description = "Require numbers in password"
  type        = bool
  default     = true
}

variable "password_require_symbols" {
  description = "Require symbols in password"
  type        = bool
  default     = true
}

variable "password_require_uppercase" {
  description = "Require uppercase characters in password"
  type        = bool
  default     = true
}

variable "temporary_password_validity_days" {
  description = "Temporary password validity in days"
  type        = number
  default     = 7
}

# User Pool Client Configuration
variable "explicit_auth_flows" {
  description = "List of authentication flows"
  type        = list(string)
  default = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]
}

variable "refresh_token_validity" {
  description = "Refresh token validity in days"
  type        = number
  default     = 30
}

variable "access_token_validity" {
  description = "Access token validity in hours"
  type        = number
  default     = 1
}

variable "id_token_validity" {
  description = "ID token validity in hours"
  type        = number
  default     = 1
}

# User Groups
variable "admin_group_name" {
  description = "Admin group name"
  type        = string
  default     = "Admin"
}

variable "admin_group_description" {
  description = "Admin group description"
  type        = string
  default     = "Admin users with full access"
}

variable "member_group_name" {
  description = "Member group name"
  type        = string
  default     = "Member"
}

variable "member_group_description" {
  description = "Member group description"
  type        = string
  default     = "Member users with limited access"
}
