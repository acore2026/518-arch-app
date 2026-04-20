# Repository Guidelines

## Project Structure & Module Organization
This is a small Vite + React + TypeScript app with a flat structure at the repository root. `main.tsx` boots the app, `App.tsx` contains the main UI and interaction logic, and `style.css` holds global styling. Build output goes to `dist/` and should not be edited by hand. End-to-end coverage currently lives in `video-check.spec.ts`. Reference or scratch material may appear under `fyi/`; keep production code in the root unless the project is refactored into `src/`.

## Build, Test, and Development Commands
- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite dev server on `http://localhost:7100`.
- `npm run build`: run TypeScript checks and create a production bundle in `dist/`.
- `npm run preview`: serve the built app locally on port `7100`.
- `npx playwright test video-check.spec.ts`: run the Playwright check against a running local dev server.

## Coding Style & Naming Conventions
Use TypeScript with React function components and hooks. Follow the existing style: 2-space indentation, semicolons, and single quotes in `.ts`/`.tsx` files. Use `PascalCase` for components (`App.tsx`), `camelCase` for variables and functions (`triggerDegradation`), and descriptive state names for hooks. Keep UI behavior grouped logically instead of scattering related state across files.

## Testing Guidelines
Playwright is the current test framework. Name browser tests with the `*.spec.ts` suffix and keep assertions user-visible where possible. Since `package.json` does not define a working `npm test` yet, run Playwright directly. Before opening a PR, verify `npm run build` succeeds and rerun the relevant Playwright spec if UI behavior, video playback, or screenshots changed.

## Commit & Pull Request Guidelines
The current history uses short, imperative commits such as `Initial project import`. Continue that pattern: concise subject line, no trailing period, one logical change per commit. PRs should include a brief summary, testing performed, and screenshots when UI output changes. Link the relevant issue or task when one exists.

## Configuration Notes
Do not commit `node_modules/`, `dist/`, `test-results/`, or local tool state directories. Remote media URLs are used in the demo video player, so verify external asset availability when debugging playback issues.
