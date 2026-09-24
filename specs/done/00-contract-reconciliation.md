# Phase 00 — Cross-repository contract reconciliation

**Status:** Browser contract baseline for Phases 04–10
**Dependency:** none
**Handoff to:** Phases 01, 04, and 05

## Contract authority and implementation status

This document fixes the browser contract required by the merged
[`feednow-auth-ui` specification](../draft/feednow-auth-ui-specification.md).
It distinguishes that proposed browser surface from the service contract that
exists today:

- `feednow-auth` currently freezes versioned `/v1` schemas in
  `src/app/api/schemas/manifest.py`. The manifest is a mount contract; it does
  not prove that a route is mounted or operational.
- Browser authentication, session, context, CSRF, recovery, account mutation,
  and handoff routes below are **Phase 05 additions**, not current endpoints.
- The existing `/v1/me` and organization API-key schemas are source-backed
  service contracts. Their use by a cookie-authenticated browser must be
  explicitly implemented and tested in Phase 05 without breaking existing
  product API clients.
- All browser API calls remain relative to `account.feednow.io`. The UI does
  not call Cognito, choose an authorized redirect, or make authorization
  decisions.

## Path mapping and edge behavior

The canonical browser prefix is `/api/v1`. The account CloudFront `/api/*`
behavior and the local Vite proxy must remove exactly the leading `/api`
segment before forwarding. For example, browser `POST /api/v1/auth/login`
arrives at the service as `POST /v1/auth/login`. Preserve the remainder of the
path, query string, method, body, cookies, and required headers. Do not rewrite
responses. `/api` without a following path segment is not a service endpoint.

| Browser request | Service request | Contract status |
| --- | --- | --- |
| `/api/v1/me` | `GET /v1/me` | Existing frozen `MeResponse`; cookie-session browser auth is a Phase 05 requirement. |
| `/api/v1/organizations/{organization_id}/api-keys` | Same `/v1/organizations/{organization_id}/api-keys` path and method | Existing frozen list/create/revoke schemas; browser-session authorization bridge is Phase 05. |
| `/api/v1/auth/context?client_id=…` | `GET /v1/auth/context?client_id=…` | New Phase 05 route. |
| `/api/v1/session` | `GET /v1/session` | New Phase 05 route. |
| `/api/v1/csrf` | `GET /v1/csrf` | New Phase 05 route and cookie bootstrap. |
| Other browser routes below | Same path and method under `/v1` | New Phase 05 routes unless identified above. |

CloudFront forwards `/api/*` to API Gateway with API caching disabled. API
responses, including 4xx/5xx and 404, must remain API responses and must never
receive the SPA `index.html` fallback. The Phase 03 Vite proxy currently
preserves `/api` unchanged; it must be updated to apply this same one-segment
rewrite before real browser-to-service integration. Until that correction and
the Phase 05 service routes land, local UI route tests do not prove API
integration.

The earlier conceptual `/api/auth/context` example is superseded by the
versioned canonical path `/api/v1/auth/context`.

## Existing service schemas retained

These are current `feednow-auth` source contracts, not UI-invented DTOs:

- `GET /v1/me` → `200` `{id, display_name, email, status, created_at,
  updated_at}`. The response intentionally excludes credentials, external
  identity data, and memberships.
- API-key list `GET /v1/organizations/{organization_id}/api-keys` → `200`
  `Page<ApiKeySummary>`; create `POST` → `201 ApiKeyCreatedResponse`; revoke
  `DELETE /v1/organizations/{organization_id}/api-keys/{key_id}` → `204` with
  no body. The list item is `{id, name, environment, key_prefix, status,
  scopes, created_at, last_used_at, expires_at, revoked_at}`. Creation accepts
  `{name, environment, scopes}` and returns `{id, name, key, created_at}`.
  `key` is revealed once only. The `{key_id}` path parameter is the `key_`
  application ID from the response, not the credential's internal key
  segment. The backend validates organization membership and role; UI-supplied
  organization IDs are untrusted selectors, never authorization proof.
