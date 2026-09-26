# Phase 15 — Local account milestone completion

**Status:** active, authorized by the user on 2026-09-25 from the FeedNow
Auth UI Local Docker Implementation v1.3 spec.
**Repositories:** `feednow-auth` and `feednow-auth-ui`.
**Goal:** complete organization naming, global-admin read views, service-bound
API keys with a local authentication proof endpoint, and local Docker
persistence evidence.

## Included work

1. Organization rename API and explicit `placeholder`/`confirmed` name
   status, including account UI and data-preserving schema migration.
2. Global-admin-only summary, paginated case-insensitive organization search,
   detail and actual membership read APIs; permission-aware admin dashboard,
   search and details UI. Organization and active-membership counts are
   separate. Existing CLI remains the only admin grant/revoke mechanism.
3. Persist `service_id=vispector` on keys, expose it only in masked key
   summaries, and prove normal key authentication on a local protected route.
4. Verify existing Compose build/start and SQLite persistence across a normal
   restart; record live Cognito results only if the configured dev pool is
   reachable.

## Explicit exclusions

Subscription and usage APIs/UI, billing, admin mutations, organization member
management through admin UI, additional products, Vispector deployment, and
production deployment. Existing subscription/usage empty states remain.

## Acceptance and handoff

- Focused backend tests cover rename/status, admin authorization and search,
  membership facts, key service binding, revocation, and the protected local
  key-auth route. SQLite migration preserves existing rows.
- UI uses typed same-origin API modules, shows safe loading/error states, and
  exposes Administration only from backend-authoritative permissions.
- Run backend focused and full tests, `npm run check`, and `npm run test:e2e`
  for changed authenticated routes. Then build/start Compose and prove a key
  still exists after restart. Record PyJWT/dependency, Docker, Cognito, and
  environment blocks separately; do not claim unperformed proof.
- Update current-state docs only for verified behavior. Keep this phase in
  `specs/wip/` until code, docs, and evidence are complete.
