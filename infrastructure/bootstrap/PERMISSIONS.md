# Frontend bootstrap permission model

The bootstrap stack deliberately separates routine site changes from changes
to the credentials that authorize those changes.

| Principal | Trust gate | Purpose | May change bootstrap IAM? |
| --- | --- | --- | --- |
| `codehawks-infrastructure-apply` | `infrastructure-production` | Routine Terraform lifecycle for the frontend | No |
| `codehawks-frontend-deploy` | `frontend-production` | Publish built static files and invalidate one distribution | No |
| `codehawks-bootstrap-update` | `bootstrap-production` | Ask CloudFormation to update only `codehawks-bootstrap` | Only through the service role below |
| `codehawks-bootstrap-cloudformation` | CloudFormation service principal | Maintain resources in the bootstrap stack | Yes, for the exact named bootstrap resources |

## Routine Terraform invariants

The routine role and its permissions boundary contain the same fail-closed
controls:

- IAM lifecycle permissions target only `codehawks-frontend-deploy`.
- Creating that role or attaching a boundary requires the exact
  `codehawks-infrastructure-boundary` ARN.
- Removing the deployment role's boundary is explicitly denied. Terraform can
  delete the role without first removing its boundary, so no routine workflow
  needs `iam:DeleteRolePermissionsBoundary`.
- Mutation of `codehawks-infrastructure-apply`, either bootstrap role, the
  GitHub OIDC provider, and the infrastructure boundary is explicitly denied.
- Creating, deleting, or activating permissions-boundary policy versions is
  explicitly denied.
- Updating the `codehawks-bootstrap` stack is explicitly denied.
- The Terraform state and site S3 permissions use the two account-specific
  bucket ARNs; they do not use a `codehawks-*` resource wildcard.
- Exact reviewed frontend plan bundles use `frontend/plans/<run-id>/` in the
  private state bucket; current and noncurrent versions expire after two days.
  Apply runs accept the copied
  run ID, commit SHA, and bundle SHA-256, then apply that binary plan without
  replanning and remove the bundle after success.

These controls prevent a compromised routine workflow from editing its own
trust, widening its own maximum permissions, or using the frontend deployment
role as a boundary-removal escape path.

## Bootstrap owner-admin path

Bootstrap maintenance is intentionally more privileged and therefore isolated.
The OIDC update role can update only the exact `codehawks-bootstrap` stack and
can pass only `codehawks-bootstrap-cloudformation`, conditioned on the recipient
being CloudFormation. The service role trusts only
`cloudformation.amazonaws.com` and scopes IAM resources to the three bootstrap
roles, the one boundary, and the one GitHub provider.

The first migration from the legacy self-modifying role must be performed by a
human owner through the AWS CloudFormation console. Do not run the existing
bootstrap workflow with `codehawks-infrastructure-apply` to install this fix.
After that migration, all template updates use the manual workflow and its
separate `bootstrap-production` approval gate.

## Unavoidable wildcard-resource permissions

Terraform creates global CloudFront, ACM, WAF, and AWS Budget resources whose
create/list APIs do not consistently support a future resource ARN. Those
service actions remain in a dedicated `Resource: "*"` statement. Neither that
statement nor any other routine allow statement grants CloudFormation or broad
IAM administration. `iam:ListOpenIDConnectProviders` also requires a wildcard
resource and is read-only.

## CI enforcement

`check_policy_invariants.py` runs after `cfn-lint`. It fails if routine policy
regains boundary-version or bootstrap-stack control, if an IAM mutation targets
anything other than the exact frontend deploy role, if boundary removal is
allowed, if explicit denies disappear, if the bootstrap role trusts the routine
environment, or if the managed boundary exceeds the repository's policy-size
safety budget.
