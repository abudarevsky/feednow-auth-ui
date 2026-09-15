# feednow-auth-ui specification

## Status and reconciliation

This revision merges the original reusable-UI proposal with the account-host
requirements supplied on 2026-09-14. Where they conflict, this document
supersedes the original proposal:

- The initial deliverable is a standalone static React application at
  `account.feednow.io`, not an embeddable package or a direct Cognito SPA.
- `feednow-auth` is the only authentication/account backend. The UI has no
  Cognito SDK and does not issue, exchange, validate, or store tokens.
- Initial account UI excludes organization and membership management. It does
  include the already-planned organization-scoped API-key capability through
  backend-authorized operations.
- Browser URLs are same-origin `/api/*`. Product APIs remain versioned; the
  backend contract phase must settle the exact canonical paths and adapters
  before implementation. Conceptual endpoint names below are requirements, not
  claims that they exist today.

## Purpose

`feednow-auth-ui` is the shared browser UI for FeedNow authentication and
account management. Its first consumer is Vispector at
`https://vispector.feednow.io`; future consumers may include ExcelToPIM.
The shared account application is `https://account.feednow.io`.

It owns presentation, React routing, forms, client-side UX validation, loading
and error states, account navigation, responsive behavior, accessibility, and
typed calls to `feednow-auth`. It must remain independent of product business
logic and must never duplicate security decisions.

## Technology and deployment model

Use TypeScript, React, Vite, React Router, Tailwind CSS, and shadcn/ui. Do not
use Next.js, SSR, React Server Components, server actions, frontend-owned API
routes, or a Node runtime in production.

`npm run build` produces a static artifact. The production UI is independently
deployed to a private S3 bucket behind its own CloudFront distribution. The
Vispector distribution and account distribution remain separately deployable.

## Responsibilities and boundaries

| System | Owns |
| --- | --- |
| `feednow-auth-ui` | UI, routing, forms, client UX validation, accessible states, typed API client |
| `feednow-auth` | Cognito integration; registration, verification, reset and challenges; central session/cookies/logout; client registration and redirect validation; authorization-code creation/exchange; profile/account and API-key operations; CSRF, rate limits, persistence, and backend validation |
| Vispector | its own application session and authorization, projects/workspaces, inspection data, and application UI |

Use FeedNow internal user, organization, and key IDs from the backend. A
browser-provided product name, logo, callback URL, return URL, or logout URL is
untrusted input. The UI may retain an opaque state value but must not decide
whether a redirect is allowed.

## Production edge architecture

```text
Route 53
  ├─ vispector.feednow.io → CloudFront → private Vispector S3
  └─ account.feednow.io   → CloudFront ─┬→ private auth-ui S3
                                        └→ /api/* → API Gateway → feednow-auth
                                                               ├→ Cognito
                                                               └→ storage
```

The account host presents one browser origin. CloudFront routes frontend paths
to static S3 and `/api/*` to the Python backend. Frontend code uses relative
URLs such as `/api/account`; it must not receive an API Gateway URL. API
responses are never cached. SPA fallback returns `index.html` for valid
frontend routes only, never an API 404/error response.

Local development mirrors this shape: Vite runs on port 3000 and proxies
`/api/*` to a local `feednow-auth` process on port 8000. No AWS credentials
are required to develop the UI.

## Authentication, client context, and session

A typical Vispector flow is:

```text
Vispector no-session → account /login?client_id=vispector
→ auth UI → feednow-auth → Cognito
→ central FeedNow session + short-lived authorization result
→ validated Vispector callback → Vispector application session
```

The backend resolves trusted client context, for example through a conceptual
`GET /api/auth/context?client_id=vispector`, including display name and logo.
The login screen says “Sign in to continue to Vispector” only from this
backend-resolved context. An existing valid FeedNow session should complete the
validated client handoff without another password prompt; the UI displays a
brief loading state while that is decided.

The central session belongs to `account.feednow.io`; expected cookie
properties include `Secure`, `HttpOnly`, `SameSite=Lax`, and `Path=/`.
JavaScript does not need access to authentication tokens. Do not store long
lived Cognito tokens in localStorage or sessionStorage. Vispector keeps a
separate application session.

Cognito user pools remain the production identity provider for passwords,
verification, reset, optional MFA, and future federation. The custom FeedNow
UI is primary. Federation starts (Google, Microsoft, later SSO) are obtained
from `feednow-auth`; Cognito Managed Login is not embedded as a component.

## Routes and user experiences

Unauthenticated routes:

```text
/login
/signup
/verify-email
/forgot-password
/reset-password
/logout
```

Authenticated routes:

```text
/account
/account/security
/account/api-keys
```

### Login and challenges

Login presents FeedNow branding, backend-resolved product context, email,
password, sign-in, forgotten-password, sign-up, and an optional backend-started
federation action. Submission goes to the Python backend. It consumes
structured statuses such as `authenticated`, `verification_required`,
`challenge_required`, `invalid_credentials`, `account_disabled`, and
`rate_limited`; it never parses Cognito error strings.

The UI supports opaque backend-defined challenges including email verification,
MFA code, and new-password-required. A challenge ID is opaque and the
architecture must accept additional types later.

