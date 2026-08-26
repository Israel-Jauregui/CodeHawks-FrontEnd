# CodeHawks compliance and production-readiness review

Reviewed: August 26, 2026

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

## `contact@codehawks.org` forwarding activation record

Decision updated August 24, 2026: the owner selected `contact@codehawks.org` as the single public privacy/support and newsletter Reply-To address. Cloudflare Email Routing handles receive-only forwarding for that exact address. Amazon SES remains the outbound provider for `noreply@codehawks.org` and newsletters.

- **Status/result:** Active. The protected onboarding apply completed on August 25, 2026 in run `32868244202`, after the owner verified the protected UNG destination. The final protected apply completed at `2026-08-25T16:51:56Z` in run `32874388272` and created only `cloudflare_email_routing_rule.contact[0]`: `1 added, 0 changed, 0 destroyed`.
- **Reviewed-plan provenance:** Final plan run `32874061178`, commit `e604be74e5390dfedd1a96cfc5f6b761a974f5f4`, approved bundle SHA-256 `f9f8686e57a685fabff4270793a8d50191bc7c66c61e7424582c70a18256f25d`. The apply workflow verified that exact run, commit, and digest and did not create a replacement plan.
- **Terraform/live scope:** State serial 13 reports one verified destination, Email Routing `ready`, and one enabled rule whose literal matcher is exactly `contact@codehawks.org` with one `forward` action. No catch-all, email storage, mail Worker, Cloudflare outbound sending, or send-as behavior was enabled.
- **Protected value:** The approved destination is stored only in the `infrastructure-production` environment secret `EMAIL_FORWARDING_DESTINATION`. It has no Terraform default and is not emitted as an output. The Cloudflare credential is a scoped API token, not a Global API Key; its minimum permissions are documented in `infrastructure/README.md`.
- **Human delivery evidence (August 26, 2026):** The owner sent from an unrelated external mailbox and confirmed delivery from `contact@codehawks.org` to the protected UNG inbox. The owner also tested an arbitrary unconfigured `@codehawks.org` address and confirmed that it did not forward. No message content or credential was recorded.
- **Reply-origin evidence (August 26, 2026):** The owner confirmed that a reply sent from the UNG inbox visibly appeared at the external mailbox with `ijaur3627@ung.edu` as `From`. The system intentionally does not provide `send as contact@codehawks.org`.
- **Post-apply health:** Cloudflare and Google public DNS agreed on the three Cloudflare MX records, one apex SPF record, the Email Routing DKIM record, the unchanged monitoring-only DMARC record, and all three SES Easy DKIM CNAMEs. SES reported identity verification and DKIM `SUCCESS` with signing enabled. The newsletter worker remained active with `CodeHawks <noreply@codehawks.org>` as sender and `contact@codehawks.org` as Reply-To. The apex site, `www` redirect, `/members`, 404 behavior, and security headers remained healthy.
- **Operational owner:** The CodeHawks repository/domain owner and holder of the protected UNG destination mailbox owns the Cloudflare destination/rule lifecycle, protected-environment approvals, periodic external-delivery checks, and officer handoff until that responsibility is formally reassigned.
- **Routine rollback:** Set protected `EMAIL_FORWARDING_RULE_ENABLED=false`, create and review a new plan that removes only `cloudflare_email_routing_rule.contact[0]`, and apply only that exact approved bundle. Leave `EMAIL_ROUTING_ONBOARDING_ENABLED=true`, the verified destination, and Cloudflare-managed MX/SPF/DKIM records intact. Removing Email Routing DNS is a separate destructive decision blocked by `prevent_destroy` and is not part of routine rollback.
- **Destination rotation:** Disable/remove the exact rule through the reviewed workflow, change the protected destination secret, apply the destination change, wait for the new owner to complete Cloudflare verification, and only then review and apply a plan that recreates the exact rule.

Acceptance status:

- **Passed:** External mail to `contact@codehawks.org` reaches the protected owner-selected UNG destination.
- **Passed:** Arbitrary, unconfigured `@codehawks.org` addresses do not forward.
- **Passed:** Replies visibly originate from the officer's UNG account.
- **Passed:** Website, SES newsletter configuration, Easy DKIM, SPF, and DMARC remained healthy after activation.
- **Passed:** The exact rule and destination can be disabled or rotated through separately reviewed owner-approved changes.

## Consolidated rollout status and remaining owner tasks

The production rollout order was preserved:

1. **Completed:** The MFA-protected AWS owner updated `codehawks-bootstrap`. The legacy routine AWS role did not install or widen its own permissions.
2. **Completed:** Reviewed backend apply run `32774467048` deployed the compliance/backend changes and newsletter `Reply-To: contact@codehawks.org`.
3. **Completed:** SES Easy DKIM tokens were handed from backend state to the domain-owning frontend state without replacing the SES identity.
4. **Completed:** The reviewed frontend/domain infrastructure and website were deployed.
5. **Completed:** SES, DKIM, website, and forwarding health were checked after activation; the human delivery, no-catch-all, and visible UNG reply-origin tests passed.
6. **Human-owned future action:** Request SES production access if newsletter sending must leave the SES sandbox. This account-level request is intentionally not automated and must not be submitted by the routine deployment role.

Remaining owner/compliance work outside this forwarding activation:

- Confirm the final registered operator name and any physical/registered address required by UNG or applicable law.
- Establish a monitored DMARC aggregate-report mailbox before proposing a move from `p=none` to enforcement.
- Keep the protected destination and operational owner current when club officers change.

Future infrastructure changes must continue to use the protected plan/apply workflow. Approval applies only to the displayed plan's run, commit, and bundle digest; never create or apply a different plan silently. Do not let the legacy routine role modify its own bootstrap permissions.

## Verification and deployment gate

The full pre-deployment validation covered frontend TypeScript, lint, behavioral tests, production build, dependency audit, CloudFront routing, Terraform formatting/validation, IAM invariants, CloudFormation lint, workflow/shell syntax, secret scanning, and diff checks, plus the corresponding backend full check, audit, Terraform, IAM, CloudFormation, secret, and diff checks. Proportionate live read-only checks after activation covered Terraform state, dual-resolver mail DNS, SES identity/DKIM, newsletter configuration, website routes, and security headers.

This closeout update is documentation-only. It does not authorize or perform another Terraform plan/apply, AWS or Cloudflare mutation, DNS change, email send, commit, push, or pull request.
