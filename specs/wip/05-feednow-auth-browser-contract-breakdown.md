# Phase 05 breakdown — Backend browser and OAuth contract

**Status:** active, selected by the user's 2026-09-25 resume instruction.
**Repository:** `feednow-auth` for service tasks; this file remains in the UI
planning checkout.
**Current dependency state:** backend Phase 11 is in `specs/done/`, but its
handoff explicitly leaves deployed-dev operational acceptance open. Backend
Phase 13 is also in `specs/done/`; there is currently no backend WIP phase.
Implement and test the spec-defined local contracts, but preserve the open
deployed-dev acceptance gap in handoff evidence.
**Contract authority:** the Managed Login UI specification, this phase's
specification, and the retained parts of
[`00-contract-reconciliation.md`](../done/00-contract-reconciliation.md).
Backend source is implementation evidence only. The superseded custom
credential, registration, verification, recovery, and federation APIs are
excluded.

Each numbered item is one independently reviewable commit. Do not start a
later item until the current item has its focused evidence and commit.

## Build steps

### 1. Add typed session and trusted client-context consumers — complete

- **Scope:** UI `src/api/session.ts`, `src/types/browser-api.ts`,
  `src/api/browser-modules.test.ts`, and a focused API-module test if needed.
- **Change:** Add typed readers for `GET /api/v1/session` and
  `GET /api/v1/auth/context?client_id=…` using only the retained Phase 00
  schemas: authenticated/unauthenticated session variants and backend-supplied
  client display metadata. Encode the opaque `client_id`; make no auth or
  navigation decision from its value. This implements browser request
  contracts only and does not claim that the service routes are mounted.
- **Focused verification:** `npm run test -- src/api/browser-modules.test.ts`
  passed (5 tests), covering both session variants, exact paths/query
  encoding, methods, same-origin credentials, and typed response fixtures.
- **Full handoff checks:** `npm run check` passed (lint, typecheck, 133 tests
  across 22 files, and production build). E2E was not run because no visible
  route or user flow changed. The proxy test required local loopback
  permission. `git diff --check` passed.
- **Rollback:** revert the added API module, types, and tests; no storage or
  migration effect.
- **Non-goal:** no session provider, protected-route behavior, trusted-client
  registration, or claim that mocked responses prove backend behavior.

### 2. Add typed CSRF-bootstrap, logout, and handoff consumers — complete

- **Scope:** UI `src/api/`, `src/types/browser-api.ts`, and focused
  API-module tests.
- **Change:** Add spec-defined same-origin calls for `GET /api/v1/csrf`,
  `POST /api/v1/logout`, and `POST /api/v1/auth/handoff`. Preserve the
  204/no-body responses, use `feednow_csrf` / `X-CSRF-Token` only for unsafe
  methods, and return the backend-provided one-time `redirect_url` without
  constructing or approving it in the browser. Preserve the generic
  transport's safe error mapping and cancellation.
- **Focused verification:** `npm run test -- src/api/browser-modules.test.ts`
  passed (6 tests), asserting exact methods, paths, JSON bodies, 204 handling,
  CSRF header use only on unsafe requests, nullable handoff state, and opaque
  backend handoff URL pass-through.
- **Full handoff checks:** `npm run check` passed (lint, typecheck, 134 tests
  across 22 files, and production build). E2E was not run because no browser
  flow or route changed. `git diff --check` passed.
- **Rollback:** revert the new clients/types/tests; no data migration.
- **Non-goal:** no UI logout/handoff flows, automatic mutation retries,
  redirect allowlist, or client-side session/capability authority.

### 3. Pin OAuth path rewrite and API-failure separation — complete

- **Scope:** UI `src/lib/dev-proxy.test.ts`; modify
  `src/lib/dev-proxy.ts` only if the focused test proves the existing behavior
  does not match the spec.
- **Change:** Verify `/api/oauth/login` and `/api/oauth/callback` each lose
  exactly one leading `/api` segment, preserve query/method/body, and return
  backend error status/content unchanged. Confirm frontend SPA fallback is
  confined to browser routes. Never normalize Cognito/backend errors into an
  HTML fallback.
- **Focused verification:** `npm run test -- src/lib/dev-proxy.test.ts`
  passed (1 test) with an ephemeral upstream; it covers both OAuth paths,
  401/429 JSON preservation, and method/body/cookie/header forwarding.
