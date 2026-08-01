provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Application = "CodeHawks"
      ManagedBy   = "Terraform"
      Purpose     = "IaC-Bootstrap"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

data "tls_certificate" "github" {
  url = "https://token.actions.githubusercontent.com/.well-known/openid-configuration"
}
