# Phase 04 — Typed browser API client

**Dependency:** Phases 00 and 01
**Handoff to:** Phases 06–10

## Goal

Provide a single safe typed transport boundary for the approved browser contract.

## Work boundary

- Implement API modules, request/response types, safe error normalization,
  request cancellation/loading conventions, and the reusable CSRF adapter for
  the retained contracts.
- Use contract fixtures/test server only; do not invent a production backend
  implementation in the UI.

## Acceptance criteria

- Components can consume the shared transport and spec-grounded typed modules
  without distributed fetch calls.
- Tests cover safe error mapping, rate-limit, network, malformed-response,
  cancellation, and retained profile/key path behavior without exposing raw
  error text.
- No custom credential or unverified session/account endpoint is exposed by
  the browser modules.
- Sensitive data is neither logged nor retained beyond the requested flow.

## Non-goals

Login UI, account screens, backend routes, or token storage.

## Handoff — complete 2026-09-24

The Managed Login specification is authoritative. Phase 00 remains a historical
contract record where it conflicts with that specification. The shared
transport, safe error mapper, and configurable CSRF adapter are retained. The
browser modules retain only the existing profile and API-key contracts in the
Phase 00 inventory; no custom credential API is exposed. Phase 05 owns login
and logout navigation integration, session discovery, CSRF bootstrap and
validation, the cookie-auth bridge, Vispector handoff, and new account data.

Earlier commits implemented the shared transport, safe error mapper, and CSRF
adapter. The typed custom-auth modules were also committed at that point, but
their proposed endpoint contract has since been superseded by the Managed
Login reconciliation below. Those historical commits remain in Git; the
current source exposes only typed profile and API-key schema calls.

- `0434c8b` — same-origin typed JSON transport, `/api/*` path validation,
  same-origin credentials, and cancellation passthrough.
- `8e2c319` — safe error normalization from recognized HTTP statuses and
  service codes; backend text and exception details are discarded.
- `02d0694` — configurable readable-cookie to request-header CSRF adapter,
  without invented defaults.

The earlier module implementation used the Phase 00 draft contract. It is not
current implementation evidence and must not be treated as approval for those
custom-auth routes.

## Managed Login reconciliation

The typed client has been reconciled with the Managed Login specification.
Credential, challenge, registration, verification, recovery,
federation, custom session/logout, client-context, profile-mutation, and
security calls/types, and custom-credential-only error-code mappings, are
removed. Only profile and API-key contracts identified in the Phase 00
inventory remain. The specification names `/oauth/login` and
`/oauth/callback` for Phase 05 reuse.
Logout, browser-session, CSRF bootstrap, and Vispector handoff integration
remain Phase 05 work. The earlier Phase 00 custom-credential paths are
historical where they conflict with the Managed Login specification. This
phase makes no claim about live service mounting, cookie authorization, or
deployed behavior.

Focused verification: `npm run test -- src/api/browser-modules.test.ts`
passed (3 tests); `npm run test -- src/lib/dev-proxy.test.ts` passed (1 test).
The final `npm run check` passed: lint, typecheck, 131 tests across 22 files,
and production build. E2E was not run because no route or visible UI flow
changed. No live backend, Cognito, CloudFront, or deployment behavior was
tested.

Task commits: `0434c8b` transport; `8e2c319` safe errors; `02d0694` CSRF
adapter; `0f4caa6` initial typed modules (reconciled by `a245246`); `afde58d`
local proxy mapping; `44f1dbd` Phase 03 proxy evidence; `e190601` spec-grounded
Phase 04 contract correction. The task breakdown records the commit sequence.
