# AGENTS.md

## Project
UNG App Development Club website frontend. React 19 + Vite 7, single-page app (no router). Early stage — only a homepage, nav bar, and typewriter component exist.

**Design Goal:** The entire application must strictly mimic the classic Windows XP UI (Luna theme).

## Commands
```sh
npm install        # install deps
npm run dev        # vite dev server
npm run build      # production build
npm run lint       # eslint (flat config)
npm run preview    # preview production build
```

- **Tests:** `npm test` runs TypeScript checks and Vitest. `npm run lint` includes JavaScript and TypeScript, including React hook rules.
- **No `format` script.** CONTRIBUTING.md mentions `npm run format` / Prettier but neither is installed nor configured — do not reference it.

## Known Gaps
- `tsconfig.json` covers the application and `npm run typecheck` runs it independently.
- **Mixed extensions:** entrypoints (`main.jsx`, `App.jsx`) are JSX; components and pages are `.tsx`. Follow the existing pattern per directory when adding files.

## AWS Infrastructure Guardrail

- AWS infrastructure is declared under `infrastructure/` and all ongoing AWS mutations must run through owner-approved GitHub Actions.
- Do not run mutating AWS CLI commands, `terraform apply`, `terraform destroy`, CloudFormation deploys, or equivalent operations from a developer machine or agent session.
- Local read-only validation such as `terraform fmt -check`, `terraform validate`, and speculative plans without credentials is allowed.
- The only manual cloud bootstrap is the initial `codehawks-bootstrap` CloudFormation stack created by the human owner in the AWS console from `infrastructure/bootstrap/template.yaml`. This establishes GitHub OIDC without long-lived credentials.
- After initial bootstrap, changes to that stack use the manual `Update AWS bootstrap` workflow. Frontend and Terraform deployments remain separate, owner-reviewed GitHub environments.
- Never add AWS access keys to GitHub. Workflows must use short-lived OIDC sessions.

### SES DKIM Cross-Repository Handoff

- The backend repository's Terraform state owns the regional SES identity for `codehawks.org` and outputs three Easy DKIM tokens. This repository's Terraform state owns the Cloudflare zone and is the only place that creates the corresponding DNS records.
- Store the backend output `ses_dkim_tokens_json` unchanged in the `infrastructure-production` environment variable `SES_DKIM_TOKENS`, then use the manual owner-approved **Plan or apply infrastructure** workflow. The workflow requires exactly three lowercase alphanumeric tokens and publishes unproxied CNAMEs.
- Never create these CNAMEs manually, never create the SES identity from this repository, and never put Cloudflare credentials in the backend repository. The first-deployment order is backend identity apply, token handoff, frontend/domain apply, SES verification, then the human-owned SES production-access request.
- Empty `ses_dkim_tokens` remains available only for local validation or the pre-handoff state. The protected production workflow deliberately refuses to apply without all three tokens.

### Local Terraform Tooling (verified August 8, 2026)

- Terraform is installed through Homebrew at `/opt/homebrew/bin/terraform`. The verified local version is `1.15.8` for `darwin_arm64`, which satisfies this repository's `>= 1.10, < 2.0` constraint. The GitHub workflows remain pinned separately to Terraform `1.12.2`.
- Future agents must run `command -v terraform && terraform version` before reporting that Terraform is unavailable or relying on the recorded version. Update this section and the local security review if the installed version or verification state changes.
- The last successful local read-only verification ran from `infrastructure/` using `terraform fmt -check -recursive`, `terraform init -backend=false -input=false`, and `terraform validate`. It used the committed lockfile providers: AWS `6.57.1` and Cloudflare `5.22.0`.
- `terraform init` may require network access to `registry.terraform.io`, even when locked providers are already cached. Local verification must not use AWS credentials, remote state, `terraform apply`, `terraform destroy`, or any other cloud mutation.

### Local-Only Security Review

- `SECURITY.md`, when present in the repository working directory, is the owner's private, local security review. It intentionally contains unresolved vulnerability details and must remain untracked.
- Never stage, commit, push, publish, upload, or copy `SECURITY.md` or its vulnerability details into a pull request, issue, workflow artifact, build output, public documentation, or other externally accessible location unless the owner explicitly reverses this instruction.
- Future agents may read and update the local file for authorized security work, but must confirm with `git status --short` that it remains untracked before handoff. Do not add the filename to the tracked `.gitignore`, because doing so would publicly advertise the private review file.

