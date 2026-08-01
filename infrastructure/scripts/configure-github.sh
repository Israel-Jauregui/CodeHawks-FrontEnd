#!/usr/bin/env bash
set -euo pipefail

owner="${GITHUB_OWNER:-Israel-Jauregui}"
repository="${GITHUB_REPOSITORY_NAME:-CodeHawks-FrontEnd}"
reviewer="${DEPLOYMENT_REVIEWER:-Israel-Jauregui}"
full_name="${owner}/${repository}"
reviewer_id="$(gh api "users/${reviewer}" --jq '.id')"

configure_environment() {
  local environment="$1"

  jq -n \
    --argjson reviewer_id "$reviewer_id" \
    '{wait_timer: 0, prevent_self_review: false, can_admins_bypass: false, reviewers: [{type: "User", id: $reviewer_id}], deployment_branch_policy: {protected_branches: false, custom_branch_policies: true}}' \
    | gh api --method PUT "repos/${full_name}/environments/${environment}" --input - >/dev/null

  if ! gh api "repos/${full_name}/environments/${environment}/deployment-branch-policies" \
    --jq '.branch_policies[].name' | grep -Fxq main; then
    gh api --method POST "repos/${full_name}/environments/${environment}/deployment-branch-policies" \
      -f name=main >/dev/null
  fi
}

gh repo view "$full_name" >/dev/null
configure_environment frontend-production
configure_environment infrastructure-production

jq -n \
  '{required_status_checks: {strict: true, contexts: ["Build and lint", "Terraform checks"]}, enforce_admins: true, required_pull_request_reviews: {dismiss_stale_reviews: true, require_code_owner_reviews: false, required_approving_review_count: 0}, restrictions: null, required_linear_history: true, allow_force_pushes: false, allow_deletions: false, required_conversation_resolution: true, lock_branch: false, allow_fork_syncing: true}' \
  | gh api --method PUT "repos/${full_name}/branches/main/protection" --input - >/dev/null

gh api --method PUT "repos/${full_name}/actions/permissions/workflow" \
  -f default_workflow_permissions=read \
  -F can_approve_pull_request_reviews=false >/dev/null

echo "Configured ${full_name}: protected main, isolated owner-approved environments, read-only workflow tokens."
