#!/usr/bin/env bash
set -euo pipefail

owner="${GITHUB_OWNER:-Israel-Jauregui}"
frontend_repo="${owner}/CodeHawks-FrontEnd"

aws_region="$(terraform output -raw aws_region 2>/dev/null || printf 'us-east-1')"
role_arn="$(terraform output -raw frontend_deploy_role_arn)"
bucket="$(terraform output -raw site_bucket_name)"
distribution="$(terraform output -raw cloudfront_distribution_id)"

gh variable set AWS_REGION --repo "$frontend_repo" --env frontend-production --body "$aws_region"
gh variable set AWS_ROLE_ARN --repo "$frontend_repo" --env frontend-production --body "$role_arn"
gh variable set S3_BUCKET --repo "$frontend_repo" --env frontend-production --body "$bucket"
gh variable set CLOUDFRONT_DISTRIBUTION_ID --repo "$frontend_repo" --env frontend-production --body "$distribution"

echo "Configured deployment variables for ${frontend_repo}."
