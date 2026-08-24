variable "aws_region" {
  description = "AWS region for the S3 origin. CloudFront and its certificate are global/us-east-1 resources."
  type        = string
  default     = "us-east-1"

  validation {
    condition     = var.aws_region == "us-east-1"
    error_message = "aws_region must remain us-east-1 because CloudFront ACM certificates are regional there."
  }
}

variable "domain_name" {
  description = "Apex domain served by CloudFront."
  type        = string
  default     = "codehawks.org"

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$", var.domain_name))
    error_message = "domain_name must be a lowercase DNS hostname without a scheme, path, or trailing dot."
  }
}

variable "api_origin" {
  description = "Exact HTTPS origin of the backend API, used by the browser Content-Security-Policy."
  type        = string

  validation {
    condition     = can(regex("^https://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]{1,5})?$", var.api_origin))
    error_message = "api_origin must be an HTTPS origin only, with no path, query, fragment, or trailing slash."
  }
}

variable "media_cdn_origin" {
  description = "Exact HTTPS origin of the owned public media CDN, used by the browser Content-Security-Policy."
  type        = string

  validation {
    condition     = can(regex("^https://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]{1,5})?$", var.media_cdn_origin))
    error_message = "media_cdn_origin must be an HTTPS origin only, with no path, query, fragment, or trailing slash."
  }
}

variable "media_upload_origin" {
  description = "Exact HTTPS origin receiving presigned media uploads, used by the browser Content-Security-Policy."
  type        = string

  validation {
    condition     = can(regex("^https://[A-Za-z0-9][A-Za-z0-9.-]*(:[0-9]{1,5})?$", var.media_upload_origin))
    error_message = "media_upload_origin must be an HTTPS origin only, with no path, query, fragment, or trailing slash."
  }
}

variable "spa_paths" {
  description = "Exact client-side routes CloudFront may rewrite to index.html. Unknown paths retain a genuine 404."
  type        = set(string)
  default = [
    "/accessibility",
    "/home",
    "/manage/events",
    "/members",
    "/notifications",
    "/privacy",
    "/profile",
    "/projects",
    "/subprocessors",
    "/team",
    "/terms",
  ]

  validation {
    condition = alltrue([
      for route in var.spa_paths :
      can(regex("^/[a-z0-9]+(/[a-z0-9-]+)*$", route))
    ])
    error_message = "spa_paths entries must be lowercase extensionless absolute paths with no trailing slash, query, or fragment."
  }
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

variable "cloudflare_account_id" {
  description = "Cloudflare account identifier that owns the codehawks.org zone and account-scoped Email Routing destinations."
  type        = string
  default     = null
  nullable    = true

  validation {
    condition = (
      var.cloudflare_account_id == null ||
      can(regex("^[0-9a-f]{32}$", var.cloudflare_account_id))
    )
    error_message = "cloudflare_account_id must be a 32-character lowercase hexadecimal identifier when supplied."
  }
}

variable "email_routing_onboarding_enabled" {
  description = "Owner-reviewed gate for creating Cloudflare Email Routing DNS and the protected destination. Leave false until the onboarding plan is approved."
  type        = bool
  default     = false
}

variable "email_forwarding_rule_enabled" {
  description = "Owner-reviewed gate for creating the exact contact@ forwarding rule. Keep false until Cloudflare reports the destination verified."
  type        = bool
  default     = false
}

variable "email_forwarding_destination" {
  description = "Protected environment-supplied destination for contact@ forwarding. No personal destination belongs in Terraform defaults or source control."
  type        = string
  default     = null
  nullable    = true
  sensitive   = true

  validation {
    condition = (
      var.email_forwarding_destination == null ||
      can(regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$", var.email_forwarding_destination))
    )
    error_message = "email_forwarding_destination must be a valid email address when supplied."
  }
}

variable "github_owner" {
  description = "GitHub account that owns the frontend repository."
  type        = string
  default     = "Israel-Jauregui"
}

variable "github_owner_id" {
  description = "Immutable GitHub account ID included in OIDC subject claims."
  type        = string
  default     = "29392107"

  validation {
    condition     = can(regex("^[0-9]+$", var.github_owner_id))
    error_message = "github_owner_id must contain only digits."
  }
}

variable "frontend_repository" {
  description = "Repository allowed to assume the frontend deployment role."
  type        = string
  default     = "CodeHawks-FrontEnd"
}

variable "frontend_repository_id" {
  description = "Immutable GitHub repository ID included in OIDC subject claims."
  type        = string
  default     = "1319366708"

  validation {
    condition     = can(regex("^[0-9]+$", var.frontend_repository_id))
    error_message = "frontend_repository_id must contain only digits."
  }
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

variable "ses_dkim_tokens" {
  description = "The three Easy DKIM tokens output by CodeHawks-Backend. This domain-owning state publishes their Cloudflare CNAME records."
  type        = set(string)
  default     = []

  validation {
    condition = (
      length(var.ses_dkim_tokens) == 0 ||
      (length(var.ses_dkim_tokens) == 3 && alltrue([
        for token in var.ses_dkim_tokens : can(regex("^[a-z0-9]+$", token))
      ]))
    )
    error_message = "ses_dkim_tokens must be empty or contain exactly three lowercase alphanumeric Easy DKIM tokens."
  }
}
