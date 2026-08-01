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
2. Install Terraform 1.10+, AWS CLI v2, GitHub CLI, and `jq`.
3. Authenticate locally with `aws configure sso` / `aws sso login` and `gh auth login`.
4. Create a Cloudflare API token restricted to **Zone Read** and **DNS Edit** for `codehawks.org` and copy the zone ID from the Cloudflare dashboard.
5. Use the existing public `Israel-Jauregui/CodeHawks-FrontEnd` repository. Application code remains at the repository root and all Terraform stays in `infrastructure/`.

## 1. Bootstrap state and GitHub OIDC

The bootstrap is the only apply performed with your local administrator session. It creates the private state bucket, GitHub OIDC provider, permissions boundary, and infrastructure workflow role.

```sh
cd bootstrap
terraform init -backend=false
terraform apply
```

Record the outputs, then migrate the bootstrap state into its new bucket:

```sh
state_bucket="$(terraform output -raw terraform_state_bucket)"
terraform init -migrate-state -backend-config="bucket=${state_bucket}"
```

Do not commit local state. Both the state bucket and permissions boundary have `prevent_destroy` enabled.

## 2. Configure the infrastructure environment

Create a GitHub `infrastructure-production` environment with `Israel-Jauregui` as its required reviewer and `main` as its only deployment branch. Add:

Environment variables:

- `AWS_ROLE_ARN`: bootstrap output `infrastructure_role_arn`
- `TF_STATE_BUCKET`: bootstrap output `terraform_state_bucket`
- `CLOUDFLARE_ZONE_ID`: the Cloudflare zone ID
- `ENABLE_FLAT_RATE_WAF`: `false` while the AWS account uses its Free account plan

Environment secrets:

- `CLOUDFLARE_API_TOKEN`
- `TF_VAR_BUDGET_ALERT_EMAIL`

After the first frontend and Terraform CI checks have appeared in GitHub, run `./scripts/configure-github.sh` as the authenticated owner. The script makes `main` PR-only, requires both checks, blocks force pushes/deletion, applies protection to the owner, makes workflow tokens read-only, and creates separate owner-approved `frontend-production` and `infrastructure-production` environments.

## 3. Apply the site

Merge infrastructure changes into `main`, start **Apply infrastructure** from the GitHub Actions page, then approve the separate `infrastructure-production` gate. Terraform creates the site and returns its deployment values. An infrastructure apply never starts automatically from a push.

If Cloudflare already has apex or `www` records for the old VPS, import those records into `cloudflare_dns_record.apex` and `cloudflare_dns_record.www` before the first apply. This allows Terraform to update them only after CloudFront is ready instead of failing because the records already exist.

Run the following locally with the remote backend initialized, or run it from an authenticated checkout after the workflow apply:

```sh
./scripts/configure-frontend-deployment.sh
```

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

CloudFront and both S3 buckets are protected against accidental Terraform destruction. A deliberate teardown must first cancel any CloudFront flat-rate plan in the AWS console, empty all object versions, remove `prevent_destroy`, and then destroy the stacks. Never delete the state bucket before all other resources are gone.
