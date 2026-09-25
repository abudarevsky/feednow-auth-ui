# Phase 11 — Logout, cross-flow E2E, and accessibility

**Dependency:** Phases 07–10
**Handoff to:** Phases 13 and 14

## Goal

Verify the complete account journey and close logout, navigation, responsive,
and accessibility gaps.

## Work boundary

- Navigate through backend logout and Cognito logout, clear privileged view
  state, and follow only a backend-approved signed-out destination. Cover
  Vispector product-session handoff/cleanup in the registered contract.
- Browser-test protected deep links, existing/new sessions, Vispector return,
  legacy auth redirects, profile/status/subscription/usage/admin capability
  states, API keys, session expiry, logout, and direct-route reloads.
- Test 375/768/1280px layouts, keyboard/focus, semantic status/error messages,
  and API-versus-SPA error behavior.

## Acceptance criteria

- Logout ends the central session and cannot be bypassed by stale frontend
  state or arbitrary return URLs. Reloading a protected route re-enters backend
  login. Cognito logout behavior is separately verified in non-production.
- Focused tests run first, followed by `npm run check` and `npm run test:e2e`;
  accessibility and manual browser evidence is recorded without treating mocks
  as live-provider proof.

## Non-goals

CloudFront deployment, production promotion, custom auth forms, or Shopify.

## Handoff

Publish commands, results, limitations, and deployed smoke requirements.
