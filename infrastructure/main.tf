locals {
  resource_prefix = "codehawks"
  bucket_name     = "${local.resource_prefix}-frontend-${data.aws_caller_identity.current.account_id}"
  www_domain      = "www.${var.domain_name}"
  contact_address = "contact@${var.domain_name}"
  content_security_policy = join(" ", [
    "default-src 'self';",
    "base-uri 'none';",
    "connect-src 'self' ${var.api_origin} ${var.media_upload_origin} https://login.microsoftonline.com;",
    "font-src 'self' data:;",
    "form-action 'self';",
    "frame-ancestors 'self';",
    "frame-src 'self' https://login.microsoftonline.com;",
    "img-src 'self' data: blob: ${var.media_cdn_origin};",
    "manifest-src 'self';",
    "object-src 'none';",
    "script-src 'self';",
    "style-src 'self' 'unsafe-inline';",
    "worker-src 'self' blob:;",
    "upgrade-insecure-requests",
  ])
  permissions_policy = join(", ", [
    "accelerometer=()",
    "autoplay=()",
    "camera=()",
    "display-capture=()",
    "encrypted-media=()",
    "fullscreen=(self)",
    "geolocation=()",
    "gyroscope=()",
    "magnetometer=()",
    "microphone=()",
    "payment=()",
    "publickey-credentials-get=(self)",
    "usb=()",
  ])
  common_tags = {
    Application = "CodeHawks"
    Environment = "production"
    ManagedBy   = "Terraform"
    Owner       = "UNG-App-Development-Club"
  }
}

check "email_routing_inputs" {
  assert {
    condition = (
      !var.email_routing_onboarding_enabled ||
      (var.cloudflare_account_id != null && var.email_forwarding_destination != null)
    )
    error_message = "Email Routing onboarding requires protected Cloudflare account ID and destination values."
  }

  assert {
    condition     = !var.email_forwarding_rule_enabled || var.email_routing_onboarding_enabled
    error_message = "The contact forwarding rule cannot be enabled before Email Routing onboarding remains enabled."
  }
}

