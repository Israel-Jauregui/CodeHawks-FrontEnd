# CodeHawks AWS Infrastructure

Terraform for the University of North Georgia App Development Club's static frontend. It creates a private S3 origin, CloudFront, HTTPS, Cloudflare DNS, GitHub OIDC roles, and a $25 monthly AWS Budget. Backend compute remains out of scope; this domain-owning state also publishes DKIM records for the backend-owned SES identity.

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
- `SES_DKIM_TOKENS`: the exact JSON array printed by the backend Terraform output `ses_dkim_tokens_json`

Environment secrets:

- `CLOUDFLARE_API_TOKEN`
- `TF_VAR_BUDGET_ALERT_EMAIL`

After the first frontend and Terraform CI checks have appeared in GitHub, run `./infrastructure/scripts/configure-github.sh` from the repository root as the authenticated owner. The script makes `main` PR-only, requires both checks, blocks force pushes/deletion, applies protection to the owner, makes workflow tokens read-only, and creates separate owner-approved `frontend-production` and `infrastructure-production` environments.

## 3. Apply the site

Merge infrastructure changes into `main`, start **Apply infrastructure** from the GitHub Actions page, then approve the separate `infrastructure-production` gate. Terraform creates the site and returns its deployment values. An infrastructure apply never starts automatically from a push.

Before the first apply, run **Import existing Cloudflare DNS** from the GitHub Actions page with `operation` set to `discover`, then approve the `infrastructure-production` gate. The discovery job only reads Cloudflare and prints any `A`, `AAAA`, or `CNAME` records for the apex and `www` hostnames.

- If neither hostname has an existing web record, skip the import workflow and continue with the apply.
- If each hostname has one existing record, rerun **Import existing Cloudflare DNS** with `operation` set to `import` and paste the record IDs printed by discovery. Leave an input empty when that hostname has no existing record.
- If discovery prints multiple web records for one hostname, do not import one arbitrarily. Remove any obsolete duplicate records in the Cloudflare dashboard until one intended record remains, run discovery again, and then import that record.

The import job validates that every supplied ID belongs to the expected hostname before it writes the remote Terraform state. It does not change live DNS. The later approved infrastructure apply updates the imported records only after CloudFront is ready.

The approved apply workflow prints the non-secret deployment outputs. Copy `frontend_deploy_role_arn`, `site_bucket_name`, and `cloudfront_distribution_id`, then either enter them in the `frontend-production` environment through GitHub settings or run this GitHub-only helper:

```sh
AWS_ROLE_ARN="copied-role-arn" \
S3_BUCKET="copied-bucket-name" \
CLOUDFRONT_DISTRIBUTION_ID="copied-distribution-id" \
./infrastructure/scripts/configure-frontend-deployment.sh
```

The helper only updates GitHub environment variables. It does not read Terraform state or contact AWS.

Enable **Deploy frontend** only after these variables exist. Then start it manually from GitHub Actions and approve the separate `frontend-production` gate; it builds protected `main`, uploads the static files, and invalidates CloudFront.

### SES Easy DKIM handoff

The backend and DNS use separate Terraform states. `CodeHawks-Backend` owns `aws_sesv2_email_identity`; this repository owns every Cloudflare record. On the first email deployment:

1. Apply the reviewed backend plan first and copy its `ses_dkim_tokens_json` output.
2. Set that exact three-element JSON array as `SES_DKIM_TOKENS` in this repository's `infrastructure-production` environment.
3. Run **Apply infrastructure** and approve the plan. Terraform creates three unproxied `<token>._domainkey.codehawks.org` CNAMEs pointing to `<token>.dkim.amazonses.com`.
4. Wait for AWS SES to report successful identity verification and DKIM status in the backend region.
5. The human owner requests SES production access. This account-level request is intentionally not automated by either Terraform state.

Do not add the CNAMEs by hand. A future Easy DKIM rotation should begin with a reviewed backend plan, followed by updating `SES_DKIM_TOKENS` and applying this state.

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
