# feednow-auth-ui current state

Phases 01–03 are implemented and locally verified. This is a static React +
TypeScript + Vite browser application. Phase 03 provides client-side routing,
public and protected layouts, an injectable session-state seam, and a local
same-origin API proxy. It does not discover a real session, implement
authentication flows, call account APIs, or configure deployment.

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

## Routing and session seam

`src/routes/route-table.ts` defines the canonical route table from the merged
UI specification:

| Route group | Paths | Layout / state |
| --- | --- | --- |
| Public | `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/logout` | `AuthCard` with safe placeholder content |
| Protected | `/account`, `/account/security`, `/account/api-keys` | `AccountShell` when authenticated; deterministic loading or sign-in prompt otherwise |
| Entry / fallback | `/`, all unknown paths | Entry links / explicit not-found page |

`src/routes/session-context.ts` and `session-provider.tsx` define injected
`loading`, `unauthenticated`, or `authenticated` session state. `App` defaults
to `loading`; a later phase must provide backend-discovered state. Public
routes do not depend on the session. Protected routes do not fetch session
state, interpret query parameters, or perform authentication. Account
navigation uses React Router links and marks the current link with
`aria-current="page"`.

## Typed API transport and contract modules

`src/api/client.ts` provides the shared JSON transport for relative
`/api/*` requests. It sets same-origin credentials and JSON headers, validates
paths before fetch, accepts caller cancellation through `AbortSignal`, and
returns typed response bodies. `src/lib/api-errors.ts` maps HTTP status and
recognized service error codes to fixed UI-safe messages. It does not expose
backend messages, field messages, raw response bodies, or exception text.

`src/api/csrf.ts` copies a token from a readable cookie to a header for unsafe
methods. `createFeedNowApiClient()` uses the Phase 00 names `feednow_csrf` and
`X-CSRF-Token`; its caller must first call the auth module's `bootstrapCsrf()`
endpoint. Missing tokens block unsafe requests locally. The lower-level
`createApiClient()` remains configurable for isolated tests.

Typed feature modules live in `src/api/auth.ts`, `account.ts`, `apiKeys.ts`,
and `clientContext.ts`, with browser DTOs in `src/types/browser-api.ts`. They
cover context/session, login/challenge, handoff/federation, registration,
verification/recovery, logout, profile/security, and organization-scoped
key list/create/revoke requests. Auth status variants, service enums,
pagination, one-time key creation, opaque IDs, request cancellation, and
safe auth error codes are represented by types. Feature modules receive the
shared client as a dependency; no screen currently calls them.

These modules implement only the browser transport contract. Most of the
corresponding browser routes are not implemented in `feednow-auth`; see the
[Phase 00 contract](../specs/done/00-contract-reconciliation.md) and Phase 05
plan. Source-backed `/v1/me` and API-key schemas are not proof of mounted
cookie-session browser routes. Do not treat local mocked transport tests as
service or deployed integration evidence.

## Local API proxy

`vite.config.ts` proxies relative `/api/*` requests to
`http://127.0.0.1:8000` by default, matching the local `feednow-auth` server.
Set `FEEDNOW_AUTH_ORIGIN` to override that local target. The proxy strips
exactly the leading `/api` before forwarding, preserving the versioned `/v1`
path, query, and backend response status, content type, and body. It does not
rewrite frontend routes; Vite serves the SPA shell for routes such as `/login`.
`src/lib/dev-proxy.test.ts` verifies both behaviors against ephemeral local
servers, including a JSON 429 API response that remains JSON rather than
becoming `index.html`.

## Local development and checks

Node 22 LTS is pinned in `.nvmrc`. Use the pinned version and npm:

```text
nvm use
npm ci
npm run dev
```

Vite serves the app on port 3000. Future browser calls must remain relative
`/api/...` requests through the typed transport and feature modules. No current
screen makes backend calls. The static production output is `dist/`, intended
for private S3 hosting behind CloudFront in the later hosting phases.

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
