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

- **No test runner.** `"test"` script is an empty string. No test framework is installed.
- **No `format` script.** CONTRIBUTING.md mentions `npm run format` / Prettier but neither is installed nor configured — do not reference it.

## Known Gaps
- **No `tsconfig.json`** despite `.tsx` files in `src/components/` and `src/pages/`. TypeScript type-checking is not wired up.
- **ESLint only targets `*.{js,jsx}`** (`eslint.config.js`). `.tsx` files are not linted.
- **Mixed extensions:** entrypoints (`main.jsx`, `App.jsx`) are JSX; components and pages are `.tsx`. Follow the existing pattern per directory when adding files.

## AWS Infrastructure Guardrail

- AWS infrastructure is declared under `infrastructure/` and all ongoing AWS mutations must run through owner-approved GitHub Actions.
- Do not run mutating AWS CLI commands, `terraform apply`, `terraform destroy`, CloudFormation deploys, or equivalent operations from a developer machine or agent session.
- Local read-only validation such as `terraform fmt -check`, `terraform validate`, and speculative plans without credentials is allowed.
- The only manual cloud bootstrap is the initial `codehawks-bootstrap` CloudFormation stack created by the human owner in the AWS console from `infrastructure/bootstrap/template.yaml`. This establishes GitHub OIDC without long-lived credentials.
- After initial bootstrap, changes to that stack use the manual `Update AWS bootstrap` workflow. Frontend and Terraform deployments remain separate, owner-reviewed GitHub environments.
- Never add AWS access keys to GitHub. Workflows must use short-lived OIDC sessions.

### Deployment Progress (updated August 8, 2026)

- [x] Create/update the `codehawks-bootstrap` CloudFormation stack through the approved bootstrap process.
- [x] Run the **Import existing Cloudflare DNS** discovery/import workflow so the existing apex and `www` records are represented in Terraform state.
- [x] Attempt the first **Apply infrastructure** run from protected `main`. Run `30767214671` failed during `terraform apply` on August 2, 2026 after partially creating the production infrastructure; its output-publishing step was skipped.
- [ ] Inspect the failed apply log, correct the specific Terraform/AWS error, and rerun **Apply infrastructure** through the `infrastructure-production` environment. Do not apply from a developer machine.
- [ ] Copy the successful apply outputs (`aws_region`, `frontend_deploy_role_arn`, `site_bucket_name`, and `cloudfront_distribution_id`) into the matching `frontend-production` environment variables.
- [ ] Manually run **Deploy frontend**, approve the `frontend-production` environment gate, and verify the production URLs listed in `infrastructure/README.md`.

Current live state: both `codehawks.org` and `www.codehawks.org` resolve to the partially created CloudFront distribution, but requests return `403` from its S3 origin because the frontend has not been deployed. The immediate next step is to diagnose the failed apply before rerunning it. Do not rerun DNS import unless the Cloudflare records changed or the earlier import did not complete successfully.

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
