# Phase 02 — Accessible emerald UI system

**Dependency:** Phase 01  
**Handoff to:** Phases 03 and 06–11

## Goal

Establish the restrained FeedNow/shadcn visual language and reusable accessible
primitives before user flows are built.

## Work boundary

- Configure slate/emerald tokens, typography, focus styles, form/error/status
  patterns, card, responsive navigation, loading skeleton, and destructive
  confirmation primitives.
- Build visual regression/component evidence at desktop and mobile widths.

## Acceptance criteria

- Tokens implement the specified contrast and no-color-only-state rules.
- Keyboard navigation, labels, errors, dialogs, focus restoration, and screen
  reader status behavior are tested for primitives.
- The auth card and account shell primitives fit mobile without overflow.

## Non-goals

Live auth/account calls or a product-specific marketing design.

## Handoff

Document primitives, accessible behavior, and viewport evidence.

## Implementation handoff — 2026-09-24

- `npm ci` completed successfully.
- `npm run check` passed: lint, strict TypeScript, 14 Vitest files / 84 tests,
  and production build.
- `npm run test:e2e` passed: 18 Chromium tests across 1280×800, 768×1024, and
  375×812 viewport projects. Six screenshot baselines are committed and pass
  comparison in the suite.
- Baselines were generated on macOS 26.6.2 with Playwright 1.63.0 and Chromium
  153.0.8010.12 (Playwright Chromium v1243). Environment and viewport details
  are recorded in the task-09 commit message.
- No manual screen-reader session, physical tablet-device test, deployed edge
  check, backend call, or live authentication flow was performed.
- Current-state behavior and the baseline refresh procedure are documented in
  `docs/README.md`.
