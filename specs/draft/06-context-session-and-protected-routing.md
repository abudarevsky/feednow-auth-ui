# Phase 06 — Session discovery and protected routing

**Dependency:** Phases 03–05
**Handoff to:** Phases 07, 09, and 10

## Goal

Use the backend session to guard account pages and restore protected deep links
after Managed Login.

## Work boundary

- Replace the injected placeholder session seam with backend discovery and
  safe loading, expiry, unauthorized, network-error, and retry states.
- Full-page redirect unauthenticated protected requests to backend login,
  carrying the original account path and query through the backend's validated
  `next` contract. Preserve the destination through callback and reload.
- Keep product client context backend-authoritative; do not infer login from a
  frontend token or establish a second session.

## Acceptance criteria

- No protected content flashes before session resolution. Direct deep links,
  repeat visits, expired sessions, and callback return restore the requested
  destination without redirect loops or open redirects.
- Focused route tests run first, then `npm run check` and `npm run test:e2e`
  at 375/768/1280px with safe error and focus behavior.

## Non-goals

Password/challenge forms, Vispector authorization-code issuance, account data,
or frontend token storage.

## Handoff

Record route/session state transitions, browser results, and backend mount
assumptions.
