# feednow-auth-ui current state

`feednow-auth-ui` is the static React, TypeScript, and Vite account application.
It owns presentation, routing, forms, accessibility, and typed browser calls.
The `feednow-auth` service owns Cognito, identity provisioning, authorization,
sessions, CSRF validation, API-key security, and persistence. The browser uses
same-origin `/api/*` paths and does not contain Cognito or AWS credentials.

## Account flows

The public routes are `/login`, `/signup`, `/verify-email`, `/forgot-password`,
`/reset-password`, and `/logout`. Login and signup begin backend-managed
Cognito login. The authenticated routes are `/account`, `/account/api-keys`,
and `/account/billing`; billing is a placeholder. `/account/admin` is shown
when the backend reports `application_role=admin`.

The app discovers the current user with `GET /api/v1/me` and bootstraps the
CSRF cookie with `GET /api/v1/csrf` before exposing authenticated account
routes. Mutating requests send the same-origin `feednow_csrf` value in the
`X-CSRF-Token` header. The session remains in the HTTP-only cookie. Logout
calls `POST /api/logout` and then redirects to Cognito.

First account setup lets the user choose a profile and organization name.
Email-derived suggestions are editable; only first name is required and the
surname is optional. Organization names are converted to slugs for availability
checks while typing. **Complete setup** stays disabled until the name is
available, and the backend checks uniqueness again when saving. Organization
renames update the page from the persisted response.

The account page lists the user's organizations. The API Keys page creates,
lists, and revokes keys for each organization. The admin dashboard searches
organizations and displays members and details. Platform administrators can
suspend, reactivate, or delete other organizations after confirming the exact
name; their own organization displays a **Your Organization** badge instead of
the actions menu. The backend rejects attempts to suspend or delete an
organization owned by the current administrator.
Deletion removes related users, identities, sessions, memberships, and keys.
Suspension blocks organization operations and revokes API keys while leaving
memberships intact; reactivation does not restore revoked keys. These actions
are backend-authoritative.

Subscription and usage APIs/UI are outside the current product boundary.

## Browser API boundary

Typed transport and feature modules live in `src/api/`. The shared client uses
relative URLs, same-origin credentials, cancellation, and safe error mapping.
Components use those modules instead of constructing service URLs or exposing
raw backend errors. The UI never stores access tokens, API-key plaintext after
the create response, or other credentials in browser storage.

The Vite development proxy strips exactly one `/api` prefix and preserves
backend status codes and response bodies. The AWS CloudFront API behavior
applies the same rewrite and disables API caching. SPA routing applies only to
the static site behavior, so an API error does not become `index.html`.

## AWS deployment

`deploy/aws/account-ui.yaml` provisions the private S3 bucket, CloudFront OAC,
static asset and SPA behaviors, same-origin API routing, and security response
headers. `deploy/aws/deploy.sh` builds and checks the UI, deploys the
CloudFormation stack, uploads immutable assets and an uncached `index.html`,
then invalidates CloudFront. See [deployment.md](deployment.md)
for account inputs, backend callback configuration, custom-domain requirements,
and post-deployment smoke checks.

This repository defines the deployable static UI infrastructure. A deployed
CloudFront distribution, live Cognito journey, and production account have not
been verified from this checkout.

## Design and accessibility

`src/index.css` defines the light slate and emerald palette. The primary button
uses emerald-700 with white text; errors use red, and focus rings and status
messages have visible or semantic cues. shadcn/ui components are in
`src/components/ui/`. Shared form fields associate visible labels, hints, and
errors with inputs. Destructive actions use confirmation dialogs.

Playwright covers direct route loads, onboarding, administrator actions,
responsive widths, and keyboard focus at desktop, tablet, and mobile sizes.
The browser suite uses mocked API responses; it does not establish live API,
Cognito, CloudFront, or AWS behavior.

## Local development and checks

Node 22 LTS is pinned in `.nvmrc`. Use npm:

```text
nvm use
npm ci
npm run dev
```

Vite serves the app at `http://localhost:3000`. The Docker development setup
uses `feednow-auth` at `http://localhost:8000`; browser requests remain
relative `/api/...` paths.

```text
npm run lint
npm run typecheck
npm run test                 # Vitest, non-watch
npm run test:e2e             # Playwright against a built preview
npm run build
npm run check                 # lint + typecheck + unit tests + build
```

Latest local evidence: `npm run check` passed with 146 unit/component tests;
`npm run test:e2e` passed 48 Chromium checks across desktop, tablet, and
mobile. The Vite build reports a 509.93 kB JavaScript chunk, slightly above
the 500 kB advisory threshold. No deployed-edge or real Cognito test was run.
