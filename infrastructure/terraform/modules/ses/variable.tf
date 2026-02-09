variable "sender_email" {
  description = "The email address to verify in SES for sending notifications"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
