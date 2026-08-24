# CodeHawks compliance and production-readiness review

Reviewed: August 24, 2026

Scope: `CodeHawks-FrontEnd` and `CodeHawks-Backend`. The iPad project is intentionally out of scope. This is an engineering compliance review, not a legal certification.

Status labels:

- **Implemented locally** — code and automated checks are present, but the change is not live until the protected deployment is completed.
- **Owner action** — the code cannot truthfully decide this without an officer, university, mailbox, or AWS-account decision.
- **Residual** — a documented limitation that remains after this pass.

## 1. Legal and privacy

- `[CRITICAL]` **Implemented locally:** Added a versioned Privacy Policy, Terms of Use, service-provider list, accessibility statement, permanent legal navigation, and a just-in-time notice before Microsoft sign-in.
- `[CRITICAL]` **Implemented locally:** Public member profiles and club-announcement newsletters are independent, off-by-default choices. Legacy records without either field normalize to `false`.
- `[HIGH]` **Implemented locally:** Added a public Members directory that returns only active, opted-in profiles and never returns member IDs, email, role, status, timestamps, or newsletter preference.
- `[HIGH]` **Implemented locally:** New accounts receive a random non-email handle. Signed-in invitation search is limited to a three-character handle prefix and returns only ID, handle, and display name.
- `[HIGH]` **Implemented locally:** Added indexed data export, explicit account deletion, avatar removal, preference-change history, and accurate disclosures for records that require officer-assisted discovery.
- `[HIGH]` **Implemented locally:** The policy documents indefinite application-record retention, 14-day operational logs, one-day abandoned pending uploads, public-media behavior, recovery copies, under-18 UNG users, and current browser storage.
- `[CRITICAL]` **Owner action:** Confirm the final registered operator name while the Application Development Club to CodeHawks rename is pending. Confirm that `contact@codehawks.org` is monitored and add any physical or registered address that UNG or applicable law requires. Update `src/constants/site.ts` before calling the site fully compliant.
- `[MEDIUM]` **Owner action:** No cookie banner is installed because the production code currently has no analytics, advertising pixels, marketing cookies, payment processor, or AI API. Add blocking consent controls and update the policy before enabling any non-essential tracking.

## 2. Security and abuse resistance

- `[CRITICAL]` **Implemented locally:** Removed the routine infrastructure workflow's ability to widen its own AWS permissions boundary or attach broader permissions. Bootstrap maintenance is separated into an owner-gated role and CloudFormation service role with invariant tests.
- `[CRITICAL]` **Owner migration completed:** The AWS owner updated the existing `codehawks-bootstrap` stack through CloudFormation before routine infrastructure deployment resumed. The legacy routine role was not used to install its own permission fix; the subsequently reviewed backend apply succeeded through the protected role.
- `[HIGH]` **Implemented locally:** Added a strict origin-aware CSP, HSTS, MIME sniffing protection, cross-origin frame protection, Referrer Policy, Permissions Policy, exact CORS origins, and API throttling.
- `[HIGH]` **Implemented locally:** Browser uploads now land in a private `pending/` namespace. Protected finalization reads ETag-pinned bytes, checks size/type/signature, uses a create-only final write, and only then attaches the server-generated URL. CloudFront cannot read pending keys.
- `[HIGH]` **Implemented locally:** Avatar responses are not cached, old avatars are deleted after a successful conditional replacement, explicit removal is available, and account deletion sweeps both pending and final avatar prefixes.
- `[HIGH]` **Implemented locally:** GitHub and LinkedIn profile fields require the corresponding provider-owned HTTPS domain; legacy mismatches are suppressed from public responses and the frontend applies the same defense.
- `[HIGH]` **Implemented locally:** Newsletter recipient claims use leases before a send attempt and an accepted-unconfirmed state once a provider attempt begins. Ambiguous outcomes require privileged, reasoned reconciliation and are not automatically resent.
- `[MEDIUM]` **Residual:** Image validation does not fully decode images, strip EXIF, resize, scan for malware, or moderate content. The browser performs best-effort re-encoding, and the remaining limitation is disclosed.
- `[MEDIUM]` **Owner action:** DMARC is monitoring-only and has no aggregate-report mailbox. Establish a monitored reporting address, add `rua`, verify production DKIM/DMARC alignment, and only then plan a move from `p=none` to enforcement.

