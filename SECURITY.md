# Security Review and Current State

Last reviewed: August 24, 2026 (America/New_York)

This document preserves the August 8 baseline findings and records their
current remediation status after the compliance rollout. It is an engineering
review, not a guarantee that the system is free of vulnerabilities or evidence
that no compromise has occurred.

## Current State

- The production frontend is live at `https://codehawks.org` and
  `https://www.codehawks.org`.
- CloudFront serves the static Vite application from a private S3 origin using
  Origin Access Control (OAC).
- Direct anonymous access to the production S3 object was tested and returned
  `403 Forbidden`.
- HTTP redirects to HTTPS. CloudFront is configured for TLS 1.2 or newer and
  currently returns HSTS, `X-Content-Type-Options`, `X-Frame-Options`, and a
  restrictive referrer policy.
- The site bucket and Terraform state bucket have public-access blocking,
  encryption at rest, and versioning enabled.
- Production deployments use short-lived GitHub OIDC credentials rather than
  stored AWS access keys.
- The `frontend-production` and `infrastructure-production` GitHub environments
  were verified through the GitHub API as restricted to the `main` branch,
  requiring the configured reviewer, with administrator bypass disabled.
- GitHub Actions dependencies are pinned to full commit SHAs.
- The AWS owner completed the one-time `codehawks-bootstrap` stack migration;
  the routine Terraform role can no longer install or widen its own permission
  fix.
- Backend run `32774467048` applied the exact reviewed plan successfully,
  including the public member-directory route, private media controls, SES Easy
  DKIM, and newsletter `Reply-To: contact@codehawks.org`.
- The frontend compliance and domain changes in this branch remain undeployed
  until this pull request is reviewed and the separate protected plan/apply
  workflow is explicitly approved.

## Tracked Security Findings

### SEC-001: Infrastructure role can escape its permissions boundary

Severity: **High**

Status: **Remediated in the owner-updated bootstrap stack and this branch**

The August 8 review found that `codehawks-infrastructure-apply` could create and
activate versions of the `codehawks-infrastructure-boundary` policy and call
`iam:PutRolePolicy` on roles matching `codehawks-*`, including itself.

After assuming the role, a compromised workflow could therefore:

1. Create a permissive version of its own permissions boundary.
2. Make that version the default.
3. Attach an unrestricted inline policy to itself.
4. Access AWS resources outside the intended CodeHawks scope.

Historical configuration referenced by the baseline finding:

- `infrastructure/bootstrap/template.yaml`, especially the
  `ManageCodeHawksRolesAndBoundary`, `ManageExistingCodeHawksRoles`, and
  `UpdateBootstrapBoundary` statements.

Recommended remediation:

- Separate bootstrap/boundary maintenance from the normal Terraform apply
  role and environment.
- Prevent the Terraform apply role from modifying its own role or permissions
  boundary.
- Narrow IAM management permissions to the exact frontend deployment role
  instead of all `codehawks-*` roles.
- Consider explicit deny statements for the apply role ARN and boundary ARN.
- Require an independently protected approval path for bootstrap policy
  changes.

Remediation completed: the owner updated `codehawks-bootstrap` through
CloudFormation, routine-role and boundary policies now explicitly deny the
control-plane escape paths, and bootstrap maintenance uses separate
`codehawks-bootstrap-update` and CloudFormation service roles. Automated IAM
invariants enforce the separation. The legacy routine role was not used to
install its own fix.

### SEC-002: Content Security Policy and browser token storage

Severity: **Medium**

Status: **Remediated locally; frontend/domain deployment pending**

The August 8 deployment did not define a Content Security Policy (CSP) and used
persistent browser token storage. The current implementation adds a strict,
origin-aware CloudFront CSP and configures MSAL to keep access tokens in
per-tab `sessionStorage` instead of `localStorage`.

Relevant configuration and code:

- `infrastructure/main.tf`: `aws_cloudfront_response_headers_policy.security`
- `src/auth/msalConfig.ts`
- `src/auth/AuthContext.tsx`

Implemented controls:

- The CloudFront response-header policy now emits an origin-aware CSP based on:

  ```text
  default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; connect-src 'self'
  ```

- The policy allows only the required API, media, Microsoft login, font, image,
  and inline-style sources; scripts remain same-origin only.
- Microsoft Entra access tokens are requested for the configured API scope,
  held in `sessionStorage`, and validated by the backend for protected actions.

No `dangerouslySetInnerHTML` or equivalent direct HTML injection sink was found
during this review, which reduces immediate exploitability but does not replace
a CSP.

### SEC-003: Client authentication state verification