- **Full handoff checks:** `npm run check` passed (lint, typecheck, 134 tests
  across 22 files, and production build). E2E was not run because the proxy
  source and visible routing did not change. `git diff --check` passed.
- **Rollback:** revert the test and any proxy correction; no runtime data
  effect.
- **Non-goal:** no CloudFront changes or claim of deployed edge behavior.

### 4. Mount and verify the backend-owned OAuth browser entry points

- **Scope:** `feednow-auth`: `src/app/api/oauth.py`,
  `deploy/aws/runtime/handler.py`, OAuth route integration tests, and the
  narrow runtime configuration documentation needed for this route.
- **Change:** Keep the existing backend-owned `GET /oauth/login` and
  `GET /oauth/callback` contract. Verify the session configuration gate mounts
  both in the intended service composition root, and verify the local
  same-origin `/api/oauth/*` requests strip exactly the single `/api` prefix
  before reaching those backend paths. Callback and return targets remain
  backend-validated; the browser does not construct Cognito URLs or exchange
  codes. CloudFront deployment behavior remains Phase 13.
- **Focused verification:** focused OAuth login/callback integration tests,
  including mounted-route, rejected-return, replay, safe-error, and redirect
  cases; test the local `/api/oauth/*` path mapping and API-error preservation.
- **Full handoff checks:** backend `pytest` suite and UI `npm run check`;
  include `npm run test:e2e` if a browser route or redirect changes. Record
  live Cognito/deployment checks separately; mocks do not satisfy them.
- **Rollback:** revert this commit; the service returns to its previously
  mounted route/configuration state. No data migration.
- **Non-goal:** no Cognito client changes, CloudFront deployment, UI login
  forms, or frontend code exchange.

### 5. Add browser session discovery and trusted client context

- **Scope:** `feednow-auth`: backend API router/schema/dependency modules and
  focused integration tests for `GET /v1/session` and
  `GET /v1/auth/context?client_id=…`.
- **Change:** Implement the retained contract schemas: session discovery
  returns either authenticated user summary or an unauthenticated result;
  client context is resolved from backend registration and supplies display
  metadata. Ignore browser-supplied branding, callback, and destination
  claims. Use the opaque `feednow_session` cookie issued in Phase 11.
- **Focused verification:** tests for anonymous/valid/expired sessions,
  unknown client, trusted returned metadata, and attempts to substitute
  browser-supplied values; assert safe envelopes and no secret/cookie values
  in logs.
- **Full handoff checks:** backend `pytest` suite; UI `npm run check` after
  updating only the typed contract fixtures if needed.
- **Rollback:** revert router/schema/tests; no storage migration.
- **Non-goal:** no frontend session guard (Phase 06), no client registration
  bootstrap, and no authorization decision in the browser.

### 6. Bridge the central session to approved `/v1` browser operations

- **Scope:** `feednow-auth`: authentication dependencies and only the
  `/v1/me` and organization API-key routes; integration tests for bearer and
  cookie callers.
- **Change:** Permit the Phase 11 session cookie to authorize the approved
  browser operations while preserving bearer-token product callers and their
  existing response schemas. Resolve the active user and organization access
  on the backend for every request; browser-selected organization IDs are
  untrusted selectors. Do not expose organization/member administration.
- **Focused verification:** existing bearer tests remain green; add cookie
  tests for anonymous, valid, expired, disabled, wrong-organization, and
  insufficient-role cases for `/v1/me` and API-key list/create/revoke. Confirm
  API-key plaintext remains one-time and is absent from logs.
- **Full handoff checks:** backend `pytest` suite, including storage and
  concurrency coverage; UI `npm run check`. Run UI E2E if route/session
  behavior changes.
- **Rollback:** revert cookie-auth dependency and route changes; bearer
  clients remain available. No data migration.
- **Non-goal:** no cookie authentication for routes beyond the named `/v1`
  surface and no frontend authorization based on local state.

### 7. Add CSRF bootstrap, enforcement, and rotation

- **Scope:** `feednow-auth`: CSRF model/storage or session binding, API route
  dependency/middleware, `GET /v1/csrf`, unsafe `/v1` operation checks, and
  focused integration tests.
