# Phase 03 — Routing, layouts, and local edge shape

**Dependency:** Phases 01 and 02  
**Handoff to:** Phases 06–11

## Goal

Make all intended UI paths routable with public/protected layouts and a local
development shape that matches production.

## Work boundary

- Add React Router paths for auth and account areas, route guards based on an
  injected session abstraction, 404 handling, and responsive shells.
- Configure Vite `/api/*` proxy to local `feednow-auth`; no component uses
  an API Gateway URL.
- Test direct route loading and unknown-route behavior.

## Acceptance criteria

- Public and protected paths render deterministic loading/unauthenticated states.
- Local proxy forwards API requests while frontend navigation remains local.
- No SPA fallback, proxy, or mock disguises an API error as HTML.

## Non-goals

Fetching a real session, login, or production CloudFront configuration.

## Handoff

Record route table, proxy configuration, and direct-navigation test evidence.

## Implementation handoff — 2026-09-24

- Route table: public `/login`, `/signup`, `/verify-email`, `/forgot-password`,
  `/reset-password`, and `/logout`; protected `/account`,
  `/account/security`, and `/account/api-keys`; `/` is the entry page and all
  unknown paths render a not-found page.
- Protected-route state is injected (`loading`, `unauthenticated`, or
  `authenticated`). `App` defaults to loading. No session discovery or auth
  operation is implemented in this phase.
- Vite proxies `/api/*` to `http://127.0.0.1:8000`, overridable with
  `FEEDNOW_AUTH_ORIGIN`. The integration test verified exact path forwarding
  and preservation of a mock 429 JSON response; `/login` remained SPA HTML.
- `npm ci` passed (381 packages installed, 0 vulnerabilities).
- `npm run check` passed: lint, strict TypeScript, 18 Vitest files / 93 tests,
  and production build.
- `npm run test:e2e` passed: 42 Chromium tests across 1280×800, 768×1024, and
  375×812, including direct navigation to every route, default protected
  loading, unknown-route handling, client-side navigation, viewport overflow,
  keyboard focus, and auth-card screenshots.
- No running backend, manual screen-reader session, physical tablet test,
  production CloudFront behavior, or deployed smoke test was exercised.
- Build-step commits: plan `93eba2e`; routes `989237d`; session guard
  `799e510`; responsive layouts `cfd8f9a`; local proxy `8763a4a`; browser
  evidence `80c3d63`.

## Follow-up verification — 2026-09-24

- User review found the protected loading state looked empty. The initial
  skeleton bars had only screen-reader text and a very subtle accent fill.
- Loading and unauthenticated guard states now render inside `AuthCard`; the
  loading state includes visible “Loading account page…” text and keeps its
  accessible status role. No session lookup was added.
- Focused verification passed: `npm run test --
  src/routes/route-guards.test.tsx src/components/state-blocks.test.tsx` (2
  files / 7 tests).
- Playwright passed 45 tests and now captures the protected loading card at all
  three viewports. Full `npm run check` and regular `npm run test:e2e` are
  repeated after this correction.
