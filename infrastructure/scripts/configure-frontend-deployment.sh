#!/usr/bin/env bash
set -euo pipefail

owner="${GITHUB_OWNER:-Israel-Jauregui}"
frontend_repo="${owner}/CodeHawks-FrontEnd"

: "${AWS_ROLE_ARN:?Copy frontend_deploy_role_arn from the approved Terraform workflow output}"
: "${S3_BUCKET:?Copy site_bucket_name from the approved Terraform workflow output}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Copy cloudfront_distribution_id from the approved Terraform workflow output}"

aws_region="${AWS_REGION:-us-east-1}"

gh variable set AWS_REGION --repo "$frontend_repo" --env frontend-production --body "$aws_region"
gh variable set AWS_ROLE_ARN --repo "$frontend_repo" --env frontend-production --body "$AWS_ROLE_ARN"
gh variable set S3_BUCKET --repo "$frontend_repo" --env frontend-production --body "$S3_BUCKET"
gh variable set CLOUDFRONT_DISTRIBUTION_ID --repo "$frontend_repo" --env frontend-production --body "$CLOUDFRONT_DISTRIBUTION_ID"

echo "Configured deployment variables for ${frontend_repo}."
