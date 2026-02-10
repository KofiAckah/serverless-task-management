/**
 * AWS Amplify Module Variables
 */

variable "app_name" {
  description = "Name of the Amplify app"
  type        = string
}

variable "repository" {
  description = "GitHub repository URL (format: https://github.com/username/repo)"
  type        = string
  default     = ""
}

variable "branch_name" {
  description = "Git branch to deploy"
  type        = string
  default     = "main"
}

variable "github_access_token" {
  description = "GitHub personal access token for repository access"
  type        = string
  sensitive   = true
  default     = ""
}

variable "environment_variables" {
  description = "Environment variables for the Amplify app"
  type        = map(string)
  default     = {}
}

variable "branch_environment_variables" {
  description = "Environment variables specific to the branch"
  type        = map(string)
  default     = {}
}

variable "enable_auto_build" {
  description = "Enable automatic builds on code push"
  type        = bool
  default     = true
}

variable "framework" {
  description = "Frontend framework"
  type        = string
  default     = "React"
}

variable "domain_name" {
  description = "Custom domain name (optional)"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
