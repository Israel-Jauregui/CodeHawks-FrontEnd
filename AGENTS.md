# AGENTS.md

## Project

The website of the Software Engineering Club @ UNG, at codehawks.org. One static, prerendered page. Its job is to say who the club is, show where it has been, and send people to the Discord and UNG Connect.

**It stays static.** No accounts, forms, databases, APIs, analytics or cookies. An earlier version had all of those and nobody used them; Discord does that job. If a request needs a backend, say so and stop.

## Commands

```sh
npm ci
npm run dev       # dev server
npm run lint
npm test          # builds (type-check, bundle, prerender), then runs tests/
npm run photos    # convert photos-src/ and rewrite the photo list

cd infra
npm ci
npm test          # CloudFront Function and stack tests
npm run synth     # offline; needs no AWS credentials
```

## Where things are

```text
index.html              head metadata (title, description, Open Graph)
src/constants/club.ts   name, links, email: the single source for page, metadata and JSON-LD
src/constants/events.ts the events
src/constants/photos.generated.ts   written by `npm run photos`; never edit by hand
src/App.tsx             the page
src/components/         RetroWindow, BootTerminal, PhotoViewer, PhotoStrip, EventCard
src/styles.css          all styling
scripts/prerender.mjs   renders the page into dist/index.html, adds JSON-LD, writes the sitemap
infra/                  AWS CDK app (TypeScript, run with tsx)
```

## Rules

- **Look.** Follow the [club styling guide](https://github.com/Software-Engineering-Club-UNG/club-styling-guide), Typewriter look: Night blue page, Courier New for titles and labels, Tahoma or Verdana for sentences, square corners, hard offset shadows with no blur, one gold title. Use the palette variables at the top of `src/styles.css`; do not add colors or web fonts. The club logo files in `public/brand/` are used unaltered.
- **Voice.** Write like a commit message: short, specific, present tense. Name the club "Software Engineering Club" first, "SWE" after. "CodeHawks" is only the domain and a detail in window title bars. The old names (App Development Club, CodingWarriors) appear in exactly one footer line and the structured data.
- **Facts.** Do not invent event dates, results or meeting times. `when` and `result` in `events.ts` stay empty until someone supplies them. The site does not list a meeting schedule; it points to Discord and UNG Connect.
- **No inline styles or scripts.** The Content Security Policy is `default-src 'none'` with only same-origin scripts, styles and images. A React `style` prop, a `<style>` tag, a web font or any third-party URL will be blocked in production. The build fails on a `style` attribute. Styling goes in `src/styles.css`; if a value must be computed, set it from an effect with `element.style.setProperty` as `PhotoStrip.tsx` does. A change to what the page loads needs the same change in `infra/lib/config.ts`.
- **Everything is in the HTML.** The page is prerendered so search engines and link previews get all of it. Render content on the server pass, not only in effects, and keep the seeded starfield deterministic.
- **Accessibility.** Alt text on every image, tap targets at least 44px, visible focus, and every animation switched off under `prefers-reduced-motion`.
- **Photos.** Originals go in `photos-src/<event>/` and are git-ignored. Only the converted, metadata-free files in `public/photos/` are committed. Never commit an original.

## AWS

- All AWS resources are defined in `infra/` and changed with the **Deploy infrastructure** workflow, which shows `cdk diff`, waits for the owner's approval, then runs `cdk deploy`. Do not change resources in the console or with ad hoc CLI commands; if you do, the next deploy will not match.
- Do not run `cdk deploy` or other mutating AWS commands from an agent session unless the owner asks for it in that session.
- DNS is on Cloudflare and is not managed by code. The records are listed in `docs/RUNBOOK.md`.
- The account's GitHub OIDC provider is shared with the Hacklonega site. Reference it; never create or delete it here.
- Never add AWS keys to GitHub or the repository. Workflows use OIDC.

## Conventions

- Conventional commits (`feat:`, `fix:`, `docs:`, `chore:`), branches prefixed `feature/`, `bugfix/` or `docs/`, changes to `main` by pull request.
- Functional React components, one per file, PascalCase file names. No new runtime dependencies without a strong reason.
- Comments explain why, not what. The maintainer knows HTML, CSS and JavaScript well and is newer to React, so a short note on a non-obvious hook or effect is welcome.
