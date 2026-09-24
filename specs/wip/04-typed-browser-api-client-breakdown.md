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

6. Align the local proxy with the Phase 00 versioned path mapping — complete
   - Scope: `src/lib/dev-proxy.ts`, `src/lib/dev-proxy.test.ts`,
     `docs/README.md`, `specs/done/03-routing-layouts-and-local-edge-shape.md`.
   - Change: Strip exactly one leading `/api` path segment before forwarding;
     preserve `/v1`, query, method, body, and backend response. Keep frontend
     SPA fallback separate. This corrects the completed Phase 03 proxy and is
     required before browser modules can reach the current backend mount paths
     locally.
   - Non-goal: No CloudFront/API Gateway changes or backend routes.
   - Focused verification: ephemeral-upstream proxy test asserts
     `/api/v1/...` arrives as `/v1/...` with query intact and 429 JSON intact;
     `/login` still returns the Vite SPA shell.
   - Handoff checks: `npm run check`.
   - Rollback: Revert proxy and handoff-doc changes; browser modules remain
     typed but local upstream integration stops matching Phase 00.

7. Close Phase 04 with verified implementation evidence
   - Scope: `docs/README.md`, `specs/wip/04-typed-browser-api-client.md`,
     `specs/wip/04-typed-browser-api-client-breakdown.md`, and the phase
     lifecycle move to `specs/done/`.
   - Change: Record final task commits, focused/full check outputs, exact
     backend/edge gaps, and the Phase 00 contract link; move Phase 04 only after
     all preceding tasks are committed and verified.
   - Non-goal: No claims about new routes being mounted, live backend
     integration, CloudFront, Cognito, or deployed behavior.
   - Focused verification: reconcile each breakdown task and documented check
     result against Git history and actual command output.
   - Handoff checks: `npm run check`; no E2E because this phase adds no route
     or visible UI flow.
   - Rollback: Revert the docs/lifecycle commit; implementation commits remain
     independently revertible.

8. Reconcile the typed client with Cognito Managed Login — complete
   - Scope: `src/api/auth.ts`, `src/api/clientContext.ts`, `src/api/account.ts`,
     `src/types/browser-api.ts`, `src/lib/api-errors.ts`, corresponding
     focused tests, and Phase 04 handoff docs.
   - Change: Remove custom credential, challenge, signup, verification,
     recovery, federation-start, custom session/logout, client-context,
     profile-mutation, and security methods/types. Preserve generic transport,
     safe errors, cancellation, CSRF adapter, and source-backed profile/key
     contracts; remove the obsolete custom-credential error-code mappings.
     The Managed Login and Phase 05 specs direct implementation to reuse
     `/oauth/login` and `/oauth/callback`; keep logout/session/CSRF-bootstrap/
     handoff contract work in Phase 05 rather than infer it from backend code.
   - Non-goal: No React login flow, backend rewrite, Cognito SDK, or invented
     subscription/usage/admin endpoints.
   - Focused verification: `npm run test -- src/api/browser-modules.test.ts`
     covers only retained profile/key paths; inspect frontend source references
     for removed credential/session calls and compile errors.
   - Handoff checks: `npm run check`; `npm run test:e2e` if this step changes
     routing or user-visible flows. Record both actual results and unperformed
     backend/Cognito checks before closing Phase 04.
   - Rollback: Revert this reconciliation commit; no data migration.

The earlier step 7 closure is deferred until step 8 and its new target-contract
review are complete. Earlier completion notes remain implementation history,
not approval to ship the custom-auth methods.
