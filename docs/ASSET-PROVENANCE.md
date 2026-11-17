# Asset provenance

Where every image, logo and font came from, and whether we may use it.

| Asset | Source and rights | Use |
| --- | --- | --- |
| Page layout, `swe.` wordmark, boot terminal, pixel `SWE` lettering | Newly authored React, CSS and SVG in this repository (`src/App.tsx`, `src/components/BootTerminal.tsx`, `src/components/PixelWord.tsx`). The lettering is drawn on the styling guide's 5 × 7 grid | Site artwork |
| Retro windows, photo viewer, photo strip, starfield, mountain backdrop | Ported from the club's own [Hacklonega site](https://github.com/Israel-Jauregui/Hacklonega), which took them from the club's [countdown screens](https://github.com/Software-Engineering-Club-UNG/hacklonega-countdown) | `src/components/` |
| Spinning steeple ball beside the logo | The Dahlonega steeple artwork and the WebGL sphere from the club's own [Hacklonega site](https://github.com/Israel-Jauregui/Hacklonega) (`DahlonegaScene.tsx`, `steeple-sphere.ts`), with the squeezing and throwing removed. The artwork is saved as two static files so no in-memory images are needed | `public/brand/steeple-front.svg`, `steeple-back.svg`, `src/lib/steeple-spinner.ts`, `src/components/SteepleSpinner.tsx` |
| SWE club mark and prompt lockup | [club-styling-guide](https://github.com/Software-Engineering-Club-UNG/club-styling-guide) `assets/logo/swe-mark.svg` and `swe-prompt.svg`, unaltered | `public/brand/`, `public/favicon.svg` |
| App icons (`favicon-48.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) | Resized from the styling guide's `swe-mark-1024.png`; nothing else changed | Browser and home-screen icons |
| Link preview image (`public/og-swe.png`) | Rendered at 1200 × 630 from `brand/og.html`, which adapts the styling guide's `templates/event-banner.html`. Set in JetBrains Mono (SIL Open Font License), loaded from Google Fonts only when rendering; the site itself ships no font files | Open Graph and Twitter previews |
| Hacklonega photos (`public/photos/hacklonega/`) | Taken at Hacklonega on October 24, 2026 and provided by the organizers. Copied from the Hacklonega site's published set: upright, sRGB WebP, all metadata removed, including location | Photo viewer, photo strip, event card |
| Photos added later | Taken by club members at the event named by their folder. Converted by `scripts/photos.mjs`, which removes all metadata. Add a row here for any photo the club did not take | `public/photos/<event>/` |
| Event names (ICPC, HackGT, Hacklanta, CodeLinc, Hacktoberfest, MLH) | Named in text only, to say where the club competed. No logos or artwork from any of them are used | Event cards |
| Typography | System fonts: Courier New for titles and labels, Tahoma or Verdana for sentences | No font files are shipped |

The club is a student organization, not the university. No official University of North Georgia logos, seals or athletics marks are used. A UNG logo is visible on a projector screen in one event photo, as it was in the room.
