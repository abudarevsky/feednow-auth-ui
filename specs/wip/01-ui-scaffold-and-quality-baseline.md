# Phase 01 — UI scaffold and quality baseline

**Dependency:** Phase 00  
**Handoff to:** Phases 02, 03, 04, and 12

## Goal

Create a runnable static React/Vite application with a reproducible quality
baseline, without authentication behavior.

## Work boundary

- Initialize TypeScript, React, Vite, Tailwind, shadcn/ui prerequisites, package
  scripts, lockfile, linting, TypeScript checking, unit/component test runner,
  and browser E2E runner.
- Pin Node LTS in `.nvmrc` and expose `dev`, `lint`, `typecheck`,
  `test`, `test:e2e`, `build`, `check`, and `preview` scripts.
- Use Vitest + React Testing Library + MSW for isolated UI/API tests and
  Playwright for browser flows; test fixtures must not call AWS or Cognito.
- Add the agreed source layout and a minimal renderable route; establish build
  output suitable for static hosting.
- Document exact local commands and version assumptions.

## Acceptance criteria

- Clean install, lint, typecheck, tests, production build, and one browser
  smoke test pass from documented commands.
- `npm ci && npm run check` is the repeatable default local gate; the
  documented E2E command runs against the built static artifact.
- No Next.js/server runtime, API proxy implementation, Cognito SDK, tokens, or
  auth behavior is introduced.

## Non-goals

Final visual system, account routes, backend calls, or AWS resources.

## Handoff

Record commands/results and the generated source/layout contract for consumers.
