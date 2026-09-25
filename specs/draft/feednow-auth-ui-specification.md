# feednow-auth-ui specification — Cognito Managed Login

## Status and authority

This target specification supersedes the authentication and account scope in the
2026-09-14 UI proposal and its Phase 00 browser-contract reconciliation. The
completed Phase 00–03 records remain historical evidence; their custom-auth
routes and DTOs are migration inventory, not requirements to implement. Phase
04 is active and must reconcile its typed modules before acceptance. Current
behavior is documented in `docs/README.md`; no target below implies a mounted
backend endpoint or a deployed Cognito flow.

## Purpose and ownership

`account.feednow.io` is a separately deployed static account management app
for FeedNow users, initially reached from Vispector. It owns presentation,
accessible routing and forms for account data, loading/error states, and typed
same-origin calls to `feednow-auth`. It is not an authentication provider.

| System | Responsibility |
| --- | --- |
| Cognito Managed Login | Interactive Google and native email/password sign-in, self-service registration, email verification, password recovery, and configured challenges. |
| `feednow-auth` | OAuth initiation/callback, PKCE and code exchange, provider profile verification, shadow registration, central session/cookies, logout, client/redirect validation, account and API-key authorization, persistence. |
| `feednow-auth-ui` | Account pages and a redirect into the backend login/logout flow; no credential, code, token, or provider-secret handling. |
| Vispector | Its own product session and authorization; registered handoff with the auth backend. |

Use React, TypeScript, Vite, React Router, Tailwind, and shadcn/ui. `npm run build` produces static assets for private S3 behind CloudFront. The account
host proxies `/api/*` to the Python service; frontend API requests stay
relative. SPA fallback applies only to frontend routes, never API failures.
There is no production Node server, Cognito SDK, client secret, password
authentication implementation, or second frontend session.

## Authentication and navigation

The browser enters through a backend-owned login endpoint, targeting the
backend's existing `GET /oauth/login` and `GET /oauth/callback` authorization-code
flow. The public account edge must expose these as same-origin `/api/oauth/*`
paths by removing exactly one `/api` prefix; the exact callback URI must be
registered with Cognito. Phase 05 must verify mount and edge behavior before
any UI flow relies on these paths. The frontend never constructs a Cognito
URL or exchanges an authorization code.

A protected account route first resolves the backend session without showing
private content. If unauthenticated, it performs a full-page navigation to the
backend login endpoint with the requested same-origin destination. The backend
validates and binds the return destination to single-use state. After callback,
it provisions or resolves the user, issues the session, and redirects to the
stored destination. Reloading a protected deep link must work. An expired or
revoked session repeats this flow; loops and backend failures show safe,
actionable states.

Vispector initiation carries an opaque registered client request to the backend.
Only the backend may resolve client branding, approve callback/return URLs, bind
state, issue a one-time authorization result, and return to Vispector. A raw
browser `next`, `client_id`, callback, or origin allowlist alone is not handoff
authorization. The account app may show backend-supplied context and pending
status but never invents or approves the product destination. An existing
central session may complete the handoff without another Cognito prompt.

Logout begins with a backend endpoint that ends the central session and
performs the configured Cognito logout redirect/termination. The frontend then
clears privileged view state and follows only a backend-approved destination.
The account app never infers logout from local state alone. Vispector's product
session cleanup must be part of the registered cross-product logout contract.

There are no app-owned login, signup, verification, forgot-password,
reset-password, or challenge forms. Legacy URLs, if retained for bookmarks,
redirect to the backend login entry without collecting credentials. Cognito
configuration governs Google, native sign-in, self-service signup,
verification, recovery, and challenge availability. Google/native identities
are never merged solely by email.

## Shadow registration

After a successful Cognito callback, the backend validates token, subject, and
profile before resolving the external identity tuple. It provisions a user and
personal organization atomically only when that identity is new. Failed,
unauthenticated, or partially verified flows create no user. A matching email
without a matching provider identity is a conflict or reviewed explicit link
flow, never an automatic merge. Race convergence uses the identity tuple.

## Account application

Authenticated navigation includes profile, API keys, subscription, usage,
account status, and administrator features when authorized. Each page uses
backend-owned data and permissions; unsupported endpoints render an honest
unavailable state or remain hidden until the matching contract exists.

- Profile shows and edits only supported fields. Identity and verification
  changes use backend/Cognito-owned workflows; no local password form.
- API keys list masked values, create once with transient plaintext display,
  and revoke through backend-authorized organization scope. Roles and scopes
  are never inferred from UI state.
- Subscription shows current plan, entitlement, and renewal/billing status only
  where the backend supplies authoritative values. No purchase or billing
  mutation is implied.
- Usage shows backend-provided statistics, period, units, and freshness.
- Account status shows backend-provided lifecycle and safe next actions.
- Administrator pages and actions appear only after server-provided capability
  discovery and still require backend authorization on every request. This
  scope is FeedNow account administration; no Shopify integration.

Every backend-dependent view handles loading, empty, success, error, session
expiry, and unauthorized states. Never render raw provider/backend errors.
Target WCAG 2.1 AA with keyboard navigation, visible focus, semantic labels,
contrast, dialog focus, live status, responsive 375/768/1280px layouts, and no
color-only meaning.

## Browser and edge contracts

Phase 05 reconciles actual mounted service routes against the target. Existing
`/v1/me` and organization API-key routes are bearer-oriented; browser session
authorization must be implemented and tested before the UI uses them. Define
session discovery, backend logout, Vispector handoff, profile mutation, and
subscription/usage/status/admin reads as concrete versioned schemas only after
checking service ownership. Keep `/api/v1/*` for versioned browser JSON; map
`/api/oauth/*` to existing backend `/oauth/*` navigation routes. Verify local
Vite and deployed CloudFront mapping, headers, cookies, redirects, and API
error preservation. Do not claim the old Phase 00 custom-auth endpoints exist.

The backend owns CSRF enforcement for cookie-authenticated unsafe methods. The
UI may reuse the typed transport, safe error mapper, cancellation, and CSRF
adapter once the live route/cookie contract is verified. Never log or persist
passwords, codes, token material, CSRF values, or API-key plaintext. Do not
cache authenticated API responses. Browser query parameters are opaque input,
not security decisions.

## Delivery and evidence

Follow `specs/done/00-delivery-map.md` as revised by this decision and the
numbered phase files. Each build step runs its focused test, `npm run check`,
and `npm run test:e2e` for changed flows/routes/responsive UI. Backend phases
run their declared service tests; infrastructure phases run assertions and a
non-production smoke. Record local, browser, edge, and deployed evidence
separately. Static or mocked tests cannot prove Cognito or deployed behavior.