- **Change:** Implement the retained contract: set the readable
  `feednow_csrf` cookie with its specified attributes; require its matching
  `X-CSRF-Token` header on cookie-authenticated unsafe requests; bind it to the
  active session and rotate or expire it with that session. Bearer-only
  product requests keep their existing behavior. Never log or persist CSRF
  material outside the approved session-bound mechanism.
- **Focused verification:** bootstrap cookie attributes; missing, mismatched,
  expired, and rotated token cases; safe methods omit the header; cookie-auth
  unsafe requests reject without a matching token; bearer compatibility;
  assert no token leakage in logs or error bodies.
- **Full handoff checks:** backend `pytest` suite; UI `npm run check`; UI
  `npm run test:e2e` for changed unsafe browser flows. CloudFront forwarding
  remains Phase 13.
- **Rollback:** revert CSRF routes/enforcement and any additive state fields;
  document whether any additive store cleanup is needed before implementation.
- **Non-goal:** no UI token persistence, retry that replays a mutation, or
  CloudFront configuration.

### 8. Add backend logout and registered Vispector handoff

- **Scope:** `feednow-auth`: logout/handoff API routes, client-registration
  lookup, one-time handoff state/result persistence as specified, and
  integration/concurrency tests.
- **Change:** Logout ends the central session and expires its cookie; any
  Cognito logout or return target is server-validated. Vispector handoff
  requires a registered client, opaque bound request state, registered
  callback, and one-time result. The browser follows only a backend-returned
  approved URL. Use only the retained schema/path details that remain
  consistent with the Managed Login specification; record any unresolved
  contract conflict before coding.
- **Focused verification:** logout invalidates a session and rejects replay;
  handoff rejects unknown clients, callback substitution, stale/replayed
  state, and unauthenticated requests; parallel result consumption has one
  winner; redirect output contains no credentials or tokens.
- **Full handoff checks:** backend `pytest` suite; UI `npm run check` and
  `npm run test:e2e` for logout/handoff route changes.
- **Rollback:** revert route and persistence changes; document removal of any
  additive tables or records before implementation.
- **Non-goal:** no arbitrary `next` acceptance, cross-product session
  cleanup claims, account linking, or Cognito logout customization beyond the
  approved backend contract.

### 9. Record supported account capabilities and Phase 05 handoff evidence

- **Scope:** backend `docs/contracts.md`, `docs/operations.md`,
  `docs/README.md`, and a Phase 05 handoff; UI `docs/README.md` and the
  Phase 05 lifecycle files.
- **Change:** Record only schemas and mounted behavior proven by the preceding
  steps. Keep profile and API-key contracts where supported. Explicitly defer
  subscription, usage, account status, and administrator interactions unless
  an authoritative spec and implementation provide their schemas and
  authorization. Link exact tests and disclose pending live/deployed checks.
  Move Phase 05 into `specs/done/` only after its complete acceptance evidence
  is present.
- **Focused verification:** documentation/path/command review against the
  accepted specs and test output; `git diff --check`.
- **Full handoff checks:** backend full `pytest`; UI `npm run check`; UI
  `npm run test:e2e` for the affected browser flows; record separate service,
  browser, edge, Cognito, and deployment evidence.
- **Rollback:** revert documentation and lifecycle moves; no runtime effect.
- **Non-goal:** no claim that unsupported account capabilities, CloudFront,
  or deployed Cognito behavior are complete.

## Dependency and stop conditions

- Backend Phase 11's recorded handoff still requires deployed dev settings
  and native/Google login evidence for operational acceptance. The phase file
  is in `specs/done/`, so preserve that explicit limitation rather than
  reopening or claiming its live proof.
- The API consumers in steps 1–3 are browser-side contract code. Their mock
  tests do not prove service route mounting or authorize service behavior.
  Steps 4–9 supply that required service implementation and integration
  evidence before Phase 05 can move to `specs/done/`.
- If the retained contract record and current Managed Login specs disagree on
  a path, schema, cookie, or authorization rule, stop before that build step
  and resolve the spec conflict. Do not choose backend source behavior as a
  substitute.
- User instruction on 2026-09-25 selects Phase 05 for implementation. Keep it
  in `specs/wip/` until all nine steps, acceptance evidence, and handoff docs
  are complete.
