# feednow-auth-ui delivery map — Cognito Managed Login revision

## Source and lifecycle

The [target specification](../draft/feednow-auth-ui-specification.md) replaces
the custom-auth plan. Completed Phase 00–03 files record prior decisions and
verified implementation; this revision supersedes their future auth paths
without rewriting their history. Phase 04 is complete; Phase 05 is the active
phase in `specs/wip/` following the user's 2026-09-25 implementation
instruction. Current behavior remains in [docs/README.md](../../docs/README.md).

| Phase | Reviewable unit | Depends on |
| --- | --- | --- |
| 01–03 | Scaffold, UI primitives, router/edge foundation (completed) | Historical |
| 04 | Reconcile typed browser client with Managed Login boundary (completed) | 00–03 |
| 05 | Mount/verify backend OAuth, browser session, logout, registered handoff, and account contracts | 04 contract inventory; existing backend OAuth work (deployed proof remains pending and must be reported separately) |
| 06 | Session discovery and protected route redirect with destination restore | 03–05 |
| 07 | Managed Login entry and Vispector handoff | 05–06 |
| 08 | Legacy auth route migration and Cognito self-service journey verification | 05–07 |
| 09 | Profile, subscription, usage, account status, authorized admin views | 05–06 |
| 10 | API-key management | 05–06 |
| 11 | Logout, cross-flow E2E, accessibility hardening | 07–10 |
| 12 | Static artifact, private S3/OAC | 01 |
| 13 | CloudFront API/OAuth behavior, TLS, DNS, headers | 05, 11, 12 |
| 14 | CI/CD and non-production deployed verification | 11, 13 |

## Invariants

- Cognito Managed Login is the only interactive authentication UI. The Python
  backend owns OAuth, sessions, logout, shadow registration, and redirect
  authorization. The frontend owns one backend-discovered session view only.
- Existing `/oauth/login` and `/oauth/callback` code is reused and mounted;
  unimplemented browser-session/logout/handoff contracts are not presumed live.
- The UI does not accept passwords or codes, handle Cognito client secrets or
  tokens, merge users by email, or approve Vispector callback destinations.
- Browser calls are same-origin `/api/*`; OAuth and JSON API failures must
  never receive the SPA shell.
- Backend authorization governs account/admin/key data and mutations. No
  Shopify integration or unrelated product functionality is part of this plan.
- Local mock results, browser tests, edge assertions, and deployed Cognito
  smoke are recorded as distinct evidence.