- Paginated service lists use query `limit` and opaque `cursor`, and return
  `{items, limit, next_cursor}`. The UI passes cursors through without parsing
  them.

Organization/member administration is not exposed in the UI. The manifest's
other `/v1/organizations` routes remain outside this account UI contract.

## New browser schemas owned by Phase 05

All objects below are JSON. Objects are closed to undocumented fields. IDs,
challenge values, cursors, client state, and handoff references are opaque to
the browser. Timestamps use the service's UTC datetime serialization. These
schemas are the approved target for Phase 05 implementation; they are not
evidence of existing backend behavior.

### Client context and central session

`GET /v1/auth/context?client_id={opaque-client-id}` returns `200`:

```json
{
  "client_id": "vispector",
  "display_name": "Vispector",
  "logo_url": "https://static.feednow.io/clients/vispector.svg",
  "registration_enabled": true
}
```

`client_id` is required, bounded, and resolved against backend registration.
The backend supplies all displayed context; a query-supplied name, logo,
callback, or return URL is ignored. `logo_url` is nullable and must come from
trusted backend configuration.

`GET /v1/session` returns `200` in either state:

```json
{"status":"unauthenticated","user":null}
```

```json
{"status":"authenticated","user":{"id":"usr_example","display_name":"Ada","email":"ada@example.test"}}
```

The session cookie is backend-issued, `Secure`, `HttpOnly`, `SameSite=Lax`,
and `Path=/`. It is not read, copied, or stored by JavaScript. Session status
and user identity are backend-authoritative.

### CSRF bootstrap and unsafe requests

`GET /v1/csrf` is same-origin and returns `204` with no body while setting
`feednow_csrf=<opaque-token>; Secure; SameSite=Strict; Path=/`. This cookie is
intentionally readable by the account UI and is not an authentication
credential. Every unsafe request (`POST`, `PUT`, `PATCH`, `DELETE`) sends the
cookie value in `X-CSRF-Token`; safe `GET` and `HEAD` requests omit that header.
The backend compares the submitted header to the cookie/session-bound expected
value, rejects missing/mismatched values with `403` and the standard error
envelope, and rotates or expires the value with the session. The UI must
bootstrap before its first unsafe request and may retry bootstrap once after a
CSRF rejection, without replaying credentials automatically.

The Phase 04 transport's configurable cookie/header adapter can implement
these names. Phase 05 must prove cookie attributes, validation, rotation, and
forwarding in service tests; Phase 13 must preserve the cookie and header
through CloudFront. CSRF values must never enter logs, URLs, storage, error
copy, or telemetry.

### Common outcome and error rules

Successful flow responses use a `status` discriminator and only the fields
listed for that variant:

```ts
type AuthOutcome =
  | { status: 'authenticated' }
  | { status: 'verification_required'; challenge_id: string }
  | { status: 'challenge_required'; challenge: { id: string; type: string } }
```

`challenge.id` and `challenge.type` are opaque; the UI supports known types
and has a safe unsupported-challenge state. Challenge completion can return
any `AuthOutcome` variant.

Errors use the existing envelope shape:

```json
{"code":"validation_error","message":"Request validation failed","field_errors":[{"field":"body.email","message":"Invalid value"}],"request_id":"req_example"}
```

The object fields are `code`, `message`, `field_errors` (array of `{field,
message}`), and nullable/omitted `request_id`; `field_errors` may be empty.
Clients branch on `code`, never display `message` or field `message`, and show
application-owned copy. Secret values must not appear in any field or
message. `request_id` is safe correlation metadata, not a credential.

The current backend enum supports `validation_error`, `unauthenticated`,
`forbidden`, `not_found`, `conflict`, and `internal_error`. Phase 05 must add
`invalid_credentials`, `account_disabled`, and `rate_limited` with statuses
401, 403, and 429 respectively (or document a reviewed equivalent before
implementation). Existing error handlers currently map unmapped 429 to
`validation_error`; do not claim rate-limit support until this changes.
Expected status mapping: 400/422 validation, 401 unauthenticated or
invalid_credentials, 403 forbidden or account_disabled/CSRF, 404 not_found,
409 conflict, 429 rate_limited, and 5xx internal_error. Avoid account
enumeration where the selected operation's policy requires it.

