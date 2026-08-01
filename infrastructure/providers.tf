provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

# Authentication is read from CLOUDFLARE_API_TOKEN. The token should be
# restricted to Zone Read and DNS Edit for codehawks.org.
provider "cloudflare" {}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

data "aws_iam_openid_connect_provider" "github" {
  url = "https://token.actions.githubusercontent.com"
}

data "aws_cloudfront_cache_policy" "optimized" {
  name = "Managed-CachingOptimized"
}
