locals {
  prefix            = "codehawks"
  state_bucket_name = "${local.prefix}-terraform-state-${data.aws_caller_identity.current.account_id}"
  boundary_name     = "${local.prefix}-infrastructure-boundary"
  role_name         = "${local.prefix}-infrastructure-apply"
}

resource "aws_s3_bucket" "terraform_state" {
  bucket = local.state_bucket_name

  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_s3_bucket_public_access_block" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_versioning" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "terraform_state" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    id     = "expire-old-state-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }

  depends_on = [aws_s3_bucket_versioning.terraform_state]
}

resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = [data.tls_certificate.github.certificates[length(data.tls_certificate.github.certificates) - 1].sha1_fingerprint]
}

data "aws_iam_policy_document" "boundary" {
  statement {
    sid    = "ManageCodeHawksStorage"
    effect = "Allow"
    actions = [
      "s3:*"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:s3:::codehawks-*",
      "arn:${data.aws_partition.current.partition}:s3:::codehawks-*/*"
    ]
  }

  statement {
    sid    = "ManageFrontendEdgeAndCostResources"
    effect = "Allow"
    actions = [
      "acm:*",
      "budgets:*",
      "cloudfront:*",
      "wafv2:*"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ManageCodeHawksRoles"
    effect = "Allow"
    actions = [
      "iam:CreateRole",
      "iam:DeleteRole",
      "iam:GetRole",
      "iam:ListRolePolicies",
      "iam:PassRole",
      "iam:PutRolePolicy",
      "iam:GetRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:UpdateRoleDescription"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/codehawks-*"
    ]
  }

  statement {
    sid       = "ReadGitHubIdentityProvider"
    effect    = "Allow"
    actions   = ["iam:GetOpenIDConnectProvider"]
    resources = [aws_iam_openid_connect_provider.github.arn]
  }
}

resource "aws_iam_policy" "infrastructure_boundary" {
  name        = local.boundary_name
  description = "Maximum permissions available to CodeHawks infrastructure roles"
  policy      = data.aws_iam_policy_document.boundary.json

  lifecycle {
    prevent_destroy = true
  }
}

data "aws_iam_policy_document" "infrastructure_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_owner}/${var.infrastructure_repository}:environment:${var.infrastructure_environment}"]
    }
  }
}

resource "aws_iam_role" "infrastructure_apply" {
  name                 = local.role_name
  description          = "GitHub Actions OIDC role for the CodeHawks Terraform repository"
  assume_role_policy   = data.aws_iam_policy_document.infrastructure_assume_role.json
  permissions_boundary = aws_iam_policy.infrastructure_boundary.arn
  max_session_duration = 3600
}

data "aws_iam_policy_document" "infrastructure_apply" {
  statement {
    sid     = "ManageCodeHawksStorage"
    effect  = "Allow"
    actions = ["s3:*"]
    resources = [
      "arn:${data.aws_partition.current.partition}:s3:::codehawks-*",
      "arn:${data.aws_partition.current.partition}:s3:::codehawks-*/*"
    ]
  }

  statement {
    sid    = "ManageFrontendEdgeAndCostResources"
    effect = "Allow"
    actions = [
      "acm:*",
      "budgets:*",
      "cloudfront:*",
      "wafv2:*"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "CreateBoundedCodeHawksRoles"
    effect = "Allow"
    actions = [
      "iam:CreateRole"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/codehawks-*"
    ]

    condition {
      test     = "StringEquals"
      variable = "iam:PermissionsBoundary"
      values   = [aws_iam_policy.infrastructure_boundary.arn]
    }
  }

  statement {
    sid    = "ManageExistingCodeHawksRoles"
    effect = "Allow"
    actions = [
      "iam:DeleteRole",
      "iam:GetRole",
      "iam:ListRolePolicies",
      "iam:PassRole",
      "iam:PutRolePolicy",
      "iam:GetRolePolicy",
      "iam:DeleteRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:UpdateAssumeRolePolicy",
      "iam:UpdateRoleDescription"
    ]
    resources = [
      "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/codehawks-*"
    ]
  }

  statement {
    sid       = "ReadGitHubIdentityProvider"
    effect    = "Allow"
    actions   = ["iam:GetOpenIDConnectProvider"]
    resources = [aws_iam_openid_connect_provider.github.arn]
  }
}

resource "aws_iam_role_policy" "infrastructure_apply" {
  name   = "manage-codehawks-infrastructure"
  role   = aws_iam_role.infrastructure_apply.id
  policy = data.aws_iam_policy_document.infrastructure_apply.json
}
