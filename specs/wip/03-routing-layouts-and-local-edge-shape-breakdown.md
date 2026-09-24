# Phase 03 implementation breakdown — Routing, layouts, and local edge shape

This breakdown is the approved build sequence for Phase 03. Each numbered
build step is one commit and must be completed and reviewed before starting the
next. The app must remain runnable after each step.

## Build steps

1. Add the router and all named route entries
   - Scope: `package.json`, `package-lock.json`, `src/App.tsx`,
     `src/routes/route-placeholders.tsx`, `src/routes/router.tsx`, and focused
     route-table tests.
   - Change: Add React Router and define the canonical paths `/login`,
     `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`,
     `/logout`, `/account`, `/account/security`, and `/account/api-keys` from
     the merged UI specification. Replace the temporary gallery as the `/`
     route with a deliberate not-found/entry state; route placeholders must be
     explicit and safe, with no auth or API behavior.
   - Non-goal: No session lookup, login, API calls, or final flow forms.
   - Focused verification: route-table unit test verifies every canonical path
     maps to its intended route identity and unknown paths have a defined
     fallback.
   - Handoff checks: `npm run check`.
   - Rollback: Revert this commit; removes router dependency and route table,
     restoring the Phase 02 gallery entry point.

2. Add injected session state and protected-route outcomes
   - Scope: `src/types/session.ts`, `src/routes/session-context.tsx`,
     `src/routes/route-guards.tsx`, related unit tests, and `src/App.tsx`.
   - Change: Define a small injected session interface with `loading`,
     `unauthenticated`, and `authenticated` states. Protected account routes
     render the existing loading block while loading and a deterministic
     unauthenticated state when signed out; authenticated state proceeds to
     route content. Default application session is loading until a later phase
     supplies a real backend-backed provider. Public routes remain accessible
     regardless of session state.
   - Non-goal: No session discovery, redirect/query interpretation, persistence,
     login or logout operation (Phase 06 onward).
   - Focused verification: tests inject each session state and assert loading,
     unauthenticated, and authenticated outcomes plus public-route behavior.
   - Handoff checks: `npm run check`.
   - Rollback: Revert this commit; removes the injected session seam and guard
     while leaving route definitions.

3. Apply responsive public/account layouts and unknown-route handling
   - Scope: `src/routes/*`, `src/App.tsx`, route/layout tests.
   - Change: Put public route placeholders inside the existing `AuthCard`,
     account route placeholders inside the existing `AccountShell` with
     canonical links and active state, and render a clear not-found page for
     unknown paths. Account navigation uses React Router links so navigation
     stays client-side. Preserve content-sized layouts on mobile.
   - Non-goal: No flow-specific forms, account data, or mutation controls.
   - Focused verification: component tests assert landmarks, headings, active
     route semantics, and link destinations.
   - Handoff checks: `npm run check`.
   - Rollback: Revert this commit; restores route placeholders without shared
     layouts.

4. Configure and verify the local `/api/*` development proxy
   - Scope: `vite.config.ts`, focused proxy configuration/integration test, and
     only test support needed to run a local ephemeral upstream.
   - Change: Proxy `/api` requests to the documented local `feednow-auth`
     development server (`http://127.0.0.1:8000`), preserving the request path
     and response status/content type/body. Do not proxy or rewrite frontend
     routes to the backend. Verify an upstream API error is returned as that
     error, never `index.html`.
   - Non-goal: No production CloudFront behavior, backend implementation, or
     fallback changes.
   - Focused verification: deterministic local proxy test against an ephemeral
     HTTP server checks path forwarding and a non-2xx JSON response; a frontend
     route still serves the SPA shell.
   - Handoff checks: `npm run check`.
   - Rollback: Revert this commit; removes the development proxy and test
     support; no data or migration effect.

5. Prove direct route loading and responsive navigation in Playwright
   - Scope: `e2e/routing.spec.ts`, `playwright.config.ts` only if required.
   - Change: Against the built artifact, navigate directly to every public
     route, verify account paths show the deterministic default loading state,
     check unknown-route handling and in-app account navigation where an
     authenticated provider is injected in a test harness, and assert no
     horizontal overflow at the existing 1280, 768, and 375 pixel projects.
   - Non-goal: No live backend, Cognito, deployed edge, or real session claims.
   - Focused verification: `npm run test:e2e`.
   - Handoff checks: `npm run check && npm run test:e2e`.
   - Rollback: Revert this commit; removes route browser coverage only.

6. Document the Phase 03 route and local-edge handoff
   - Scope: `docs/README.md`, `specs/wip/03-routing-layouts-and-local-edge-shape.md`.
   - Change: Document the route table, layouts, injected session-state seam,
     Vite proxy target and behavior, exact verification outcomes, and checks
     not performed. Move the phase from `specs/wip/` to `specs/done/` only
     after all preceding commits and phase gates have succeeded.
   - Non-goal: No claims about Phase 06 session discovery, production edge
     configuration, backend endpoints, or deployed behavior.
   - Focused verification: verify documented routes/proxy match source and
     phase handoff evidence matches recorded command output.
   - Handoff checks: `npm ci && npm run check && npm run test:e2e`.
   - Rollback: Revert documentation and lifecycle move; no code/data effect.