### Login and challenges

`POST /v1/auth/login` request:

```json
{"email":"ada@example.test","password":"<submitted-password>","client_id":"vispector","state":"<opaque-state-or-null>"}
```

`state` is optional and opaque; the backend binds and validates it. The body
also allows `client_id: null` for account-only sign-in. Response is
`200 AuthOutcome`; invalid credentials, disabled account, rate limit, and
validation use the safe error envelope and status mapping above. Passwords
are request-only and never logged or retained by the UI beyond submission.

`POST /v1/auth/challenges/{challenge_id}` request is
`{"response":"<user-entered-code-or-password>"}` and response is `200
AuthOutcome`. The challenge ID is an opaque backend-issued path value. The
backend decides whether it represents email verification, MFA, or a
new-password challenge and enforces expiry/attempt limits.

`POST /v1/auth/handoff` request is
`{"client_id":"vispector","state":"<opaque-state-or-null>"}`; response
`200` is `{"redirect_url":"https://vispector.feednow.io/auth/callback?result=<opaque-one-time-result>"}`.
The backend validates client registration, callback, state binding, session,
and one-time result. The UI may navigate only to this backend-returned URL; it
never constructs a callback or authorizes a query parameter. Account-only
success needs no handoff and remains on `/account`.

`POST /v1/auth/federation` request is
`{"provider":"google","client_id":"vispector","state":"<opaque-state-or-null>"}`;
response `200` is `{"authorization_url":"https://<backend-approved-provider-url>"}`.
The backend chooses/validates provider and URL; the UI only follows the
returned URL. Provider values are server-enumerated and unknown values fail
validation.

### Registration, verification, and recovery

- `POST /v1/auth/registrations`: request `{email, password, client_id,
  terms_acknowledgements}` where acknowledgements is an array of
  `{document_id, version}` for backend-required terms. Response `202`
  `{status:"verification_required", challenge_id}`. Backend configuration
  decides eligibility and required acknowledgements.
- `POST /v1/auth/email-verifications`: request `{challenge_id, code}`;
  response `200 {status:"verified"}`. `POST
  /v1/auth/email-verifications/resend`: request `{challenge_id}`; response
  `202 {status:"accepted"}`. Invalid, expired, and already-completed states
  use safe envelope codes/copy and do not disclose account existence when
  policy suppresses it.
- `POST /v1/auth/password-resets`: request `{email}`; response `202
  {status:"accepted"}` regardless of whether a matching account can be
  disclosed.
- `POST /v1/auth/password-resets/confirm`: request `{challenge_id, code,
  new_password}`; response `200 {status:"completed"}`.

All codes/passwords are transient request data, excluded from URLs, logs,
storage, and error responses. Challenge IDs are backend-issued opaque values.

### Account and security

- `GET /v1/me` returns the existing `MeResponse` described above.
- `PATCH /v1/me` (new Phase 05 route) accepts only supported editable fields
  `{display_name?, email?}` and returns the complete `MeResponse`. The backend
  controls verification status and identifiers; changing email follows its
  verification flow.
- `GET /v1/account/security` returns `{email_verified, current_session}`;
  `current_session` is `{created_at, expires_at}` with nullable timestamps
  when unavailable. `POST /v1/account/security/password` accepts
  `{current_password, new_password}` and returns `204` with no body. Password
  policy and session invalidation are backend-owned.
- Account security/session fields beyond these are not implied. Do not expose
  session lists, revocation, MFA administration, or passkeys in this phase.

### API-key browser operations

