# Phase 04 — Typed browser API client

**Dependency:** Phases 00 and 01
**Handoff to:** Phases 06–10

## Goal

Provide a single safe typed transport boundary for the approved browser contract.

## Work boundary

- Implement API modules, request/response types, safe error normalization,
  request cancellation/loading conventions, and CSRF header/cookie support from
  Phase 00.
- Use contract fixtures/test server only; do not invent a production backend
  implementation in the UI.

## Acceptance criteria

- Components can consume the shared transport and source-backed typed modules
  without distributed fetch calls.
- Tests cover safe error mapping, rate-limit, network, malformed-response,
  cancellation, and retained profile/key path behavior without exposing raw
  error text.
- No custom credential or unverified session/account endpoint is exposed by
  the browser modules.
- Sensitive data is neither logged nor retained beyond the requested flow.

## Non-goals

Login UI, account screens, backend routes, or token storage.

## Handoff

Publish API module contract coverage and required backend fixture/schema version.

## Implementation progress — 2026-09-24

Phase 04 is active but incomplete. The user authorized proceeding before Phase
00 was reconciled; the missing contract is now recorded in
`specs/done/00-contract-reconciliation.md`. That document defines canonical
browser paths and schemas, names `feednow_csrf` and `X-CSRF-Token`, and labels
all new routes as Phase 05 work. The backend error envelope and currently
frozen `/v1` schemas remain distinguished from proposed browser additions.

Earlier commits implemented the shared transport, safe error mapper, and CSRF
adapter. The typed custom-auth modules were also committed at that point, but
their proposed endpoint contract has since been superseded by the Managed
Login reconciliation below. Those historical commits remain in Git; the
current source exposes only verified profile and API-key schema calls.

- `0434c8b` — same-origin typed JSON transport, `/api/*` path validation,
  same-origin credentials, and cancellation passthrough.
- `8e2c319` — safe error normalization from recognized HTTP statuses and
  service codes; backend text and exception details are discarded.
- `02d0694` — configurable readable-cookie to request-header CSRF adapter,
  without invented defaults.

The earlier module implementation used the Phase 00 draft contract. It is not
current implementation evidence and must not be treated as approval for those
custom-auth routes.

## Managed Login revision — pending acceptance

The typed client has been reconciled with the Managed Login implementation
review. Credential, challenge, registration, verification, recovery,
federation, custom session/logout, client-context, profile-mutation, and
security calls/types, and custom-credential-only error-code mappings, are
removed. Only source-backed profile and API-key schemas remain. The backend's
OAuth router defines `/oauth/login` and
`/oauth/callback`, but `create_app()` mounts only health by default and there
is no logout, browser session, CSRF bootstrap, or Vispector handoff route.
Navigation and cookie-session behavior therefore remain Phase 05 work. This
does not prove that optional profile or API-key routers are mounted in a
running service or that they support browser cookies.

Focused verification: `npm run test -- src/api/browser-modules.test.ts` passed
(3 tests). `npm run check` passed: lint, typecheck, 131 tests across 22 files,
and production build. E2E was not run because no UI route or flow changed. No
live backend, Cognito, CloudFront, or deployment behavior was tested.
