# CodeHawks AWS Infrastructure

Terraform for the University of North Georgia App Development Club's static frontend. It creates a private S3 origin, CloudFront, HTTPS, Cloudflare DNS, receive-only Email Routing, GitHub OIDC roles, and a $25 monthly AWS Budget. Backend compute remains out of scope; this domain-owning state also publishes DKIM records for the backend-owned SES identity.

## Architecture

```text
protected main + infrastructure-production approval
                         |
                         | short-lived OIDC; routine role cannot edit itself
                         v
private S3 bucket <--- CloudFront OAC <--- HTTPS codehawks.org
                                              ^
                                              |
                                      Cloudflare DNS-only

protected main + bootstrap-production approval
                         |
                         v
exact-stack update role ---> CloudFormation-only bootstrap service role
```

There are no EC2 instances, NAT gateways, load balancers, or long-lived AWS
credentials. The IAM split and enforced invariants are documented in
[`bootstrap/PERMISSIONS.md`](bootstrap/PERMISSIONS.md).

## Prerequisites

1. Enable MFA on the AWS root user and create an administrative IAM Identity Center permission set for setup work.
2. Install Terraform 1.10+, GitHub CLI, and `jq` for local validation and GitHub administration. A local AWS CLI/profile is intentionally not used.
3. Authenticate only to GitHub with `gh auth login`.
4. Create a custom Cloudflare API token; never use a Global API Key. Restrict it to the one account and the `codehawks.org` zone with only **Account / Email Routing Addresses / Write**, **Zone / Zone / Read**, **Zone / DNS / Write**, **Zone / Zone Settings / Write**, and **Zone / Email Routing Rules / Write**. The write groups are also accepted by the corresponding read-only preflight endpoints. Copy the account and zone IDs from the owner-controlled Cloudflare account.
5. Use the existing public `Israel-Jauregui/CodeHawks-FrontEnd` repository. Application code remains at the repository root and all Terraform stays in `infrastructure/`.

## AWS mutation policy

Agents and developer machines must not run `terraform apply`, `terraform destroy`, or mutating AWS CLI commands. All ongoing AWS changes run in GitHub Actions using short-lived OIDC sessions and an owner-reviewed environment. This rule is duplicated in the repository's `AGENTS.md` so future agents see it before making changes.

## 1. Bootstrap state and GitHub OIDC

GitHub cannot use OIDC until AWS trusts GitHub, so one human-owned bootstrap action is unavoidable. The initial setup is a versioned CloudFormation stack rather than undocumented console clicks or local CLI commands:

1. Sign in to the AWS console as the administrative setup identity.
2. Open **CloudFormation → Create stack → With new resources** in `us-east-1`.
3. Upload `infrastructure/bootstrap/template.yaml` from this repository.
4. Name the stack `codehawks-bootstrap`, keep the default GitHub parameters, acknowledge named IAM resources, and create it.
5. Copy the stack outputs `TerraformStateBucketName`, `InfrastructureRoleArn`,
   `BootstrapUpdateRoleArn`, `BootstrapCloudFormationRoleArn`, and
   `AwsAccountId` into the GitHub variables described below.

The stack creates the private/versioned Terraform state bucket, GitHub OIDC
provider, permissions boundary, restricted routine role, isolated bootstrap
update role, and CloudFormation-only bootstrap service role. The template is
the source of truth, and retained resources prevent accidental state loss.

### Required migration for an existing bootstrap stack

An older bootstrap stack allowed `codehawks-infrastructure-apply` to update its
own role and permissions boundary. Do **not** use that role or the old bootstrap
workflow to install this security fix. An AWS owner-administrator must first
update `codehawks-bootstrap` through the CloudFormation console using the new
template and acknowledge named IAM resources. Then copy the new outputs and
protect the new environment. This one-time console update removes the
self-escalation path.

After initial creation or that migration, use only the manual, owner-approved
**Update AWS bootstrap** workflow. It assumes the separate update role and
passes the CloudFormation-only service role. Never create GitHub AWS access-key
secrets.

## 2. Configure the infrastructure environment

Create a GitHub `infrastructure-production` environment with `Israel-Jauregui` as its required reviewer and `main` as its only deployment branch. Add:

Environment variables:

- `AWS_ROLE_ARN`: CloudFormation output `InfrastructureRoleArn`
- `AWS_ACCOUNT_ID`: CloudFormation output `AwsAccountId`
- `TF_STATE_BUCKET`: CloudFormation output `TerraformStateBucketName`
- `CLOUDFLARE_ACCOUNT_ID`: account that owns the `codehawks.org` zone
- `CLOUDFLARE_ZONE_ID`: the Cloudflare zone ID
- `API_ORIGIN`: exact origin from backend output `api_url` (no trailing slash),
  matching `frontend-production`'s `VITE_API_BASE_URL`