resource "aws_s3_bucket" "site" {
  bucket = local.bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "site" {
  bucket = aws_s3_bucket.site.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "site" {
  bucket = aws_s3_bucket.site.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "site" {
  bucket = aws_s3_bucket.site.id

  rule {
    id     = "remove-old-deployments"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }

  depends_on = [aws_s3_bucket_versioning.site]
}

resource "aws_acm_certificate" "site" {
  domain_name               = var.domain_name
  subject_alternative_names = [local.www_domain]
  validation_method         = "DNS"

  lifecycle {
    create_before_destroy = true
  }
}

resource "cloudflare_dns_record" "certificate_validation" {
  for_each = {
    for domain_name in [var.domain_name, local.www_domain] : domain_name => {
      name = trimsuffix(one([
        for option in aws_acm_certificate.site.domain_validation_options : option.resource_record_name
        if option.domain_name == domain_name
      ]), ".")
      type = one([
        for option in aws_acm_certificate.site.domain_validation_options : option.resource_record_type
        if option.domain_name == domain_name
      ])
      value = trimsuffix(one([
        for option in aws_acm_certificate.site.domain_validation_options : option.resource_record_value
        if option.domain_name == domain_name
      ]), ".")
    }
  }

  zone_id = var.cloudflare_zone_id
  name    = each.value.name
  type    = each.value.type
  content = each.value.value
  ttl     = 60
  proxied = false
  comment = "Managed by CodeHawks Terraform for ACM validation"
}

resource "aws_acm_certificate_validation" "site" {
  certificate_arn = aws_acm_certificate.site.arn
  validation_record_fqdns = [
    for record in cloudflare_dns_record.certificate_validation : record.name
  ]
}

resource "cloudflare_dns_record" "ses_dkim" {
  for_each = var.ses_dkim_tokens

  zone_id = var.cloudflare_zone_id
  name    = "${each.value}._domainkey.${var.domain_name}"
  type    = "CNAME"
  content = "${each.value}.dkim.amazonses.com"
  ttl     = 60
  proxied = false
  comment = "Managed by CodeHawks Terraform for Amazon SES Easy DKIM"
}

resource "cloudflare_dns_record" "dmarc" {
  zone_id = var.cloudflare_zone_id
  name    = "_dmarc.${var.domain_name}"
  type    = "TXT"
  content = "v=DMARC1; p=none; adkim=r; aspf=r; pct=100"
  ttl     = 3600
  proxied = false
  comment = "Monitoring-only DMARC policy managed by CodeHawks Terraform"
}

# Cloudflare owns and locks its inbound MX/SPF/routing-DKIM records after this
# resource is approved. It deliberately does not replace the SES Easy DKIM or
# monitoring-only DMARC resources above.
resource "cloudflare_email_routing_dns" "contact" {
  count = var.email_routing_onboarding_enabled ? 1 : 0

  zone_id = var.cloudflare_zone_id

  # Leave the optional name unset for zone-apex onboarding. Cloudflare treats
  # a populated name as a subdomain selector and rejects the apex domain.

  lifecycle {
    prevent_destroy = true
  }
}

resource "cloudflare_email_routing_address" "contact" {
  count = var.email_routing_onboarding_enabled ? 1 : 0

  account_id = var.cloudflare_account_id
  email      = var.email_forwarding_destination
}

# Cloudflare accepts exactly one verified destination per ordinary forward
# action. Terraform does not create this rule at all until the second explicit
# owner gate is enabled after mailbox verification.
resource "cloudflare_email_routing_rule" "contact" {
  count = var.email_forwarding_rule_enabled ? 1 : 0

  zone_id = var.cloudflare_zone_id
  name    = "Forward exact CodeHawks contact address"
  enabled = true
  source  = "api"

  actions = [{
    type  = "forward"
    value = [cloudflare_email_routing_address.contact[0].email]
  }]

  matchers = [{
    type  = "literal"
    field = "to"
    value = local.contact_address
  }]

  lifecycle {
    precondition {
      condition     = cloudflare_email_routing_address.contact[0].verified != null
      error_message = "Cloudflare must report the protected destination verified before the contact forwarding rule can be created."
    }
  }

  depends_on = [cloudflare_email_routing_dns.contact]
}

resource "aws_cloudfront_origin_access_control" "site" {
  name                              = "${local.resource_prefix}-site-oac"
  description                       = "Allow only CodeHawks CloudFront to read the private site bucket"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_function" "request_router" {
  name    = "${local.resource_prefix}-request-router"
  runtime = "cloudfront-js-2.0"
  comment = "Canonicalize www and rewrite only approved CodeHawks SPA paths"
  publish = true
  code = templatefile("${path.module}/functions/request-router.js.tftpl", {
    canonical_host = var.domain_name
    spa_paths_json = jsonencode(sort(tolist(var.spa_paths)))
  })
}

resource "aws_cloudfront_response_headers_policy" "security" {
  name = "${local.resource_prefix}-security-headers"

  custom_headers_config {
    items {
      header   = "Permissions-Policy"
      override = true
      value    = local.permissions_policy
    }
  }

  security_headers_config {
    content_security_policy {
      content_security_policy = local.content_security_policy
      override                = true
    }

    content_type_options {
      override = true
    }

    frame_options {
      frame_option = "SAMEORIGIN"
      override     = true
    }

    referrer_policy {
      referrer_policy = "strict-origin-when-cross-origin"
      override        = true
    }

    strict_transport_security {
      access_control_max_age_sec = 31536000
      include_subdomains         = true
      preload                    = false
      override                   = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }
  }
}

resource "aws_wafv2_web_acl" "site" {
  count = var.enable_flat_rate_waf ? 1 : 0

  name  = "${local.resource_prefix}-site"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "per-ip-rate-limit"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        aggregate_key_type = "IP"
        limit              = 2000
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CodeHawksIpRateLimit"
      sampled_requests_enabled   = false
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "CodeHawksSite"
    sampled_requests_enabled   = false
  }
}

resource "aws_cloudfront_distribution" "site" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "CodeHawks static frontend"
  default_root_object = "index.html"
  aliases             = [var.domain_name, local.www_domain]
  price_class         = "PriceClass_100"
  web_acl_id          = var.enable_flat_rate_waf ? aws_wafv2_web_acl.site[0].arn : null

  origin {
    domain_name              = aws_s3_bucket.site.bucket_regional_domain_name
    origin_id                = "private-s3-site"
    origin_access_control_id = aws_cloudfront_origin_access_control.site.id
  }

  default_cache_behavior {
    allowed_methods            = ["GET", "HEAD", "OPTIONS"]
    cached_methods             = ["GET", "HEAD", "OPTIONS"]
    target_origin_id           = "private-s3-site"
    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = data.aws_cloudfront_cache_policy.optimized.id
    response_headers_policy_id = aws_cloudfront_response_headers_policy.security.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.request_router.arn
    }
  }

  custom_error_response {
    error_code            = 403
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 500
    response_code         = 500
    response_page_path    = "/500.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 502
    response_code         = 502
    response_page_path    = "/500.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 503
    response_code         = 503
    response_page_path    = "/500.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 504
    response_code         = 504
    response_page_path    = "/500.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    acm_certificate_arn      = aws_acm_certificate_validation.site.certificate_arn
    minimum_protocol_version = "TLSv1.2_2021"
    ssl_support_method       = "sni-only"
  }

  lifecycle {
    prevent_destroy = true
  }
}

data "aws_iam_policy_document" "site_bucket" {
  statement {
    sid     = "AllowCloudFrontReadOnly"
    effect  = "Allow"
    actions = ["s3:GetObject"]
    resources = [
      "${aws_s3_bucket.site.arn}/*"
    ]

    principals {
      type        = "Service"
      identifiers = ["cloudfront.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = [aws_cloudfront_distribution.site.arn]
    }
  }
}

resource "aws_s3_bucket_policy" "site" {
  bucket = aws_s3_bucket.site.id
  policy = data.aws_iam_policy_document.site_bucket.json
}

resource "cloudflare_dns_record" "apex" {
  zone_id = var.cloudflare_zone_id
  name    = var.domain_name
  type    = "CNAME"
  content = aws_cloudfront_distribution.site.domain_name
  ttl     = 60
  proxied = false
  comment = "CodeHawks production frontend managed by Terraform"
}

resource "cloudflare_dns_record" "www" {
  zone_id = var.cloudflare_zone_id
  name    = local.www_domain
  type    = "CNAME"
  content = aws_cloudfront_distribution.site.domain_name
  ttl     = 60
  proxied = false
  comment = "CodeHawks production frontend managed by Terraform"
}
