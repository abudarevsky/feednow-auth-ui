# feednow-auth-ui current state

Phase 01 (UI scaffold and quality baseline) is implemented and locally
verified. The repository contains a static React + TypeScript + Vite
application scaffold only: no authentication behavior, API client, backend
calls, routing library, AWS resources, or deployment.

## What exists

- `src/main.tsx` renders `src/App.tsx`, which renders the placeholder route
  component `src/routes/home.tsx`. No React Router yet (Phase 03).
- Tailwind CSS v4 via `@tailwindcss/vite`, and shadcn/ui prerequisites only:
  `components.json`, the `@/` path alias, and the `cn()` helper in
  `src/lib/utils.ts`. No design tokens or feature components (Phase 02).
- Vitest + React Testing Library + MSW suite under `src/`: the placeholder
  renders, and MSW provably intercepts a relative `/api/...` fetch so
  API-boundary tests never touch the network.
- Playwright Chromium smoke test in `e2e/` against the production build
  served by `npm run preview`.
- ESLint flat config (typescript-eslint + react-hooks) covering `src/` and
  `e2e/`; strict TypeScript via project references (`tsconfig.app.json`,
  `tsconfig.node.json`).

## Local commands

Node 22 LTS is pinned in `.nvmrc`; use it rather than a machine-global Node.

```text
npm ci                         # clean, lockfile-respecting install
npm run dev                    # Vite dev server on port 3000
npm run lint                   # ESLint
npm run typecheck              # tsc -b (noEmit checks over src/, e2e/, vite.config.ts, playwright.config.ts)
npm run test                   # Vitest, non-watch
npm run test:e2e               # Playwright, non-watch; builds then previews dist/
npm run build                  # production TypeScript + Vite static build
npm run check                  # lint + typecheck + test + build (default gate)
npm run preview                # serve the built artifact for E2E/smoke only
```

E2E prerequisite (one-time per machine): `npx playwright install chromium`.

The deliverable is static build output (`dist/`) intended for private S3
hosting behind CloudFront (Phase 12); no server runtime is produced.

## Source layout contract

Later phases place code in: `src/api/` (transport), `src/routes/` (routes),
`src/components/` (reusable UI), `src/hooks/` (route-independent hooks),
`src/types/` (shared types), and `src/lib/` (helpers). Today only
`src/routes/`, `src/lib/`, and `src/test/` exist; the others arrive with
their phases.

Future behavior is specified in `specs/`; do not present it as current state
until the corresponding phase has been accepted and this document is updated.
