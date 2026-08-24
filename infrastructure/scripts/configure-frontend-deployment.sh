#!/usr/bin/env bash
set -euo pipefail

owner="${GITHUB_OWNER:-Israel-Jauregui}"
frontend_repo="${owner}/CodeHawks-FrontEnd"

: "${AWS_ROLE_ARN:?Copy frontend_deploy_role_arn from the approved Terraform workflow output}"
: "${S3_BUCKET:?Copy site_bucket_name from the approved Terraform workflow output}"
: "${CLOUDFRONT_DISTRIBUTION_ID:?Copy cloudfront_distribution_id from the approved Terraform workflow output}"

aws_region="${AWS_REGION:-us-east-1}"

if [[ ! "$AWS_ROLE_ARN" =~ ^arn:aws:iam::([0-9]{12}):role/codehawks-frontend-deploy$ ]]; then
  echo "AWS_ROLE_ARN must be the exact codehawks-frontend-deploy role ARN." >&2
  exit 1
fi
aws_account_id="${BASH_REMATCH[1]}"

if [[ "$S3_BUCKET" != "codehawks-frontend-${aws_account_id}" ]]; then
  echo "S3_BUCKET does not match the deployment role's AWS account." >&2
  exit 1
fi

gh variable set AWS_REGION --repo "$frontend_repo" --env frontend-production --body "$aws_region"
gh variable set AWS_ACCOUNT_ID --repo "$frontend_repo" --env frontend-production --body "$aws_account_id"
gh variable set AWS_ROLE_ARN --repo "$frontend_repo" --env frontend-production --body "$AWS_ROLE_ARN"
gh variable set S3_BUCKET --repo "$frontend_repo" --env frontend-production --body "$S3_BUCKET"
gh variable set CLOUDFRONT_DISTRIBUTION_ID --repo "$frontend_repo" --env frontend-production --body "$CLOUDFRONT_DISTRIBUTION_ID"

echo "Configured deployment variables for ${frontend_repo}."
