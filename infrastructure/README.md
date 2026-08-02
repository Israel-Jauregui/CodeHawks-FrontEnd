# CodeHawks AWS Infrastructure

Terraform for the University of North Georgia App Development Club's static frontend. It creates a private S3 origin, CloudFront, HTTPS, Cloudflare DNS, GitHub OIDC roles, and a $25 monthly AWS Budget. The backend is intentionally out of scope.

## Architecture

```text
GitHub main + owner approval
             |
             | short-lived OIDC session
             v
private S3 bucket <--- CloudFront OAC <--- HTTPS codehawks.org
                                              ^
                                              |
                                      Cloudflare DNS-only
```

There are no EC2 instances, NAT gateways, load balancers, or long-lived AWS credentials.

## Prerequisites

1. Enable MFA on the AWS root user and create an administrative IAM Identity Center permission set for setup work.
2. Install Terraform 1.10+, GitHub CLI, and `jq` for local validation and GitHub administration. A local AWS CLI/profile is intentionally not used.
3. Authenticate only to GitHub with `gh auth login`.
4. Create a Cloudflare API token restricted to **Zone Read** and **DNS Edit** for `codehawks.org` and copy the zone ID from the Cloudflare dashboard.
5. Use the existing public `Israel-Jauregui/CodeHawks-FrontEnd` repository. Application code remains at the repository root and all Terraform stays in `infrastructure/`.

## AWS mutation policy

Agents and developer machines must not run `terraform apply`, `terraform destroy`, or mutating AWS CLI commands. All ongoing AWS changes run in GitHub Actions using short-lived OIDC sessions and an owner-reviewed environment. This rule is duplicated in the repository's `AGENTS.md` so future agents see it before making changes.

## 1. Bootstrap state and GitHub OIDC

GitHub cannot use OIDC until AWS trusts GitHub, so one human-owned bootstrap action is unavoidable. The initial setup is a versioned CloudFormation stack rather than undocumented console clicks or local CLI commands:

1. Sign in to the AWS console as the administrative setup identity.
2. Open **CloudFormation → Create stack → With new resources** in `us-east-1`.
3. Upload `infrastructure/bootstrap/template.yaml` from this repository.
4. Name the stack `codehawks-bootstrap`, keep the default GitHub parameters, acknowledge named IAM resources, and create it.
5. Copy the stack outputs `TerraformStateBucketName` and `InfrastructureRoleArn` into the GitHub variables described below.

The stack creates the private/versioned Terraform state bucket, GitHub OIDC provider, permissions boundary, and infrastructure workflow role. The template is the source of truth, and retained resources prevent accidental state loss.

After this initial console creation, use only the manual, owner-approved **Update AWS bootstrap** GitHub workflow for template updates. Never create GitHub AWS access-key secrets.

## 2. Configure the infrastructure environment

Create a GitHub `infrastructure-production` environment with `Israel-Jauregui` as its required reviewer and `main` as its only deployment branch. Add:

Environment variables:

- `AWS_ROLE_ARN`: CloudFormation output `InfrastructureRoleArn`
- `TF_STATE_BUCKET`: CloudFormation output `TerraformStateBucketName`
- `CLOUDFLARE_ZONE_ID`: the Cloudflare zone ID
- `ENABLE_FLAT_RATE_WAF`: `false` while the AWS account uses its Free account plan

Environment secrets:

- `CLOUDFLARE_API_TOKEN`
- `TF_VAR_BUDGET_ALERT_EMAIL`

After the first frontend and Terraform CI checks have appeared in GitHub, run `./scripts/configure-github.sh` as the authenticated owner. The script makes `main` PR-only, requires both checks, blocks force pushes/deletion, applies protection to the owner, makes workflow tokens read-only, and creates separate owner-approved `frontend-production` and `infrastructure-production` environments.

## 3. Apply the site

Merge infrastructure changes into `main`, start **Apply infrastructure** from the GitHub Actions page, then approve the separate `infrastructure-production` gate. Terraform creates the site and returns its deployment values. An infrastructure apply never starts automatically from a push.

If Cloudflare already has apex or `www` records for the old VPS, import those records into `cloudflare_dns_record.apex` and `cloudflare_dns_record.www` before the first apply. This allows Terraform to update them only after CloudFront is ready instead of failing because the records already exist.

The approved apply workflow prints the non-secret deployment outputs. Copy `frontend_deploy_role_arn`, `site_bucket_name`, and `cloudfront_distribution_id`, then either enter them in the `frontend-production` environment through GitHub settings or run this GitHub-only helper:

```sh
AWS_ROLE_ARN="copied-role-arn" \
S3_BUCKET="copied-bucket-name" \
CLOUDFRONT_DISTRIBUTION_ID="copied-distribution-id" \
./scripts/configure-frontend-deployment.sh
```

The helper only updates GitHub environment variables. It does not read Terraform state or contact AWS.

The frontend's next merge to `main` will build, request Israel's `frontend-production` approval, upload the static files, and invalidate CloudFront.

## 4. Move from the AWS Free account plan to durable production

The AWS Free account plan expires after six months or when credits run out. Before treating the site as permanent production:

1. Upgrade the AWS account to the paid plan. Eligible unused credits remain usable until their normal expiration.
2. Change `ENABLE_FLAT_RATE_WAF` to `true` and approve one infrastructure apply.
3. In the CloudFront console, attach the distribution to the **Free ($0/month)** flat-rate plan. AWS currently exposes this subscription as a console operation rather than a Terraform resource.
4. Confirm the dedicated WAF and distribution are shown as covered by the plan.

The CloudFront Free plan currently includes 100 GB transfer and one million requests monthly without overage fees. The Terraform-managed AWS Budget still alerts at 50%, 80%, and 100% of $25 for charges outside the plan.

## Verification and rollback

```sh
curl -I https://codehawks.org
curl -I https://www.codehawks.org
curl -I https://codehawks.org/projects
```

Expected results: HTTPS succeeds, HTTP redirects, deep SPA paths return the application, and direct anonymous S3 requests return `AccessDenied`.

Rollback by reverting the frontend commit on `main` and approving the resulting production deployment. S3 versioning retains prior objects for 30 days, but Git remains the source of truth.

## Destruction safety

CloudFront and the site bucket use Terraform `prevent_destroy`; the CloudFormation state bucket and permissions boundary use `DeletionPolicy: Retain`. A deliberate teardown must first cancel any CloudFront flat-rate plan in the AWS console, empty object versions, explicitly remove those guards through reviewed code, and use the approved workflows. Never delete the state bucket before every Terraform-managed resource is gone.