The list/create/revoke methods, statuses, bodies, and payload schemas remain
exactly those frozen for the existing versioned organization key routes.
Cookie-authenticated browser use is an added Phase 05 capability. Each request
must authorize the active user for the requested organization and operation;
the UI must not infer roles or valid scopes. Creation returns the plaintext
once and the UI clears it on dismissal/navigation; subsequent lists are
masked summaries only.

### Logout

`POST /v1/logout` accepts `{}` and returns `204` with no body after ending the
central session and expiring its cookie. The backend may return a validated
handoff separately when a registered client flow requires it; it must never
accept an arbitrary destination from the browser. The UI then renders the
signed-out state or follows only a backend-validated response.

## Browser-supplied values requiring backend validation

Treat all of these as untrusted even when they came from a same-origin URL or
form: `client_id`; opaque `state`; challenge IDs and responses; email, password,
verification/reset codes; terms document IDs/versions; federation provider;
organization and API-key IDs; key name/environment/scopes; profile edits;
CSRF header/cookie pairing; pagination limit/cursor; and any URL-like value.
The backend owns client registration, user/session state, challenge validity,
terms versions, authorization, key policy, redirect destinations, rate
limits, anti-enumeration, and persistence. URL-like request values do not
authorize navigation.

## Phase 05 implementation matrix

| Capability | Current evidence | Phase 05 work |
| --- | --- | --- |
| `/v1/me`, API-key list/create/revoke models | Frozen in `src/app/api/schemas/manifest.py` and schema modules | Mount/verify routes and add a tested browser-session authorization path without breaking existing product callers. |
| Error envelope | `src/app/models/errors.py`; handlers in `src/app/api/errors.py` | Add documented auth/rate-limit codes and ensure fixed safe messages at raise sites. |
| Context, session, login, challenges, handoff, federation | Requirements only in UI specs | Add routes, schemas, backend validation, session/Cognito integration, and tests. |
| Registration, verification, recovery | Requirements only in UI specs | Add routes, schemas, anti-enumeration policy, and tests. |
| Profile edit and security/password | Read-only `/v1/me` schema exists; browser operations do not | Add routes and schemas, supported-field rules, and tests. |
| CSRF bootstrap and enforcement | No backend implementation found in current source | Add cookie/bootstrap, unsafe-method validation, rotation/expiry, edge/local forwarding tests. |
| SPA/API separation and `/api` rewrite | UI spec states edge split; local proxy currently preserves path | Update Vite proxy and CloudFront mapping consistently; prove API failures remain JSON/API responses. |

## Contract test matrix for Phase 05 and consumers

1. Each canonical browser path maps to the same-method `/v1` service path with
   the query/body/cookie/required headers preserved after stripping one `/api`
   prefix.
2. API success, validation, auth, forbidden, conflict, not-found, rate-limit,
   malformed-body, and server-error responses retain their status and JSON
   shape. SPA routes alone receive the static shell.
3. Session cookie flags and CSRF bootstrap/header comparison, missing/mismatch,
   expiry/rotation, and CloudFront forwarding are covered without production
   accounts.
4. Context and handoff reject unknown clients, unregistered callbacks, stale
   state, and browser-supplied branding/redirect substitutions.
5. Login/challenge/verification/recovery outcomes cover success, invalid,
   expired, unsupported, disabled, and throttled states without credential or
   account-existence leakage.
6. Profile mutation cannot alter server-controlled ID/status/verification;
   API-key creation reveals one plaintext only, list stays masked, and
   organization authorization is backend-enforced.

## Non-goals

This contract does not implement handlers, React feature modules, CloudFront
resources, Cognito settings, persistence, or deployment. It does not authorize
arbitrary URLs, define unsupported account capabilities, or declare any new
Phase 05 route implemented.

## Handoff

Phase 04 may implement its generic client against these paths and schemas.
Phase 05 must implement the new routes and authorization/CSRF behavior and
verify the existing `/v1` schemas before Phase 06–10 consume them. Phase 03's
local proxy rewrite is a prerequisite for local integration and is recorded
above. CloudFront must perform the same single `/api` removal and retain the
service version prefix.
