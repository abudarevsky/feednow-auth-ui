# feednow-auth-ui current state

The initial Docker account milestone is in progress. This is a React +
TypeScript + Vite browser application with local Cognito Managed Login,
backend session discovery, an account overview, profile/organization display,
the configured service catalog, and API-key create/list/revoke flows. The
backend owns Cognito, identity provisioning, authorization and persistence.
Production deployment remains out of scope.

This is not yet the complete local account milestone: organization renaming,
explicit organization name status, subscription and usage APIs, and the
platform administration HTTP/UI surface remain unimplemented. The current
backend also does not bind API keys to a service ID or expose a local
protected Vispector endpoint for key-authentication proof. Do not use this
status page as evidence that those milestone acceptance criteria passed.

The completed phase requirements and handoffs live in `specs/done/`. Future,
unaccepted work remains in `specs/` and is not current behavior.

## Design tokens

`src/index.css` defines the light slate/emerald palette as literal six-digit
hex values in Tailwind v4 `@theme` tokens. shadcn semantic variables reference
those tokens, and `src/test/theme-contrast.test.ts` parses the same source
tokens before checking WCAG 2.1 AA contrast for primary text, secondary text,
error text, and primary-button text.

The primary button uses emerald-700 (`#047857`) with white text to meet AA.
The literal emerald-600 primary from the initial palette would not meet AA for
normal white text; emerald-600 (`#059669`) remains a non-text accent and focus
ring. Emerald-50/200 provide subtle fills and accents. Red is reserved for
destructive and error states. The palette uses white/slate surfaces, slate
text and borders, restrained shadows, and no gradients. Phase 02 has one light
palette and does not include dark mode.

The document uses a system sans-serif stack and a 16px, 1.5 line-height base.
Visible keyboard focus uses the emerald ring token. Links are underlined, and
errors and active navigation state include text or ARIA semantics so color is
never the only state cue.

## UI primitives

The generated shadcn/ui component set is checked in under `src/components/ui/`:
Button, Card, Input, Label, Form, Alert, Badge, Separator, DropdownMenu,
Avatar, Tabs, Dialog, AlertDialog, Sheet, Table, Tooltip, Skeleton, and Sonner.
`src/App.tsx` mounts one global Sonner `<Toaster />`.

| Primitive | File | Behavior |
| --- | --- | --- |
| Form field | `src/components/form-field.tsx` | Associates a visible label with the input; displays optional hint and error text; wires descriptions with `aria-describedby`, errors with `role="alert"` and `aria-invalid`, and required state with a visible indicator plus the native attribute. |
| Status message | `src/components/status-message.tsx` | Provides a polite `role="status"` live region for pending and success announcements. It is screen-reader-only by default and remains mounted while its text changes. |
| Auth card | `src/components/auth-card.tsx` | Centers a content-sized `max-w-md` Card with title, optional description, content, and footer slots. It has one h1 and no fixed height; the card fills narrow viewports. |
| Account shell and nav | `src/components/account-shell.tsx`, `src/components/account-nav.tsx` | Shows a compact sidebar at desktop widths and a Sheet navigation panel on mobile. A semantic nav contains button items; the active item exposes `aria-current="page"`. Radix traps focus in the Sheet and restores it to the trigger when closed. |
| Confirm dialog | `src/components/confirm-dialog.tsx` | Uses AlertDialog for destructive confirmation. Cancel receives initial focus. Only explicit confirmation calls `onConfirm`; Escape and backdrop dismissal close without calling it, and focus returns to the trigger. |
| State blocks | `src/components/state-blocks.tsx` | LoadingBlock shows visible loading text with `role="status"` and decorative Skeletons; EmptyState pairs an icon with visible text; ErrorState renders only its caller-supplied safe message with `role="alert"`. |

## Routing and session discovery

`src/routes/route-table.ts` defines the canonical route table from the merged
UI specification:

| Route group | Paths | Layout / state |
| --- | --- | --- |
| Public | `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/logout` | `AuthCard` with safe placeholder content |
| Protected | `/account`, `/account/security`, `/account/api-keys` | `AccountShell` when authenticated; deterministic loading or sign-in prompt otherwise |
| Entry / fallback | `/`, all unknown paths | Entry links / explicit not-found page |

`src/App.tsx` discovers the session through backend `GET /api/v1/me`. The
login and signup entry points redirect to the backend OAuth login route, which
uses Cognito Managed Login. The account overview calls backend APIs through
relative `/api/...` paths. Application session state stays in the HTTP-only
cookie and is never copied into browser storage.

## Typed API transport and contract modules

`src/api/client.ts` provides the shared JSON transport for relative
`/api/*` requests. It sets same-origin credentials and JSON headers, validates
paths before fetch, accepts caller cancellation through `AbortSignal`, and
returns typed response bodies. `src/lib/api-errors.ts` maps HTTP status and
recognized service error codes to fixed UI-safe messages. It does not expose
backend messages, field messages, raw response bodies, or exception text.

`src/api/csrf.ts` provides `createCsrfApi().bootstrap()` for
`GET /api/v1/csrf` and copies a readable-cookie token into a header for unsafe
methods. `createFeedNowApiClient()` uses the retained names `feednow_csrf` and
`X-CSRF-Token`. Missing configured tokens block unsafe requests locally. The
lower-level `createApiClient()` remains configurable for isolated tests.

