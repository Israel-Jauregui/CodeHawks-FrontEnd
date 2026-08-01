data "aws_iam_policy_document" "frontend_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [data.aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_owner}/${var.frontend_repository}:environment:${var.frontend_environment}"]
    }
  }
}

resource "aws_iam_role" "frontend_deploy" {
  name                 = "${local.resource_prefix}-frontend-deploy"
  description          = "Least-privilege GitHub Actions role for CodeHawks frontend deployments"
  assume_role_policy   = data.aws_iam_policy_document.frontend_assume_role.json
  permissions_boundary = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:policy/codehawks-infrastructure-boundary"
  max_session_duration = 3600
}

data "aws_iam_policy_document" "frontend_deploy" {
  statement {
    sid       = "ListSiteBucket"
    effect    = "Allow"
    actions   = ["s3:GetBucketLocation", "s3:ListBucket"]
    resources = [aws_s3_bucket.site.arn]
  }

  statement {
    sid    = "PublishSiteObjects"
    effect = "Allow"
    actions = [
      "s3:DeleteObject",
      "s3:GetObject",
      "s3:PutObject"
    ]
    resources = ["${aws_s3_bucket.site.arn}/*"]
  }

  statement {
    sid       = "InvalidateSiteDistribution"
    effect    = "Allow"
    actions   = ["cloudfront:CreateInvalidation"]
    resources = [aws_cloudfront_distribution.site.arn]
  }
}

resource "aws_iam_role_policy" "frontend_deploy" {
  name   = "publish-static-site"
  role   = aws_iam_role.frontend_deploy.id
  policy = data.aws_iam_policy_document.frontend_deploy.json
}