### Registration, verification, and recovery

Registration is offered only when backend/client configuration permits it.
Initial UX accepts email, password, optional confirmation, and any required
terms/privacy acknowledgement. The backend owns eligibility and provisioning.

Verification supports entering and resending a code plus incorrect, expired,
and already-verified states. Recovery supports email, code entry, a new
password, and completion. UI copy must not reveal whether an account exists
when the backend intentionally withholds that fact.

### Account, security, and API keys

The authenticated account application has Account, Security, and API keys
navigation. Desktop uses a compact sidebar; mobile uses accessible responsive
navigation such as a shadcn Sheet or tabs.

Account displays and edits only backend-supported display name, email, and
verification state. Security initially supports password change, email
verification state, and current session information. MFA, passkeys, session
management, and security history are extension points, not premature UI.

API-key UI lists name, prefix/masked value, status, creation time, and
last-used time when available. It creates a backend-authorized
organization-scoped key, presents the plaintext once with copy guidance, and
requires confirmation to revoke. It never requests or displays a secret again.
Roles, ownership, valid scopes, key lifecycle, and immediate revocation stay
server-authoritative.

Logout routes through the backend, which terminates the FeedNow session and
performs Cognito logout/revocation when needed before a registered, validated
destination. The UI does not select arbitrary destinations.

## UI system, accessibility, and state handling

Use white/slate surfaces, emerald-600 primary actions with emerald-700 hover,
emerald-50/200 accents, slate-900 primary text, slate-600/500 secondary text,
slate-200 borders, restrained shadows, and red only for destructive/error
actions. Avoid gradients and marketing illustrations. Auth pages use a centered
`max-w-md` card with comfortable spacing.

Prefer shadcn Button, Card, Input, Label, Form, Alert, Badge, Separator,
DropdownMenu, Avatar, Tabs, Dialog, AlertDialog, Sheet, Table, Tooltip,
Skeleton, and Sonner. Do not add another large component framework.

Every backend-dependent view handles loading, success, empty, and error states.
Use Skeleton where appropriate; never leave a blank session/context/account/key
screen. Map errors to safe user language, never raw backend/AWS/Cognito output.

Target WCAG 2.1 AA: keyboard navigation, visible focus, semantic labels,
accessible form errors, contrast, correctly focused dialogs, screen-reader
status messages, and no color-only meaning. Support desktop, tablet, and
mobile, including non-overflowing key rows and usable dialogs/touch targets.

## Frontend API boundary

Create one typed transport abstraction, for example:

```text
src/api/auth.ts
src/api/account.ts
src/api/apiKeys.ts
src/api/clientContext.ts
src/lib/errors.ts
src/lib/validation.ts
src/types/
```

Components do not make distributed arbitrary fetch calls. The service contract
must define structured success, validation, authentication, challenge, rate
limit, and safe error responses; it must also define CSRF bootstrap/submission
and the mapping between browser `/api/*` and versioned service paths. Product
and redirect authorization remain server-side.

## Edge and infrastructure controls

The S3 bucket is private: Block Public Access is enabled, website hosting is
off, and CloudFront Origin Access Control is the only public path. The
`/api/*` behavior forwards the methods, cookies, query strings, Authorization,
Origin, Referer, and CSRF headers required by the backend. Broad wildcard CORS
is not appropriate for same-origin authenticated operations.

CloudFront uses a response-header policy that evaluates HSTS,
X-Content-Type-Options, Referrer-Policy, CSP, Permissions-Policy, and
frame-ancestors. HTTPS is mandatory. Hashed Vite assets use
`public, max-age=31536000, immutable`; `index.html` remains short-lived or
revalidation-friendly.

Use infrastructure as code for S3, OAC, CloudFront behaviors/policies, ACM
certificate/reference, Route 53 records, and cache/origin-request policies.
CloudFront certificates are in `us-east-1`; public URLs use FeedNow domains,
not CloudFront hostnames. CI/CD performs install, lint, tests, build, static
upload, targeted invalidation/revalidation when needed, and a hosted smoke test.
A failed quality gate prevents deployment.

## Security constraints

Never persist or log passwords, verification codes, API-key plaintext,
credentials in URLs, Cognito secrets, long-lived tokens, CSRF values, or raw
exceptions. Do not trust redirect data or duplicate backend authorization.
Cookie-based modifying requests require backend-owned CSRF protection, supported
by the UI and preserved by CloudFront.

## Initial exclusions

Billing, subscriptions, organization/membership administration UI, product role
administration, admin-user UI, audit-log UI, passkey UI, enterprise SSO setup
UI, advanced session management, direct Cognito administration, a Node/Next.js
backend, and Shopify login are out of scope unless a later phase adds them.

## Completion evidence

The implementation must include unit/component tests for login outcomes,
client-context trust, existing sessions, account/profile states, API-key
one-time display and revocation, recovery flows, and protected routing.
Critical flows require browser E2E coverage. Static build success alone does
not demonstrate visual, CloudFront, Cognito, DNS, or deployed behavior; each
phase records the appropriate evidence and remaining unperformed checks.