- `MEDIA_CDN_ORIGIN`: exact origin from backend output `media_public_base_url`
- `MEDIA_UPLOAD_ORIGIN`: exact backend output `media_upload_origin`
- `ENABLE_FLAT_RATE_WAF`: `false` while the AWS account uses its Free account plan
- `SES_DKIM_TOKENS`: the exact JSON array printed by the backend Terraform output `ses_dkim_tokens_json`
- `EMAIL_ROUTING_ONBOARDING_ENABLED`: `false` until the exact onboarding plan is approved; keep `true` afterward
- `EMAIL_FORWARDING_RULE_ENABLED`: `false` until Cloudflare reports the destination verified

Environment secrets:

- `CLOUDFLARE_API_TOKEN`
- `EMAIL_FORWARDING_DESTINATION`: the owner-approved UNG mailbox (`ijaur3627@ung.edu` for the initial rollout); Terraform marks it sensitive, gives it no default, and never outputs it
- `TF_VAR_BUDGET_ALERT_EMAIL`

Create a separate `bootstrap-production` environment with the same owner-only
reviewer and `main` restriction. It contains no Cloudflare or Terraform values;
add only:

- `AWS_ACCOUNT_ID`: CloudFormation output `AwsAccountId`
- `AWS_BOOTSTRAP_ROLE_ARN`: CloudFormation output `BootstrapUpdateRoleArn`
- `AWS_BOOTSTRAP_SERVICE_ROLE_ARN`: CloudFormation output
  `BootstrapCloudFormationRoleArn`

Do not reuse `AWS_ROLE_ARN` in this environment, and do not put either bootstrap
role ARN in `infrastructure-production`.

After the first frontend and Terraform CI checks have appeared in GitHub, run
`./infrastructure/scripts/configure-github.sh` from the repository root as the
authenticated owner. The script makes `main` PR-only, requires both checks,
blocks force pushes/deletion, applies protection to the owner, makes workflow
tokens read-only, and creates three separate owner-approved environments:
`frontend-production`, `infrastructure-production`, and `bootstrap-production`.

## 3. Plan and apply the site

Merge reviewed infrastructure changes into `main`, then start **Plan or apply infrastructure** with `operation=plan`. The protected `infrastructure-production` gate exposes the Cloudflare token and short-lived AWS role only after owner approval. The job checks the live Cloudflare account/zone, mail DNS, Email Routing settings, destinations/rules/catch-all, SES Easy DKIM, DMARC, and Terraform state ownership before it creates a plan. It rejects every replacement and unexpected deletion; the only permitted deletion is the exact forwarding rule when its protected enable flag is deliberately set to `false` for rollback. It rejects any forwarding plan that is not the one exact `contact@codehawks.org` rule.

The plan summary shows the complete human-readable Terraform plan plus a workflow run ID, planned commit SHA, and SHA-256 for a private plan bundle. Review and explain every change before proceeding. To apply, deliberately start the workflow again with `operation=apply-reviewed-plan` and copy those three values exactly. After the protected environment approval, the apply job verifies the original successful plan run, checks out its exact commit, reruns the read-only live preflight, checks that protected inputs are unchanged, downloads and digest-verifies the private bundle, and applies its binary plan. It never runs `terraform plan`. Abandoned current and noncurrent bundle versions expire from the private state bucket after two days; successful applies immediately create a deletion marker and the lifecycle removes the retained noncurrent version within the same two-day bound.

Do not run this workflow until the one-time owner-admin bootstrap migration above is complete. The legacy `codehawks-infrastructure-apply` role must never install its own permission fix.

Before the first apply, run **Import existing Cloudflare DNS** from the GitHub Actions page with `operation` set to `discover`, then approve the `infrastructure-production` gate. The discovery job only reads Cloudflare and prints any `A`, `AAAA`, or `CNAME` records for the apex and `www` hostnames.

- If neither hostname has an existing web record, skip the import workflow and continue with the apply.
- If each hostname has one existing record, rerun **Import existing Cloudflare DNS** with `operation` set to `import` and paste the record IDs printed by discovery. Leave an input empty when that hostname has no existing record.
- If discovery prints multiple web records for one hostname, do not import one arbitrarily. Remove any obsolete duplicate records in the Cloudflare dashboard until one intended record remains, run discovery again, and then import that record.

The import job validates that every supplied ID belongs to the expected hostname before it writes the remote Terraform state. It does not change live DNS. The later approved infrastructure apply updates the imported records only after CloudFront is ready.

The approved apply workflow prints the non-secret deployment outputs. Copy
`aws_account_id`, `frontend_deploy_role_arn`, `site_bucket_name`, and
`cloudfront_distribution_id`, then either enter them in the
`frontend-production` environment through GitHub settings or run this
GitHub-only helper:

```sh
AWS_ROLE_ARN="copied-role-arn" \
S3_BUCKET="copied-bucket-name" \
CLOUDFRONT_DISTRIBUTION_ID="copied-distribution-id" \
./infrastructure/scripts/configure-frontend-deployment.sh
```

The helper derives and sets `AWS_ACCOUNT_ID` from the exact deployment role ARN,
then updates the other GitHub environment variables. It does not read Terraform
state or contact AWS. If configuring the environment manually, set
`AWS_ACCOUNT_ID` to the `aws_account_id` output as well.

Enable **Deploy frontend** only after these variables exist. Then start it manually from GitHub Actions and approve the separate `frontend-production` gate; it builds protected `main`, uploads the static files, and invalidates CloudFront.

## Canonical routing, 404s, and browser policy

A viewer-request CloudFront Function redirects `www.codehawks.org` to the
equivalent path and query on `https://codehawks.org` with status 301. At the
canonical host, only the exact routes in Terraform's `spa_paths` allowlist are
rewritten to their generated `/<route>/index.html` shells. The root is served by
CloudFront's default root object. Unknown paths and missing assets reach S3 and
use `/404.html` with a genuine 404 status; there is no universal 200 fallback.
Origin responses 500, 502, 503, and 504 use the static `/500.html` body while
preserving the original 5xx status and disabling error caching.

The CloudFront response-headers policy retains HSTS, MIME sniffing protection,
same-origin-only framing, and the strict referrer policy. Same-origin framing is
required because MSAL completes silent token renewal through `/redirect.html`
inside a hidden same-origin frame; cross-origin embedding remains blocked by
both `frame-ancestors 'self'` and `X-Frame-Options: SAMEORIGIN`. It also adds a
Content-Security-Policy and Permissions-Policy. The CSP allows Microsoft Entra
authentication, the exact backend API, the exact presigned-upload origin, and
images from the owned media CDN. Same-origin public assets, including the social
preview image, remain allowed. `blob:` images are limited to local upload
previews, and `'unsafe-inline'` is currently limited to styles because the
existing application uses inline style attributes. Add a new external origin
only through a reviewed variable change; do not widen a directive to `https:`
or `*`.

### SES Easy DKIM handoff

The backend and DNS use separate Terraform states. `CodeHawks-Backend` owns `aws_sesv2_email_identity`; this repository owns every Cloudflare record. On the first email deployment:

1. Apply the reviewed backend plan first and copy its `ses_dkim_tokens_json` output.
2. Set that exact three-element JSON array as `SES_DKIM_TOKENS` in this repository's `infrastructure-production` environment.
3. Use the exact **Plan or apply infrastructure** process above. Terraform creates three unproxied `<token>._domainkey.codehawks.org` CNAMEs pointing to `<token>.dkim.amazonses.com`.
4. Wait for AWS SES to report successful identity verification and DKIM status in the backend region.
5. The human owner requests SES production access. This account-level request is intentionally not automated by either Terraform state.

Do not add the CNAMEs by hand. A future Easy DKIM rotation should begin with a reviewed backend plan, followed by updating `SES_DKIM_TOKENS` and applying this state.

Terraform also publishes `_dmarc.codehawks.org` in monitoring-only mode:
`v=DMARC1; p=none; adkim=r; aspf=r; pct=100`. This deliberately omits an
aggregate-report mailbox until the club chooses and monitors one. Verify the TXT
record and real-message DKIM/DMARC alignment before later tightening `p` to
`quarantine` or `reject`. Do not add or replace an apex SPF record until all UNG,
Microsoft, SES, and other legitimate senders are inventoried; publishing
multiple SPF records makes SPF invalid.

### Receive-only `contact@codehawks.org` forwarding

Cloudflare Email Routing handles only inbound mail for the exact public contact address. Amazon SES remains the outbound provider for `noreply@codehawks.org`, newsletters, and optional Cognito messages. Cloudflare does not store mail, send outbound mail, provide send-as behavior, or process mail through a Worker. Terraform does not manage a catch-all resource. Replies to forwarded mail visibly originate from the officer's UNG account.

The protected destination has no Terraform default and is supplied only through the `EMAIL_FORWARDING_DESTINATION` environment secret. The approved initial value is the owner-selected UNG mailbox recorded in `COMPLIANCE.md`; changing officers requires a reviewed secret update while the forwarding rule is disabled. `CLOUDFLARE_ACCOUNT_ID` is non-secret but protected as an environment variable so the preflight can prove that the configured zone belongs to the expected account.

