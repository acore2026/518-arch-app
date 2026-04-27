# Repository Guidelines

## Project Structure & Module Organization

This is a Vite + React + TypeScript app with production modules at the repository root. `main.tsx` boots the app and `App.tsx` owns top-level orchestration/state. Large UI surfaces are split into focused components such as `IntentExperience.tsx`, `ControlsSheet.tsx`, `ShowcaseExperiences.tsx`, `CloudGame.tsx`, and `UpgradeModal.tsx`. Shared domain types live in `app-types.ts`; intent helpers live in `intent-utils.ts`; backend/socket and compute-node logic live in their own `*-config.ts`, `*-repository.ts`, or scenario modules. Build output goes to `dist/` and should not be edited by hand. Browser coverage lives in `video-check.spec.ts`; unit tests use `*.test.ts`.

## Build, Test, and Development Commands

- `npm install`: install dependencies from `package-lock.json`.
- `npm run dev`: start the Vite dev server on `http://localhost:7100`.
- `npm run build`: run TypeScript checks and create a production bundle in `dist/`.
- `npm run preview`: serve the built app locally on port `7100`.
- `npm test`: run Vitest unit tests.
- `npx playwright test video-check.spec.ts`: run the Playwright check against a running local dev server.

## Coding Style & Naming Conventions

Use TypeScript with React function components and hooks. Follow the existing style: 2-space indentation, semicolons, and single quotes in `.ts`/`.tsx` files. Use `PascalCase` for components (`ControlsSheet.tsx`), `camelCase` for variables and functions (`triggerDegradation`), and descriptive state names for hooks. Keep orchestration in `App.tsx`; move reusable UI, domain helpers, and IO clients into focused modules.

## Testing Guidelines

Vitest covers unit-level helpers and repositories; Playwright covers the user-visible app flow. Name unit tests with the `*.test.ts` suffix and browser tests with the `*.spec.ts` suffix. Before opening a PR, verify `npm test` and `npm run build` succeed, and rerun the relevant Playwright spec if UI behavior, video playback, or screenshots changed.

## Commit & Pull Request Guidelines

The current history uses short, imperative commits such as `Initial project import`. Continue that pattern: concise subject line, no trailing period, one logical change per commit. PRs should include a brief summary, testing performed, and screenshots when UI output changes. Link the relevant issue or task when one exists.

## Configuration Notes

Do not commit `node_modules/`, `dist/`, `test-results/`, or local tool state directories. Remote media URLs are used in the demo video player, so verify external asset availability when debugging playback issues.