## 3. SEO and web plumbing

- `[HIGH]` **Implemented locally:** `https://codehawks.org` is the canonical origin. `www` redirects to the HTTPS apex while preserving path and query.
- `[HIGH]` **Implemented locally:** Added per-route titles, descriptions, canonicals, robots directives, Open Graph/Twitter metadata, a 1200×630 social image, favicon package, Apple icon, and web manifest.
- `[HIGH]` **Implemented locally:** Added `robots.txt`, `sitemap.xml`, generated route-specific HTML shells, private-route `noindex`, real 404 responses, and status-preserving 500-series fallbacks. Unknown routes no longer become soft-200 home pages.

## 4. Accessibility and operational UX

- `[HIGH]` **Implemented locally:** Added skip navigation, main/header/nav/footer landmarks, page-level headings, visible keyboard focus, corrected checkbox labeling, and removal of misleading ARIA listbox/menu semantics.
- `[HIGH]` **Implemented locally:** Login and deletion dialogs manage focus, Escape, confirmation, errors, and focus restoration. Dynamic status and validation feedback is announced to assistive technology.
- `[HIGH]` **Implemented locally:** Fixed critical 320 CSS-pixel reflow and contrast problems, added reduced-motion behavior, responsive modals/cards/taskbar, and meaningful image alternatives.
- `[HIGH]` **Implemented locally:** Added custom not-found/service-error surfaces, network/API feedback, empty states, and real in-app URL/Back/Forward synchronization.
- `[MEDIUM]` **Residual:** The deliberately dense movable Windows-XP interface and future member-authored content require continuing keyboard, screen-reader, zoom, contrast, and content review. The accessibility statement does not claim complete conformance.

## Previously missing artifacts added

- Legal routes: `src/pages/PrivacyPolicyPage.tsx`, `src/pages/TermsPage.tsx`, `src/pages/SubprocessorsPage.tsx`, and `src/pages/AccessibilityPage.tsx`.
- Public web plumbing: `public/robots.txt`, `public/sitemap.xml`, `public/site.webmanifest`, `public/404.html`, and `public/500.html`.
- Routing and infrastructure checks: `infrastructure/functions/request-router.js.tftpl`, `infrastructure/functions/request-router.test.cjs`, `infrastructure/bootstrap/PERMISSIONS.md`, and `infrastructure/bootstrap/check_policy_invariants.py`.
- Member privacy controls: `src/components/MembersDirectory.tsx`, `src/components/browser/modules/ProfileModule.tsx`, and the backend `/v1/directory/members`, `/v1/me/export`, `/v1/me/avatar`, and `/v1/me` deletion handlers.

## Next owner task: activate `contact@codehawks.org` forwarding

Decision updated August 24, 2026: the owner selected `contact@codehawks.org` as the single public privacy/support and newsletter Reply-To address. The protected backend environment value was added and the reviewed backend apply deployed that Reply-To configuration; the website and Cloudflare Email Routing changes remain undeployed. Read-only checks against Cloudflare and Google public resolvers found no MX or apex SPF record, so incoming messages cannot currently be delivered.

Desired receive-only behavior:

- Forward mail addressed exactly to `contact@codehawks.org` to the owner-selected protected destination using Cloudflare Email Routing. The approved initial destination is stored only in the protected `EMAIL_FORWARDING_DESTINATION` environment secret, not a reusable Terraform default.
- Do not enable a catch-all address, email storage, a mail-processing Worker, or outbound sending through Cloudflare.
- Normal replies from the forwarded message will be sent from the officer's UNG account. This task does not authorize or claim “send as `contact@codehawks.org`” functionality.
- Keep the backend's Amazon SES identity, Easy DKIM records, `noreply@codehawks.org` sender, newsletter `Reply-To`, and monitoring-only DMARC policy intact.

Implementation and approval sequence:

1. Perform a read-only live preflight of Cloudflare Email Routing, current MX/TXT/DKIM records, Terraform state, and the reviewed Terraform plan. Stop on any existing mail provider, duplicate SPF record, unexpected DNS replacement/deletion, or account/zone mismatch.
2. Prefer the existing frontend infrastructure state for Cloudflare routing resources. Add minimally scoped, non-secret configuration for the Cloudflare account ID and a sensitive/environment-supplied forwarding destination; do not hard-code personal addresses into reusable Terraform defaults.
3. Add the verified destination and exact-address routing rule using supported Cloudflare provider resources. The Cloudflare token will need the minimum Email Routing address/rule permissions in addition to its existing zone/DNS permissions; document the exact permissions and do not use a global API key.
4. Cloudflare requires the destination owner to open a verification email sent to `ijaur3627@ung.edu`. Do not mark or force the destination as verified in code. Keep the forwarding rule disabled until Cloudflare reports the destination verified.
5. Cloudflare Email Routing domain onboarding creates or locks its required root MX, SPF, and routing-DKIM records. Treat onboarding as a separate, human-approved step and document how those Cloudflare-managed records coexist with Terraform. Do not create duplicate SPF records or overwrite the SES Easy DKIM/DMARC records.
6. After destination verification and DNS review, run a second owner-approved plan/apply to create and enable only the exact `contact@codehawks.org` rule.
7. Test from an unrelated external mailbox. Confirm delivery to the UNG inbox, preservation of the original sender and reply target, correct Cloudflare activity-log status, and continued SES/DKIM/DMARC health. Do not test from the same destination mailbox because some providers suppress self-forwarded messages.
8. Update this section and the infrastructure email documentation with the activation date, verified destination owner, rollback steps, and operational owner. Never commit Cloudflare credentials or message contents.

Activation record (pending):

- **Status/result:** The AWS-owner bootstrap migration and reviewed backend apply are complete. Backend run `32774467048` applied the approved `2 added, 6 changed, 0 destroyed` plan, including newsletter `Reply-To: contact@codehawks.org`; SES identity verification and Easy DKIM report healthy. Frontend Terraform, workflow, preflight, plan-invariant, and website changes are prepared but not deployed. Forwarding is not active, no Cloudflare destination-verification message has been triggered, and no frontend/domain plan has been applied.
- **Read-only evidence (August 24, 2026):** Cloudflare and Google public resolvers return no apex MX, no apex SPF, and no live DMARC record; the only apex TXT value is the existing Google site-verification token. All three deployed SES Easy DKIM CNAMEs still resolve to their matching `dkim.amazonses.com` targets, and both apex and `www` return HTTP 200 from the existing CloudFront/S3 site. The protected workflow must still prove token status, account/zone ownership, Email Routing status, catch-all/rules/destinations, and current Terraform-state ownership before it is allowed to produce the first exact plan.
- **Protected value:** Store the approved initial destination `ijaur3627@ung.edu` only as the `infrastructure-production` environment secret `EMAIL_FORWARDING_DESTINATION`. It has no Terraform default and is never emitted as an output.
- **Activation date and verification evidence:** Pending the two separately reviewed onboarding/rule plans, explicit approvals, mailbox verification, and unrelated-sender tests. Record the UTC activation time and non-message-content evidence here after completion.
- **Operational owner:** The CodeHawks repository/domain owner and holder of the protected destination mailbox until a documented club-owner handoff replaces them.
- **Rollback:** Run a reviewed plan that removes only `cloudflare_email_routing_rule.contact[0]`, then apply that exact approved bundle. Leave the verified destination and Cloudflare-managed Email Routing DNS intact for rapid recovery. Removing routing DNS is a separate destructive change blocked by `prevent_destroy` and requires a new owner decision after confirming no inbound dependency remains.

Acceptance criteria:

- External mail to `contact@codehawks.org` arrives at the protected owner-selected UNG destination.
- Mail to arbitrary, unconfigured `@codehawks.org` addresses is not forwarded.
- Replies clearly originate from the officer's UNG account.
- Website, SES newsletter sending, Easy DKIM, SPF, and DMARC checks remain healthy.
- The destination can be removed or replaced through a reviewed owner-approved change when officers change.