The preflight resolves the protected MX, SPF, routing-DKIM, DMARC, and SES Easy
DKIM records through both Cloudflare and Google DNS-over-HTTPS and stops if the
normalized answers disagree. Once Email Routing reports `ready`, Cloudflare may
return an empty or partial current-record list; that response is accepted only
when both public resolvers show the exact three reviewed Cloudflare MX targets,
the single reviewed SPF value, a nonempty Cloudflare routing-DKIM key, the
reviewed DMARC value, and all three unchanged SES Easy DKIM CNAMEs. Every record
the API does return must match that public routing set, and any API-reported
missing/invalid record still fails closed. Cloudflare-assigned MX priorities may
differ between the advisory API response and the locked live records; the
preflight therefore compares API MX records by exact owner and target while still
rejecting duplicate targets or any non-Cloudflare mail provider.

Activation is deliberately two-stage:

1. Confirm public DNS has no conflicting MX or duplicate SPF, the three SES Easy DKIM CNAMEs are exact, the DMARC record is absent or the reviewed monitoring-only value, Email Routing has no catch-all or unexpected rules, and the account/zone/state identifiers match.
2. Keep `EMAIL_FORWARDING_RULE_ENABLED=false`, set `EMAIL_ROUTING_ONBOARDING_ENABLED=true`, run `operation=plan`, and review the exact plan. It may create only `cloudflare_email_routing_dns.contact` and `cloudflare_email_routing_address.contact` for this phase, alongside separately reviewed application/infrastructure changes already in the branch. Reject any replacement or deletion.
3. Only after explicit owner approval, run `apply-reviewed-plan` with the copied run ID, commit, and bundle digest. Cloudflare adds and locks its required inbound MX/SPF/routing-DKIM records and sends the protected destination a verification message. Stop here. The rule still does not exist.
4. The UNG mailbox owner opens Cloudflare's message and verifies the destination. Do not bypass verification or set its status in Terraform.
5. Set `EMAIL_FORWARDING_RULE_ENABLED=true`, run a new plan, and require the read-only preflight to report routing `ready` and the destination verified. Review the plan: it must create only one literal `to == contact@codehawks.org` forward action with one protected destination and no catch-all or Worker.
6. Explicitly approve and apply that second exact bundle. Never substitute a newer plan for the reviewed run ID/digest.
7. Send from an unrelated external mailbox, confirm delivery and Cloudflare activity status, verify Reply targets the original sender, and confirm the visible reply originates from the UNG officer account. Send separately to a random unconfigured local part and confirm it does not forward.
8. Recheck the website, SES identity/DKIM status, all three public Easy DKIM CNAMEs, the single apex SPF record, and the monitoring-only DMARC policy. Do not send a production newsletter merely as an infrastructure test.

Operational rollback disables forwarding through a reviewed plan that removes the exact rule while leaving Email Routing DNS and the verified destination intact. The Email Routing DNS resource has `prevent_destroy`; removing Cloudflare's locked MX/SPF records requires a separate, deliberately reviewed code change after confirming no inbound dependency remains. To rotate destinations, first disable/remove the rule, change the protected secret, apply the destination change, complete the new verification, and only then review a plan that recreates the exact rule.

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
curl -I https://codehawks.org/privacy
curl -I https://codehawks.org/assets/does-not-exist.js
curl -I https://codehawks.org/does-not-exist
dig +short MX codehawks.org
dig +short TXT codehawks.org
dig +short TXT _dmarc.codehawks.org
dig +short CNAME '<each-ses-token>._domainkey.codehawks.org'
```

Expected results: the apex and allowlisted application routes return 200;
`www` returns 301 with a `Location` on the HTTPS apex; both unknown requests
return 404 (never 200); responses include CSP, Permissions-Policy, HSTS,
`X-Content-Type-Options`, `X-Frame-Options`, and Referrer-Policy; and direct
anonymous S3 requests return `AccessDenied`.

After Email Routing activation, public DNS must show only Cloudflare's reviewed
inbound MX records, exactly one apex SPF TXT record, the three unchanged SES Easy
DKIM CNAMEs, and the unchanged monitoring-only DMARC value. Cloudflare must show
one exact-address rule and a disabled catch-all. Verify delivery from an unrelated
mailbox and separately verify that a random, unconfigured local part does not
arrive. Do not include message bodies or the protected destination in committed
test evidence.

Rollback by reverting the frontend commit on `main` and approving the resulting production deployment. S3 versioning retains prior objects for 30 days, but Git remains the source of truth.

## Destruction safety

CloudFront and the site bucket use Terraform `prevent_destroy`; the CloudFormation state bucket and permissions boundary use `DeletionPolicy: Retain`. A deliberate teardown must first cancel any CloudFront flat-rate plan in the AWS console, empty object versions, explicitly remove those guards through reviewed code, and use the approved workflows. Never delete the state bucket before every Terraform-managed resource is gone.
