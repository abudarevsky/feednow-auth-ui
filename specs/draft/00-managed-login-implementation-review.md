# Managed Login implementation review — 2026-09-24

This is planning evidence for the revised specification. The two checkouts had
uncommitted work during inspection; this review neither accepts that work nor
claims deployment. The frontend source has typed API modules and placeholders,
not implemented credential screens.

## Frontend inventory

| Current source | Observation | Planned treatment |
| --- | --- | --- |
| `src/routes/route-table.ts`, `router.tsx`, `route-layouts.tsx` | Public `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`, `/logout` paths render placeholder cards; the public layout links to sign-in/signup. | `/login` and `/logout` become backend navigation entries. Legacy credential URLs redirect to backend login. Remove signup/form navigation; keep account routes and shared layouts. |
| `src/routes/route-guards.tsx`, `session-provider.tsx` | Protected routes show loading or a link to `/login`; session state is injected and never discovered. | Reuse loading guard, add backend session discovery and automatic full-page redirect preserving the requested deep link. |
| `src/components/auth-card.tsx`, `form-field.tsx`, `status-message.tsx`, `state-blocks.tsx` | Reusable presentation primitives; no live credential form found. | Reuse for pending/error/account forms. Do not add password/code forms. |
| `src/components/account-shell.tsx`, `account-nav.tsx`, `confirm-dialog.tsx` | Account layout, mobile nav, and destructive confirmation already exist. | Reuse for profile, keys, subscription, usage, status, and authorized admin features. |
| `src/api/auth.ts`, `src/types/browser-api.ts` | Typed custom login/challenge/federation/signup/verification/reset/password DTOs and calls target proposed, unmounted `/api/v1/*` routes. | Remove obsolete credential methods/types and corresponding tests in active Phase 04 reconciliation. Keep only approved session/CSRF/logout/navigation contracts after backend review. |
| `src/api/account.ts`, `apiKeys.ts`, `client.ts`, `csrf.ts` | Shared transport, safe same-origin requests, CSRF adapter, profile/key modules exist; profile mutation and security endpoints are proposed rather than mounted. | Reuse transport and source-backed `/v1/me`/key schemas. Reconcile account methods with actual backend routes and cookie authorization before wiring screens. |

## Backend inventory

- Untracked `src/app/api/oauth.py` implements `GET /oauth/login` and
  `GET /oauth/callback`: validated `next`, one-time state, PKCE, token exchange,
  verified profile, `resolve_or_provision`, session cookie, and return redirect.
  Integration tests also appear as untracked files. Preserve and test this
  work; it is not evidence that the production app mounts the router.
- `src/app/main.py` mounts health plus caller-supplied routers; inspection found
  no default OAuth mount or browser session/logout route in that file.
- `src/app/services/identity.py` resolves external identity by provider
  subject, gates profile provisioning, and treats email collision as conflict.
  The callback invokes it only after token/profile validation. Verify this in
  mounted integration tests and with native/Google identities.
- `/v1/me` and organization API-key schemas/routes exist for bearer callers.
  Cookie-session use, profile editing, subscription, usage, account status
  views, and admin capability discovery require a verified contract.
- `docs/RUNNING_WITH_COGNITO.md` describes a local callback capture and
  classic Hosted UI configuration. Phase 08 must reconcile this with the
  Managed Login configuration decision and record real native/Google,
  signup, verification, and recovery results. Local capture is not the
  production callback or account session flow.

## Path and trust decisions to close in Phase 05

1. Expose browser `/api/oauth/login` and `/api/oauth/callback` by forwarding
   to backend `/oauth/login` and `/oauth/callback`, or publish an equivalent
   reviewed same-origin route pair. Register the exact public callback URI
   with Cognito. Keep `/api/v1/*` for JSON APIs.
2. Define backend logout entry and Cognito logout return, browser session
   discovery, CSRF, cookie-backed authorization, and registered Vispector
   handoff. Do not route these to old Phase 00 proposed credential endpoints.
3. Bind any requested account deep link or Vispector return to backend
   validated single-use state. An exact-origin allowlist is a useful check,
   but Vispector handoff also needs client registration and callback binding.
4. Decide which account fields/endpoints are real. Defer unsupported
   subscription, usage, status, and admin interactions visibly in phase
   acceptance rather than inventing responses.

No source implementation was changed as part of this planning review.
