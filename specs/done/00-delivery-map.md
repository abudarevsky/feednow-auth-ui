# feednow-auth-ui delivery map

## Source and lifecycle

This is the dependency map for
[the merged specification](feednow-auth-ui-specification.md). It defines future
work only; the current-state baseline is [docs/README.md](../../docs/README.md).
Each numbered file is an independently reviewable unit. A phase moves to
`specs/wip/` only after the planner and plan reviewer accept its breakdown,
then to `specs/done/` only after the build reviewer accepts evidence.

| Phase | Unit | Depends on |
| --- | --- | --- |
| 01 | UI repository scaffold and quality baseline | 00 |
| 02 | Accessible emerald design system | 01 |
| 03 | Router, layouts, local same-origin edge shape | 01, 02 |
| 04 | Typed API client, safe errors, and CSRF support | 00, 01 |
| 05 | Backend browser-contract implementation | 00 |
| 06 | Client context, session discovery, protected routing | 03, 04, 05 |
| 07 | Login, challenges, and validated Vispector handoff | 06 |
| 08 | Registration, verification, recovery, federation start | 04, 05, 07 |
| 09 | Account and security views | 04, 05, 06 |
| 10 | API-key account management | 04, 05, 06 |
| 11 | Logout, cross-flow E2E, and accessibility hardening | 07, 08, 09, 10 |
| 12 | Static artifact and private S3/OAC | 01 |
| 13 | Account CloudFront API behavior, TLS, DNS, headers | 05, 11, 12 |
| 14 | CI/CD and non-production deployed verification | 11, 13 |

## Invariants

- `feednow-auth` remains the only authentication, session, Cognito, redirect,
  API-key-security, and persistence authority.
- Browser calls are relative `/api/*`; UI routes and API errors never share
  an SPA fallback response.
- No frontend phase stores secrets or long-lived tokens, trusts browser
  redirect/client data, or implements organization-management UI.
- Local test success is distinct from browser, CloudFront, Cognito, DNS, and
  deployed smoke evidence.
