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

- Components can consume typed modules without distributed fetch calls.
- Tests cover validation, authentication, challenge, rate-limit, network, and
  malformed-response behavior without exposing raw error text.
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

Implemented and committed:

- `0434c8b` — same-origin typed JSON transport, `/api/*` path validation,
  same-origin credentials, and cancellation passthrough.
- `8e2c319` — safe error normalization from recognized HTTP statuses and
  service codes; backend text and exception details are discarded.
- `02d0694` — configurable readable-cookie to request-header CSRF adapter for
  unsafe methods, without invented defaults.
- Typed context, auth, account, security, and API-key modules from the Phase 00
  schema; fixed FeedNow CSRF configuration; and safe mapping for the
  contract's `invalid_credentials` and `account_disabled` codes.

The module tests use mocked fetch and verify canonical paths, request bodies,
opaque path/query encoding, and CSRF header injection. `npm run check` passed:
lint, typecheck, 129 Vitest tests, and production build. E2E was not run because
this task adds no UI flow or route. The local Vite proxy still forwards `/api`
unchanged and must receive the Phase 00 one-segment rewrite before local
service integration; this is recorded as a corrective follow-up. No live
backend, Cognito, CloudFront, or deployment behavior was tested. Phase 04
remains in `wip` pending that correction and review.
