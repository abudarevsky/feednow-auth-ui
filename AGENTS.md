# feednow-auth-ui contributor guide

## Product boundary

`feednow-auth-ui` is the independently deployable, static browser application at
`account.feednow.io`. It owns presentation, routing, forms, accessibility, and
typed calls to the `feednow-auth` service. It does **not** own Cognito SDK
integration, passwords, sessions, cookies, redirects, authorization-code
issuance/exchange, API-key security, or persistence. Those remain backend
responsibilities.

The current state belongs in `docs/`. Future work belongs in `specs/`: source
requirements and unaccepted phases are in `specs/draft/`, active accepted work
is in `specs/wip/`, and completed, reviewed work is in `specs/done/`. Specs may
link to current-state docs; docs must never claim work described only in a spec.

## Toolchain

- TypeScript, React, Vite, React Router, Tailwind CSS, and shadcn/ui.
- Use npm and commit its lockfile. Phase 01 pins the supported Node LTS release
  in `.nvmrc`; use that version rather than a machine-global Node assumption.
  Do not introduce a second package manager or a Node production server.
- Production is `npm run build` static output hosted privately in S3 behind
  CloudFront. Local Vite development proxies `/api/*` to `feednow-auth`.
- Keep browser API calls relative (`/api/...`). Do not expose API Gateway URLs
  or place secrets, long-lived tokens, or Cognito configuration in components.

Phase 01 must provide these scripts; later agents must use them rather than
inventing one-off commands:

```text
npm ci                         # clean, lockfile-respecting install
npm run dev                    # Vite only; local interactive development
npm run lint                   # ESLint
npm run typecheck              # tsc --noEmit or equivalent
npm run test                   # non-watch Vitest unit/component suite
npm run test:e2e               # non-watch Playwright suite
npm run build                  # production TypeScript + Vite static build
npm run check                  # lint + typecheck + test + build
npm run preview                # serve the built artifact for E2E/smoke only
```

Use Vitest, React Testing Library, and MSW for unit/component and API-boundary
tests. Use Playwright against `npm run preview` or an explicitly recorded
environment for browser flows, direct-route loading, responsive widths, and
critical accessibility checks. Tests must not call real Cognito, AWS, or a
developer's production account.

For every build step, run the focused test first. Before handoff, run
`npm run check`; additionally run `npm run test:e2e` when changing a user
flow, routing, session behavior, or responsive UI. Infrastructure phases run
their declared CDK synth/assertion checks and a non-production smoke test.
Record commands, actual results, and unperformed browser/edge/deployment checks
in the phase handoff. A green build alone is not visual, edge, or deployed
proof.

## Architecture rules

- Put transport code in `src/api/`, routes in `src/routes/`, reusable UI in
  `src/components/`, route-independent hooks in `src/hooks/`, and shared types
  and error mapping in `src/types/` and `src/lib/`.
- Components call typed API modules rather than ad-hoc `fetch()` calls.
- Backend responses, including client context, session state, redirect approval,
  challenges, supported profile fields, and API-key authorization, are
  authoritative. Treat browser query values only as opaque request state.
- Never display raw backend, AWS, or Cognito errors. Never log passwords,
  verification codes, CSRF values, tokens, or API-key plaintext.
- Preserve the `/api/*` edge behavior: SPA fallback serves frontend routes only;
  it must not turn API failures into `index.html`.

## Task workflow

Work one numbered phase at a time. The smallest leading-numbered file in
`specs/wip/` is the only active phase. Never delete an empty lifecycle folder.

1. The planner creates or updates a sibling `NN-<phase>-breakdown.md` for the
   selected phase. Each build step states its files/boundaries, focused test,
   full handoff checks, rollback or migration effect, and explicit non-goal.
2. A build-step implements exactly one approved item. Keep the app runnable,
   avoid cross-phase behavior, and update current-state docs only after the
   claimed behavior is verified.
3. Move a phase from `specs/wip/` to `specs/done/` only after its accepted
   breakdown, implementation evidence, and concise documentation are present.

Planner/reviewer dispatch is defined by the project agent configuration, not by
this document. Do not treat an untested backend endpoint, CloudFront
configuration, Cognito flow, or deployed smoke test as complete because a mock
or local component test passes.
