# Contributing

Thanks for helping with the Software Engineering Club's site. It is one static page, so most changes are small.

## Set up

You need Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

## Make a change

1. Branch from `main`: `feature/…`, `bugfix/…` or `docs/…`.
2. Make the change. The [README](README.md#change-it) says which file holds what.
3. Run `npm run lint` and `npm test`. Both must pass; CI runs the same two.
4. Open a pull request that says what changed and why. Add a screenshot for anything visual.

Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/): `feat: add HackGT photos`, `fix: correct the Discord link`.

## House rules

- **Follow the [club styling guide](https://github.com/Software-Engineering-Club-UNG/club-styling-guide).** Use the colors already defined at the top of `src/styles.css`. Square corners, hard shadows, no new fonts.
- **No inline styles.** The site's security policy blocks them, and the build fails if one slips in. Put styling in `src/styles.css`.
- **Keep it static.** No forms, sign-ins, trackers or third-party scripts.
- **Write alt text.** Every image says what it shows.
- **Don't guess facts.** Leave an event's date or result empty if you are not sure of it.

## Adding photos

1. Put the originals in `photos-src/<event>/`, where `<event>` is a slug from `src/constants/events.ts` (for example `photos-src/hackgt/`). iPhone HEIC files need exporting as JPEG first.
2. Run `npm run photos`.
3. Open `photos-src/<event>/captions.json` and replace each new placeholder line with a sentence describing the photo. Describe what is happening; do not name people.
4. Run `npm run photos` again, then commit `public/photos/`, the captions file and `src/constants/photos.generated.ts`.

The originals are git-ignored and never leave your machine. The published copies have all metadata removed, including location. Only add photos the people in them are happy to have on a public site.

## Infrastructure

Changes under `infra/` are reviewed by the repository owner and deployed with the **Deploy infrastructure** workflow. See [docs/RUNBOOK.md](docs/RUNBOOK.md).
