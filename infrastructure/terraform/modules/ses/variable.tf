variable "sender_email" {
  description = "Email address to verify for sending notifications"
  type        = string
}

variable "allowed_email_domains" {
  description = "List of allowed email domains for validation"
  type        = list(string)
  default     = ["amalitech.com", "amalitechtraining.org"]
}

variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Common tags for resources"
  type        = map(string)
  default     = {}
}
