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