# Build breakdown: protect owned organizations

## Build step 1 — Enforce self-organization restrictions and show ownership

- **Files and boundaries:** backend admin schemas/routes and integration
  coverage in `feednow-auth`; UI admin API types/dashboard and focused component
  coverage in `feednow-auth-ui`; update current-state docs in both repositories
  after verification.
- **Behavior:** the backend identifies whether the requesting application
  administrator owns each organization, rejects suspend/delete for that owned
  organization, and returns the ownership indicator. The UI replaces its
  actions menu with **Your Organization** for that row.
- **Focused checks:** backend
  `uv run -- pytest src/tests/integration/test_application_admin_dependency.py`;
  UI `npm run test -- --run src/routes/admin-dashboard.test.tsx`.
- **Handoff checks:** backend `uv run -- ruff check src/app/api/admin.py
  src/app/api/schemas/admin.py src/tests/integration/test_application_admin_dependency.py`;
  UI `npm run check` and `npm run test:e2e` because the administration flow
  changes. Report live deployment checks separately.
- **Rollback or migration:** no stored data or migration; revert the schema,
  route, and UI changes together.
- **Non-goal:** change reactivation or actions for organizations the current
  administrator does not own.
