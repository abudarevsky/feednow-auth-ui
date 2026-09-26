# Phase 15 UI follow-up — organization and API key navigation

## Build step 6 — profile onboarding and organization administration

- **Scope:** collect first name, last name, and a confirmed organization name
  for placeholder-name accounts; allow editing the display name; add global
  admin organization suspend, reactivate, and delete actions after details are loaded.
- **Files/boundaries:** UI account/admin routes and typed APIs; backend current
  profile and admin mutation schemas/routes; SQLite storage transactions.
- **Focused checks:** onboarding/profile and admin mutation UI tests, backend
  storage/API tests for profile updates, suspend, reactivate, and delete.
- **Handoff checks:** `npm run check`, `npm run test:e2e`, backend pytest suite,
  and local Docker rebuild/health smoke check. Never execute deletion against
  developer data as a verification step.
- **Migration/rollback:** user names remain in `display_name`; organization
  `suspended_at` is additive and nullable. Suspension records the first time
  and revokes organization keys, while keeping member accounts and memberships
  active so users can sign in and see their suspended status. Backend org
  authorization blocks business operations. Reactivation clears `suspended_at`
  and restores organization access; revoked keys remain revoked. Global admins
  stay active to administer suspended tenants.
  Deletion
  transaction removes organization resources and all associated user accounts,
  identities, sessions, memberships, and keys (current product rule is one
  user per organization).
- **Non-goals:** subscriptions/usage, billing, or cross-device live updates.

### Build step 6 verification addendum

- UI `npm run check`: lint, typecheck, 24 Vitest files / 142 tests, and build
  passed; `npm run test:e2e` passed 48 browser checks across desktop, tablet,
  and mobile, including onboarding and admin action visibility.
- Backend SQLite/storage/schema checks: 82 passed; Ruff passed on changed
  backend files. Docker rebuilt and the API health check passed after the v5
  migration was added.
- The added API-key integration regression test could not be collected in the
  host Python environment because `PyJWT` is not installed there.

## Build step 5 — account organization and API key surfaces

- **Scope:** update the account organization list to show all memberships as
  expandable organization cards with active-member counts; preserve rename and
  name-status behavior on each card; move API-key creation/list/revocation to
  `/account/api-keys`; remove the placeholder Security route; make the
  administration organization list expandable while retaining search and
  pagination.
- **Files/boundaries:** `src/routes/home.tsx`, new
  `src/routes/api-keys.tsx`, `src/routes/admin-dashboard.tsx`, route table and
  route layout, typed organization API, focused UI tests, and this phase's
  current-state docs. No backend authorization or persistence changes.
- **Focused checks:** account, API-key, route-layout, and admin-dashboard
  Vitest suites.
- **Handoff checks:** `npm run check` and `npm run test:e2e` because account
  navigation and authenticated routes change.
- **Migration/rollback:** no storage or API migration; reverting restores the
  current routes and UI surfaces.
- **Non-goals:** subscriptions/usage, billing, realtime cross-user updates,
  admin mutations, and organization membership mutations.

## Organization name diagnosis

The account page previously fetched only `/organizations?limit=1`, so a user
with multiple active memberships always saw the first organization. The
provided screenshots show different emails and different organization views:
the Account page shows a personal UUID-named workspace while the organization
list shows `FeedNow.io`. A rename response is persisted by both SQLite and
DynamoDB adapters; already-open pages keep their in-memory list until they
reload. Showing all memberships and the organization ID on each account card
lets users distinguish the organization they renamed. Cross-device live
updates remain out of scope.

## Build step 5 verification

- Focused Vitest for account, API keys, administration, and route layouts:
  8 passed.
- `npm run check`: lint, TypeScript, 24 Vitest files / 140 tests, and the
  production build passed.
- `npm run test:e2e`: 45 Playwright checks passed across desktop, tablet, and
  mobile projects. Local socket permission was needed by the dev-proxy test
  and preview server.
- `./run-dev.sh --cognito --ui` in the backend Docker directory rebuilt and
  started both containers; API health and UI root returned HTTP 200.
- The organization rename integration test and SQLite persistence test passed.