Severity: **High if trusted by an API**

Status: **Remediated by the Entra/backend integration**

The August 8 frontend decoded an unverified JWT locally and passed a
browser-supplied username into project operations. That obsolete JWT utility
and local login/signup flow are no longer present.

Current controls:

- JWT signature, issuer, audience, and expiration are validated server-side.
- The acting member identity is derived from the validated token, not from a
  username supplied by the browser.
- The frontend uses Microsoft Entra access tokens for the configured API scope.
- The backend validates the token and derives authorization context server-side;
  browser-supplied usernames are not authorization decisions.

### SEC-004: Vulnerable development/build dependency

Severity: **Low in deployment context**

Status: **Remediated**

The August 8 full dependency audit reported `nanoid@3.3.16` through the
Vite/PostCSS development dependency chain. The advisory concerns a possible
infinite loop in custom generators when called with a zero size.

- Advisory: `GHSA-2v37-7h3g-55p8`
- `npm audit --omit=dev` reported zero production dependency vulnerabilities.
- The affected package was not present in the generated browser bundle as a
  runtime dependency.

The lockfile was updated. The August 24 full dependency audit reports zero
known vulnerabilities at the configured high-severity gate.

### SEC-005: CI static analysis coverage

Severity: **Low / assurance gap**

Status: **Partially remediated; ESLint TSX rules remain a residual improvement**

`eslint.config.js` still targets JavaScript and JSX rather than TypeScript and
TSX. The current repository now has strict `tsconfig.json` checks, including
unused/fallthrough/implicit-return checks, and CI runs type checking plus seven
behavioral tests before the production build.

Remaining improvement: configure ESLint with a TypeScript parser and targeted
rules for `*.ts` and `*.tsx`; strict TypeScript and behavioral-test gates are
already active.

## Authentication and API Integration

Status: **Backend deployed; reviewed frontend deployment pending**

The obsolete same-origin `/api/Members/login` and `/api/Members/signup` flow
has been replaced. The browser authenticates with Microsoft Entra and calls the
dedicated API Gateway origin through the environment-supplied
`VITE_API_BASE_URL`. The backend validates access tokens, applies explicit CORS
and throttling, and protects authenticated member/project/media operations.

## Controls Verified During This Review

- Private S3 origin and source-ARN-restricted CloudFront bucket access.
- S3 public-access blocking, ownership enforcement, encryption, and versioning.
- HTTP-to-HTTPS redirection and modern CloudFront TLS policy.
- HSTS, frame protection, MIME-sniffing protection, and referrer policy.
- Correct revalidation caching for the HTML entrypoint and immutable caching
  for content-hashed JavaScript and CSS assets.
- GitHub OIDC subject restricted to immutable repository/owner identifiers and
  protected production environments.
- Production environment branch policies restricted to `main`.
- Owner approval required and environment administrator bypass disabled.
- Read-only default GitHub workflow permissions.
- Commit-SHA-pinned GitHub Actions.
- No AWS access keys, Cloudflare API tokens, private keys, or similar committed
  secrets found in the current tree or searched Git history.
- `npm run typecheck`, `npm run lint`, all seven behavioral tests, and
  `npm run build` completed successfully, subject to the ESLint TSX residual
  documented above.
- The full `npm audit --audit-level=high` reported zero vulnerabilities.
- Terraform v1.15.8 was installed locally. `terraform fmt -check -recursive`,
  `terraform init -backend=false -input=false`, and `terraform validate`
  completed successfully using the locked AWS v6.57.1 and Cloudflare v5.22.0
  providers.

## Review Limitations

- Local verification intentionally used `terraform init -backend=false`; no
  remote state, AWS credentials, speculative plan, or infrastructure mutation
  was involved.
- This review covered the frontend repository, its AWS infrastructure code,
  CI/CD workflows, public GitHub environment configuration, and externally
  observable CloudFront/S3 behavior. It did not include AWS CloudTrail,
  CloudFront logs, IAM Access Analyzer results, GuardDuty findings, the AWS
  account's other resources, or backend source code.
- No destructive or mutating AWS commands were run.

## Remaining Rollout Order

1. Merge this reviewed frontend pull request without deploying it implicitly.
2. Run and review the protected frontend/domain Terraform plan with both Email
   Routing flags still `false`; apply only that exact plan after owner approval.
3. Treat Cloudflare Email Routing onboarding and exact-rule activation as two
   later, separately reviewed plans with mailbox verification between them.
4. Verify the website, API, SES Easy DKIM, SPF, DMARC, and forwarding health.
5. Keep the human-owned SES production-access request last.
