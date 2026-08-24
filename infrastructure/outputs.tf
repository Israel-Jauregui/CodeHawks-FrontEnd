output "site_url" {
  description = "Canonical production URL."
  value       = "https://${var.domain_name}"
}

output "aws_region" {
  description = "Region expected by the frontend deployment workflow."
  value       = var.aws_region
}

output "aws_account_id" {
  description = "AWS account expected by protected deployment workflow validation."
  value       = data.aws_caller_identity.current.account_id
}

output "site_bucket_name" {
  description = "Private bucket populated by the frontend workflow."
  value       = aws_s3_bucket.site.id
}

output "cloudfront_distribution_id" {
  description = "Distribution invalidated after frontend deployments."
  value       = aws_cloudfront_distribution.site.id
}

output "cloudfront_domain_name" {
  description = "CloudFront hostname used by Cloudflare CNAME records."
  value       = aws_cloudfront_distribution.site.domain_name
}

output "frontend_deploy_role_arn" {
  description = "OIDC role configured in the frontend production environment."
  value       = aws_iam_role.frontend_deploy.arn
}

output "ses_dkim_record_names" {
  description = "Cloudflare DNS names published for the backend-owned SES identity."
  value       = sort([for record in cloudflare_dns_record.ses_dkim : record.name])
}

output "dmarc_record_name" {
  description = "Monitoring-only DMARC TXT record published for the club domain."
  value       = cloudflare_dns_record.dmarc.name
}

output "email_routing_source_address" {
  description = "Only this exact inbound address may be forwarded by the managed Cloudflare rule."
  value       = local.contact_address
}

output "email_routing_onboarding_enabled" {
  description = "Whether Terraform owns Cloudflare Email Routing DNS and the protected destination."
  value       = var.email_routing_onboarding_enabled
}

output "email_forwarding_rule_enabled" {
  description = "Whether the exact contact address forwarding rule is present and enabled."
  value       = var.email_forwarding_rule_enabled
}

output "email_forwarding_destination_verified" {
  description = "Whether Cloudflare reports the protected destination verified; the destination itself is never output."
  value = (
    var.email_routing_onboarding_enabled ?
    cloudflare_email_routing_address.contact[0].verified != null :
    false
  )
}
