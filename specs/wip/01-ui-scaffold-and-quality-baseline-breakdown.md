1. Scaffold a static React + TypeScript + Vite application with npm and a pinned Node LTS
   - Scope: package.json, package-lock.json, .nvmrc, .gitignore, tsconfig.json, tsconfig.app.json, tsconfig.node.json, vite.config.ts, index.html, src/main.tsx, src/App.tsx, src/routes/home.tsx, src/vite-env.d.ts
   - Change: Create a Vite React-TS app (no Next.js, no SSR, no server runtime) that renders a minimal placeholder home route component from src/routes/. Set the Vite dev server to port 3000. Pin the supported Node LTS major version in .nvmrc. Provide only dev, build, and preview scripts at this step.
   - Non-goal: No /api proxy, React Router, auth, Cognito, token, or API-client code; no lint/test tooling yet (steps 2, 4, 5).
   - Verify: npm ci && npm run build produces static dist/ output; npm run preview serves the placeholder page and it renders in a browser.
   - Handoff checks: npm ci && npm run build.
   - Rollback: Revert the commit; removes all app files, lockfile, and Node pin; no data or migration effect.
   - Depends on: none

2. Add ESLint and the lint and typecheck scripts
   - Scope: eslint.config.js, package.json (lint, typecheck scripts)
   - Change: Add an ESLint flat config with typescript-eslint and react-hooks rules whose globs cover src/ (and will cover e2e/ when it appears in step 5); fix any reported violations in scaffolded code. Add lint (eslint .) and typecheck (tsc --noEmit) scripts.
   - Non-goal: No formatter changes, no rule customization beyond the recommended TS/react presets, no application behavior changes.
   - Verify: npm run lint and npm run typecheck both exit 0.
   - Handoff checks: npm run lint && npm run typecheck && npm run build.
   - Rollback: Revert the commit; removes eslint.config.js and the two scripts; no data or migration effect.
   - Depends on: 1

3. Add Tailwind CSS and shadcn/ui prerequisites
   - Scope: src/index.css, components.json, src/lib/utils.ts, tsconfig.json, tsconfig.app.json, vite.config.ts, package.json
   - Change: Install and configure Tailwind with its base stylesheet imported from the app entry. Add shadcn/ui prerequisites only: components.json, the @/ path alias, and the cn() helper (clsx + tailwind-merge). Apply one Tailwind utility class to the placeholder page to prove the pipeline.
   - Non-goal: No feature components, no design tokens, no final visual system (Phase 02).
   - Verify: npm run typecheck and npm run build exit 0, and the emitted dist/assets/*.css contains the Tailwind preflight plus the utility class used on the placeholder (observable in build output, no manual visual check).
   - Handoff checks: npm run lint && npm run typecheck && npm run build.
   - Rollback: Revert the commit; removes Tailwind/shadcn config, cn helper, and dependencies; no data or migration effect.
   - Depends on: 1

4. Add Vitest + React Testing Library + MSW with the first test suite
   - Scope: vitest.config.ts (or test section in vite.config.ts), src/test/setup.ts, src/test/mocks/ (MSW server and handlers), src/App.test.tsx, package.json (test script)
   - Change: Configure a non-watch jsdom test runner (npm run test) with React Testing Library setup. Add a test that the placeholder route renders, and a test proving MSW intercepts a relative /api/... fetch so future API-boundary tests never touch the network.
   - Non-goal: No src/api/ transport code, no real or production handlers, no AWS/Cognito/real-backend calls from tests.
   - Verify: npm run test passes with both tests green.
   - Handoff checks: npm run lint && npm run typecheck && npm run test && npm run build.
   - Rollback: Revert the commit; removes test config, setup, mocks, and spec files; no data or migration effect.
   - Depends on: 1

5. Add Playwright with a browser smoke test against the built static artifact
   - Scope: playwright.config.ts, e2e/app-smoke.spec.ts, package.json (test:e2e script), .gitignore
   - Change: Configure a non-watch npm run test:e2e that runs against the npm run preview output of the production build (webServer or documented build-then-preview sequence). Add one smoke test that loads / and asserts the placeholder content is visible. Ignore Playwright report/output artifacts in .gitignore. Install browsers via npx playwright install chromium as a documented prerequisite.
   - Non-goal: No auth/user-flow E2E, no responsive or accessibility suites yet (Phases 03, 11); no tests calling AWS, Cognito, or production URLs.
   - Verify: npx playwright install chromium && npm run test:e2e passes locally against the built artifact.
   - Handoff checks: npm run lint && npm run typecheck && npm run test && npm run build && npm run test:e2e (lint and typecheck must cover the new playwright.config.ts and e2e/ files).
   - Rollback: Revert the commit; removes Playwright config, spec, script, and ignore entries; no data or migration effect.
   - Depends on: 1, 2, 4

6. Add the check gate and document commands, version assumptions, and the layout contract
   - Scope: package.json (check script), docs/README.md
   - Change: Add npm run check composing lint + typecheck + test + build. Document the exact local commands (npm ci, dev, lint, typecheck, test, test:e2e, build, check, preview), the pinned Node LTS from .nvmrc, the npx playwright install chromium prerequisite, that the deliverable is static build output for S3/CloudFront hosting, and the src/ layout contract (api, routes, components, hooks, types, lib) for later phases.
   - Non-goal: No CI/CD pipeline (Phase 14); no docs claims about behavior not verified in this phase (no deployed, CloudFront, or Cognito evidence).
   - Verify: npm ci && npm run check passes from a clean install, and npm run test:e2e passes; docs list every Phase 01 script plus the Playwright browser prerequisite with no invented one-off commands.
   - Handoff checks: npm ci && npm run check && npm run test:e2e (full phase gate).
   - Rollback: Revert the commit; removes the check script and documentation edits only; no data or migration effect.
   - Depends on: 2, 3, 4, 5
