# Phase 04 — Typed browser API client

**Dependency:** Phase 01  
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

- Components can consume typed modules without distributed fetch calls.
- Tests cover validation, authentication, challenge, rate-limit, network, and
  malformed-response behavior without exposing raw error text.
- Sensitive data is neither logged nor retained beyond the requested flow.

## Non-goals

Login UI, account screens, backend routes, or token storage.

## Handoff

Publish API module contract coverage and required backend fixture/schema version.

## Implementation progress — 2026-09-24

Phase 04 is active but incomplete. At the user's direction, implementation
proceeds with the Phase 00 gate deferred. The Phase 00 summary has been moved
to `specs/done/`, but it contains no canonical browser endpoint mappings,
feature request/response schemas, CSRF bootstrap contract, or fixed CSRF
cookie/header names. The current service error envelope is frozen in the
`feednow-auth` source, but it is not a substitute for those browser contracts.

Implemented and committed:

- `0434c8b` — same-origin typed JSON transport, `/api/*` path validation,
  same-origin credentials, and cancellation passthrough.
- `8e2c319` — safe error normalization from recognized HTTP statuses and
  service codes; backend text and exception details are discarded.
- `02d0694` — configurable readable-cookie to request-header CSRF adapter for
  unsafe methods, without invented defaults.

The phase remains in `wip`. Auth, account, API-key, and client-context modules,
their payload schemas, and the real CSRF configuration remain deferred until
the Phase 00/05 browser contract is available. No backend request, production
endpoint, token storage, or sensitive-data logging was added.
