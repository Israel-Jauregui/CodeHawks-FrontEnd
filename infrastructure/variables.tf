variable "aws_region" {
  description = "AWS region for the S3 origin. CloudFront and its certificate are global/us-east-1 resources."
  type        = string
  default     = "us-east-1"
}

variable "domain_name" {
  description = "Apex domain served by CloudFront."
  type        = string
  default     = "codehawks.org"
}

variable "cloudflare_zone_id" {
  description = "Cloudflare zone identifier for codehawks.org."
  type        = string
  sensitive   = true

  validation {
    condition     = length(var.cloudflare_zone_id) > 10
    error_message = "cloudflare_zone_id must be a valid Cloudflare zone identifier."
  }
}

variable "github_owner" {
  description = "GitHub account that owns the frontend repository."
  type        = string
  default     = "Israel-Jauregui"
}

variable "frontend_repository" {
  description = "Repository allowed to assume the frontend deployment role."
  type        = string
  default     = "CodeHawks-FrontEnd"
}

variable "frontend_environment" {
  description = "GitHub environment allowed to obtain frontend deployment credentials."
  type        = string
  default     = "frontend-production"
}

variable "budget_alert_email" {
  description = "Email address subscribed to AWS Budget notifications."
  type        = string
  sensitive   = true

  validation {
    condition     = can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.budget_alert_email))
    error_message = "budget_alert_email must be a valid email address."
  }
}

variable "monthly_budget_usd" {
  description = "Monthly cost alert threshold in USD. This is not a hard spending cap."
  type        = number
  default     = 25
}

variable "enable_flat_rate_waf" {
  description = "Create the dedicated WAF required before enrolling in CloudFront's flat-rate Free plan. Leave false while the AWS account is on its Free account plan."
  type        = bool
  default     = false
}