The retained typed feature modules are `src/api/account.ts` for the profile
contract, `src/api/apiKeys.ts` for organization API-key contracts, and
`src/api/session.ts` for `GET /api/v1/session`,
`GET /api/v1/auth/context`, and `POST /api/v1/logout`. The registered handoff
request is in `src/api/handoff.ts`. Request/response types are in
`src/types/browser-api.ts`. These methods are not wired to screens.

The browser-session, client-context, CSRF, logout, and handoff methods use the
retained contract specification and are covered by mocked transport tests.
These tests verify URL encoding, response typing, empty 204 responses, and
CSRF-header behavior only; they do not prove those backend routes are mounted
or that the session cookie authorizes `/v1` requests. Phase 05 service
integration must establish that evidence before Phase 06 uses session
discovery in routed UI.

The custom credential, challenge, registration, verification, recovery,
federation, profile-mutation, and security methods remain absent. The Managed
Login target and Phase 05 spec keep passwords, OAuth,
sessions, cookies, redirects, logout, CSRF enforcement, and Vispector
authorization backend-owned. Phase 05 adds typed request consumers for the
retained session, context, CSRF bootstrap, logout, and handoff contracts;
local mocked transport tests do not prove service or deployed integration.
The Phase 00 contract remains authoritative only for details that do not
conflict with Managed Login.

## Local API proxy

`vite.config.ts` proxies relative `/api/*` requests to
`http://127.0.0.1:8000` by default, matching the local `feednow-auth` server.
Set `FEEDNOW_AUTH_ORIGIN` to override that local target. The proxy strips
exactly one leading `/api` before forwarding, preserving `/v1/*` and `/oauth/*`
paths, query, method, body, cookies, required headers, and backend response
status, content type, and body. It does not rewrite frontend routes; Vite
serves the SPA shell for routes such as `/login`. `src/lib/dev-proxy.test.ts`
verifies these behaviors against an ephemeral upstream, including
`/api/oauth/login`, `/api/oauth/callback`, unchanged JSON 401/429 responses,
and method/body/cookie/header forwarding. This remains local proxy evidence,
not deployed CloudFront behavior.

## Local development and checks

Node 22 LTS is pinned in `.nvmrc`. Use the pinned version and npm:

```text
nvm use
npm ci
npm run dev
```

Vite serves the app on port 3000. Browser API calls stay relative `/api/...`
requests. The shared local Compose file starts the UI at `http://localhost:3000`
and backend at `http://localhost:8000`; it forwards browser API traffic from
Vite to the backend service name inside Docker. See the backend
[`RUNNING_WITH_COGNITO.md`](../../feednow-auth/docs/RUNNING_WITH_COGNITO.md)
for local setup. Static hosting and production deployment remain deferred.

Available commands:

```text
npm run lint
npm run typecheck
npm run test                 # Vitest, non-watch
npm run test:e2e             # Playwright against a fresh built preview
npm run build
npm run check                 # lint + typecheck + test + build
npm run preview
```

The Phase 03 handoff sequence `npm ci`, `npm run check`, and
`npm run test:e2e` passed. Lint and strict TypeScript passed; 18 Vitest files
and 93 tests passed; the production build completed. Playwright passed all 45
Chromium tests across the configured viewports, including direct route loads,
unknown-route handling, in-app navigation, protected-route loading, responsive
auth-card checks, and visible keyboard focus. Three auth-card and three
protected-loading screenshot baselines cover the current routes at the
configured viewports.

## Responsive and accessibility evidence

`e2e/design-system.spec.ts` runs against the built static artifact on these
Chromium projects:

| Project | Viewport |
| --- | --- |
| `desktop-1280` | 1280 × 800 |
| `tablet-768` | 768 × 1024 |
| `mobile-375` | 375 × 812 |

`e2e/routing.spec.ts` verifies every public route and all protected paths by
direct navigation, the visible default protected loading state, in-app
navigation, unknown-route behavior, and horizontal overflow at the configured
viewports. Protected loading and unauthenticated states use `AuthCard`, so
they remain understandable while Phase 06 session discovery is not yet wired.
`e2e/design-system.spec.ts` checks the routed auth card, visible keyboard focus,
and its visual baseline. Account-shell navigation and mobile Sheet focus
containment/restoration remain covered by `src/components/account-shell.test.tsx`.
Three committed `toHaveScreenshot` baselines cover the routed AuthCard and
three cover the protected loading card at these viewports. The earlier gallery
and account-shell screenshot baselines were removed when the gallery ceased to
be an application route.

Baselines were generated on macOS 26.6.2 with Playwright 1.63.0 and its pinned
Chromium 153.0.8010.12 build (Playwright Chromium v1243). Regenerate only after
an intentional visual change, using the same environment:

```text
npx playwright install chromium
npm run test:e2e -- --update-snapshots
```

Then review the changed PNGs and record the OS, Playwright/Chromium versions,
and viewport set in the commit message. Regular verification is
`npm run test:e2e` without snapshot-update mode.

No manual screen-reader session, physical tablet-device test, deployed edge
check, backend call, or live authentication flow was performed. The proxy test
uses an ephemeral local upstream; it does not verify a running `feednow-auth`
service.
