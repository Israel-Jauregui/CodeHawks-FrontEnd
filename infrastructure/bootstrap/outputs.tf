output "terraform_state_bucket" {
  value       = aws_s3_bucket.terraform_state.id
  description = "Private S3 backend bucket used by both Terraform roots."
}

output "infrastructure_role_arn" {
  value       = aws_iam_role.infrastructure_apply.arn
  description = "OIDC role configured in the infrastructure production environment."
}

output "permissions_boundary_arn" {
  value       = aws_iam_policy.infrastructure_boundary.arn
  description = "Boundary required on Terraform-managed CodeHawks IAM roles."
}
