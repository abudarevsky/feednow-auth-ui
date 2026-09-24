# Phase 04 implementation breakdown — Typed browser API client

The user authorized proceeding before the Phase 00 gate was reconciled. The
contract is now specified in
`specs/done/00-contract-reconciliation.md`; implement only the paths and
schemas recorded there. Commit numbered build steps in order. New backend
routes remain Phase 05 work. Phase 04 stays in `wip` until feature modules,
focused checks, and handoff evidence are complete.

## Build steps

1. Add a same-origin typed JSON transport
   - Scope: `src/api/client.ts`, `src/api/path.ts`, focused tests.
   - Change: Provide one fetch boundary for relative `/api/*` paths; include
     `Accept: application/json`, same-origin credentials, JSON body encoding,
     caller-supplied `AbortSignal`, and typed response decoding. Reject
     absolute/cross-origin URLs and non-API paths. Preserve `AbortError` as
     cancellation, not a displayed server error. Keep loading state at the
     calling component boundary; do not create global transport state.
   - Non-goal: No endpoint paths, feature payload schemas, retry policy,
     logging, token storage, or backend calls.
   - Focused verification: mocked-fetch tests cover method/body/header,
     same-origin credentials, path rejection, response decoding, and abort.
   - Handoff checks: `npm run check`.
   - Rollback: Revert the commit; removes the common request boundary only.

2. Normalize service errors into safe UI errors
   - Scope: `src/types/api.ts`, `src/lib/api-errors.ts`, `src/api/client.ts`,
     focused tests.
   - Change: Parse the existing service envelope (`code`, `message`,
     `field_errors`, `request_id`) and recognized HTTP outcomes. Use
     application-owned copy for validation, unauthenticated, forbidden,
     not-found, conflict, rate-limit, server, network, and malformed-response
     cases. Never show the backend `message`, field message, raw body, or
     exception text. Retain only safe machine codes, field paths, and request
     IDs needed by future form mapping; unknown codes map to a generic safe
     error.
   - Non-goal: No business validation rules, endpoint-specific mappings, or
     sensitive-value logging.
   - Focused verification: tests cover known/unknown codes, validation fields,
     401/403/404/409/429/5xx, network failure, malformed JSON, and assertions
     that hostile backend text never appears in the normalized error.
   - Handoff checks: `npm run check`.
   - Rollback: Revert the commit; removes error types/mapping and integration
     with the transport.

3. Add configurable CSRF cookie-to-header support
   - Scope: `src/api/csrf.ts`, `src/api/client.ts`, focused tests.
   - Change: Read a caller-configured readable cookie and copy its value into a
     caller-configured header for unsafe methods only. Do not hard-code either
     name until Phase 00 approves them. Missing configuration leaves the
     transport usable for safe requests; configured unsafe requests with a
     missing token fail locally with a safe typed error. Never persist or log
     the token.
   - Non-goal: CSRF bootstrap endpoint/response, cookie attributes, deployment
     forwarding, or claiming backend protection until Phase 00/05 supplies and
     verifies the contract.
   - Focused verification: tests cover cookie decoding, header injection for
     POST/PUT/PATCH/DELETE, no injection for GET/HEAD, missing-token behavior,
     and token redaction.
   - Handoff checks: `npm run check`.
   - Rollback: Revert the commit; removes the optional CSRF adapter and request
     integration; no server or cookie changes.

4. Record implemented boundary and deferred contract work — complete
   - Scope: `docs/README.md`, `specs/wip/04-typed-browser-api-client.md`,
     `specs/wip/04-typed-browser-api-client-breakdown.md`.
   - Change: Document verified transport/error/CSRF behavior and tests. Link
     the Phase 00 schemas and state clearly which routes remain unimplemented
     in the backend. Keep Phase 04 in `wip` until typed feature modules and
     handoff evidence are complete.
   - Non-goal: No browser feature flows or backend implementation.
   - Focused verification: Documentation matches shipped code and test names;
     final available gate is `npm ci && npm run check`.
   - Handoff checks: Record actual results and exact deferred acceptance gaps.
   - Rollback: Revert docs only; no data or migration effect.

5. Add typed feature API modules for the Phase 00 browser contract — complete
   - Scope: `src/api/auth.ts`, `src/api/account.ts`, `src/api/apiKeys.ts`,
     `src/api/clientContext.ts`, `src/types/`, and focused module tests.
   - Change: Declare request/response types from the Phase 00 contract and
     implement typed functions using the shared transport. Configure unsafe
     methods with cookie `feednow_csrf` and header `X-CSRF-Token`; bootstrap
     through the specified endpoint before unsafe flows. Preserve one-time
     API-key response semantics and opaque IDs/state/challenges.
   - Non-goal: No UI flows, backend handlers, retries that replay credentials,
     logging, persistence, or redirect authorization.
   - Focused verification: mocked-transport module tests cover method/path/body,
     response discriminator, error mapping, cancellation, and CSRF behavior;
     assert secrets and backend messages are not retained or exposed.
   - Handoff checks: `npm run check`; then `npm run test:e2e` is not required
     because this step adds no UI flow or routing.
   - Rollback: Revert the module commit; generic transport remains usable.