## Consolidated next-agent execution task

Use `/Users/israeljauregui/Desktop/ClubWebsiteAWS/Migration` as the workspace. It contains two repositories, `CodeHawks-FrontEnd` and `CodeHawks-Backend`, with intentional uncommitted work from this compliance implementation. Do not reset, discard, overwrite, stash, or broadly reformat those changes. Preserve unrelated pre-existing changes, including the user's instruction/security files.

Phase 1 — understand and protect the existing work:

1. Read this document, both repositories' `AGENTS.md` files, both READMEs, the deployment/email documentation, and `CodeHawks-FrontEnd/infrastructure/bootstrap/PERMISSIONS.md` before changing code or infrastructure.
2. Report the Git status and summarize the current frontend, backend, infrastructure, and untracked changes in plain English. Distinguish pre-existing user files from implementation changes when the history makes that possible.
3. Do not redo the compliance implementation from scratch. Review the existing implementation and identify only concrete regressions, integration gaps, or unfinished owner tasks.

Phase 2 — reproduce the completed validation gate:

1. Run the frontend TypeScript check, lint, behavioral tests, production build, dependency audit, CloudFront router test, Terraform formatting/validation, IAM invariant checker, CloudFormation lint, workflow/shell syntax checks, secret-pattern scan, and `git diff --check`.
2. Run the backend full check (typecheck, lint, build, and tests), dependency audit, Terraform formatting/validation, IAM invariant checker, CloudFormation lint, secret-pattern scan, and `git diff --check`.
3. Report failures with exact evidence and fix only failures caused by the current implementation. Do not hide warnings; the known frontend main-chunk size warning is non-blocking unless it becomes a failure or materially worsens.

Phase 3 — implement the receive-only forwarding task above:

1. Reconfirm the live mail/DNS preflight and implement only `contact@codehawks.org` to the protected owner-selected UNG destination through Cloudflare Email Routing.
2. Preserve the website and Amazon SES configuration. Do not enable a catch-all, storage, mail Worker, Cloudflare outbound sending, or send-as functionality.
3. Keep personal destinations out of reusable Terraform defaults and secrets out of the repository. Update the protected GitHub environment/configuration documentation and minimally scoped Cloudflare token requirements.
4. Stop for the user to click Cloudflare's destination-verification email. Do not bypass verification or claim the address is verified.
5. Before any live mutation, show the exact reviewed Terraform plan and explain every DNS/routing change in plain English. Do not apply until the user explicitly approves that plan.
6. After approval, use the protected owner-reviewed workflow. Test with an unrelated external sender and verify the acceptance criteria above. Record the outcome and rollback procedure in this document.

Phase 4 — handoff and deployment safety:

1. Re-run the proportionate validation gate after forwarding changes and report the results.
2. Prepare a sensible commit plan separating frontend/application, backend/application, infrastructure/security, tests/documentation, and forwarding work where practical. Do not commit, push, open a pull request, or discard changes unless the user authorizes it.
3. Explain the one-time AWS-owner bootstrap migration before proposing any broader production deployment. The legacy routine infrastructure role must not install its own permissions fix.
4. For an approved full rollout, the required order is owner bootstrap migration, reviewed backend apply, SES DKIM-token handoff, reviewed frontend/domain apply, verification of SES/DKIM and forwarding health, then the human-owned SES production-access request. Never silently re-plan after approval.
5. Do not deploy, modify AWS, change DNS, send email, or perform another external mutation outside the exact action and approval currently given by the user.

## Verification and deployment gate

Local verification covers frontend TypeScript, JavaScript linting, behavioral tests, production build, backend type/lint/tests/build, dependency advisories, Terraform format/validation, CloudFormation lint, IAM invariants, CloudFront routing invariants, workflow syntax, and whitespace checks.

No Terraform plan/apply/destroy, website deployment, DNS change, email send, or other cloud mutation was performed in this review. Follow the owner actions above and the protected workflow instructions before making these controls live.