### Deployment Progress (updated August 9, 2026)

- [x] Create/update the `codehawks-bootstrap` CloudFormation stack through the approved bootstrap process.
- [x] Run the **Import existing Cloudflare DNS** discovery/import workflow so the existing apex and `www` records are represented in Terraform state.
- [x] Attempt the first **Apply infrastructure** run from protected `main`. Run `30767214671` failed during `terraform apply` on August 2, 2026 after partially creating the production infrastructure; its output-publishing step was skipped.
- [x] Correct the first failure by allowing Terraform to call `iam:ListAttachedRolePolicies`, then deploy that bootstrap update through run `31258878313`.
- [x] Correct retry run `31259037017` by allowing Terraform to call `iam:ListInstanceProfilesForRole`, deploy the follow-up bootstrap update through run `31259263012`, and complete infrastructure apply run `31259340864` successfully.
- [x] Copy the successful apply outputs (`aws_region`, `frontend_deploy_role_arn`, `site_bucket_name`, and `cloudfront_distribution_id`) into the matching `frontend-production` environment variables.
- [x] Enable **Deploy frontend**, approve the `frontend-production` environment gate, and complete production deployment run `31259463670` successfully.
- [x] Verify both HTTPS hostnames, the deep `/projects` SPA route, the HTTP-to-HTTPS redirect, and denial of direct anonymous S3 access.

Current live state: the frontend AWS migration is complete. Both `https://codehawks.org` and `https://www.codehawks.org` serve the production application through CloudFront, deep SPA paths resolve to `index.html`, HTTP redirects to HTTPS, and the S3 origin remains private. Future infrastructure and frontend changes must continue through their separate manual, owner-approved GitHub workflows. Do not rerun DNS import unless the Cloudflare records change or Terraform state must adopt a replacement record.

Pending email handoff: after the backend's first SES identity apply, copy its `ses_dkim_tokens_json` output into `SES_DKIM_TOKENS` and approve one frontend infrastructure apply. Do not mark SES/DKIM complete until AWS reports the identity and DKIM status as successful.

## Architecture
```text
index.html          → Vite entrypoint, loads /src/main.jsx
src/main.jsx        → React root render
src/App.jsx         → Top-level component, currently just renders <Homepage />
src/pages/          → Page-level components (.tsx)
src/components/     → Reusable components (.tsx)
src/assets/         → Static assets bundled by Vite
public/             → Static assets served as-is
```
Single route — no react-router. Navigation is hash-anchor based within `Homepage.tsx`.

## Styling
- **Aesthetic:** Windows XP Luna theme. Use standard Windows XP colors (bliss green, primary blue taskbar, silver/gray windows).
- **Typography:** Default to Tahoma or Microsoft Sans Serif.
- **CSS Strategy:** Utilize classic vanilla CSS or an established retro library (like `XP.css`) to achieve the 3D button and window effects. Do not use modern utility frameworks like Tailwind.
- `TopAppBar` uses a separate `.css` file. Ensure this looks like the classic blue XP window title bar.
- `Homepage.tsx` has a large inline `<style>` block (500+ lines). **Goal:** Gradually extract this into standard, separate `.css` files.

## Conventions
- **Code Style:** Write modern, production-ready React 19 code. Do not hold back on complexity if it serves the application's scalability or performance. Use advanced patterns (custom hooks, context, proper memoization, component composition) where appropriate.
- **Mentorship Comments:** The user is highly proficient in vanilla HTML/JS/CSS but is actively learning React. When implementing complex React paradigms (especially regarding lifecycle, state, or hooks), include thorough, inline explanations detailing *how* and *why* the code works.
- **Commits:** conventional commits — `feat:`, `fix:`, `docs:`, `style:`, `refactor:`, `test:`, `chore:`.
- **Branches:** `feature/`, `bugfix/`, `docs/`, `refactor/`, `style/`, `test/` prefixes.
- **Components:** functional components with hooks only. PascalCase filenames.
- **File placement:** components in `src/components/`, pages in `src/pages/`, utilities in `src/utils/`, constants in `src/constants/`.
- See `CONTRIBUTING.md` for full contributor guidelines including PR template and code style.
