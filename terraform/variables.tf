variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "af-south-1"
}

variable "aws_account_id" {
  description = "AWS account ID"
  type        = string
}

variable "alert_email" {
  description = "Email address to send alerts to"
  type        = string
}
