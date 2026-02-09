variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, stag, prod)"
  type        = string
}

variable "billing_mode" {
  description = "DynamoDB billing mode (PAY_PER_REQUEST or PROVISIONED)"
  type        = string
  default     = "PAY_PER_REQUEST"
  validation {
    condition     = contains(["PAY_PER_REQUEST", "PROVISIONED"], var.billing_mode)
    error_message = "Billing mode must be PAY_PER_REQUEST or PROVISIONED"
  }
}

variable "tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default     = {}
}

# Optional: Point-in-time recovery
variable "enable_point_in_time_recovery" {
  description = "Enable point-in-time recovery for tables"
  type        = bool
  default     = true
}

# Optional: Server-side encryption
variable "enable_encryption" {
  description = "Enable server-side encryption"
  type        = bool
  default     = true
}

# DynamoDB Streams
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
