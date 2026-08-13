output "site_url" {
  description = "Canonical production URL."
  value       = "https://${var.domain_name}"
}

output "aws_region" {
  description = "Region expected by the frontend deployment workflow."
  value       = var.aws_region
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
