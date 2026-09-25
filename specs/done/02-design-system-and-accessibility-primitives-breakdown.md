1. Establish the slate/emerald theme layer with verified WCAG contrast
   - Scope: src/index.css, src/test/theme-contrast.test.ts
   - Change: Define the FeedNow theme in src/index.css using Tailwind v4 `@theme` and CSS custom properties, mapping the shadcn semantic variables (--background, --foreground, --card, --primary, --secondary, --muted, --accent, --border, --input, --ring, --destructive and their *-foreground variants) to the spec palette: white/slate surfaces, slate-900 primary text, slate-600/500 secondary text, slate-200 borders, emerald accents (emerald-50/200), red reserved for destructive/error, restrained shadow scale, no gradients. Add the base layer: default font stack and sizes, slate-900-on-white body, a visible :focus-visible outline driven by the emerald ring token, and underlined links (state is never color-only). Token/test contract: Tailwind v4 defaults are oklch, so define every color used in an asserted pair as a literal 6-digit hex value in the @theme block (e.g. --color-feednow-primary: #047857) and have the semantic variables reference those hex custom properties; the contrast test parses the same hex literals from src/index.css by custom-property name (no oklch conversion needed) so tokens and test cannot drift. Contrast arbiter rule: the test asserts WCAG 2.1 AA (>=4.5:1) for slate-900-on-white, slate-600-on-white, red-600-on-white, and white-on-primary-button; because white-on-emerald-600 measures ~3.8:1, set --primary to emerald-700 (#047857) with emerald-800 hover (emerald-600 stays a non-text accent: borders, emerald-50/200 fills, focus ring) and record this deviation from the literal palette in the commit message.
   - Non-goal: No components, no typography page, no routing, no auth behavior, no dark-mode variant.
   - Verify: npm run test passes the new contrast test (hex values parsed from src/index.css so the test and tokens cannot drift); npm run build emits CSS containing the token custom properties.
   - Handoff checks: npm run check.
   - Rollback: Revert the commit; removes theme CSS block and contrast test only; no data or migration effect.
   - Depends on: none

2. Add the spec-enumerated shadcn/ui component set and mount the Toaster
   - Scope: src/components/ui/**, package.json, package-lock.json, src/App.tsx, src/components/ui/ui-smoke.test.tsx
   - Change: Add exactly the shadcn components listed in the specification: Button, Card, Input, Label, Form, Alert, Badge, Separator, DropdownMenu, Avatar, Tabs, Dialog, AlertDialog, Sheet, Table, Tooltip, Skeleton, Sonner (generated code checked in via the shadcn CLI against the existing components.json; keep generated output verbatim except import aliases; add only the Radix/CVA/lucide-react/sonner dependencies the components require). Mount Sonner's <Toaster /> once in src/App.tsx.
   - Non-goal: No custom wrapper components, no design decisions beyond task 1 tokens, no router, no API code, no second component framework, no other shadcn components.
   - Verify: npm run typecheck && npm run build exit 0; a component smoke test renders Button primary/outline/destructive variants and opens a Dialog to prove the generated set works with the theme.
   - Handoff checks: npm run check.
   - Rollback: Revert the commit; removes src/components/ui, added dependencies, and the Toaster mount; no data or migration effect.
   - Depends on: 1

3. Add accessible form-field and status-message patterns
   - Scope: src/components/form-field.tsx, src/components/status-message.tsx, src/components/form-field.test.tsx, src/components/status-message.test.tsx
   - Change: FormField composes shadcn Form/Label/Input into one pattern: programmatic label association, optional hint, error text rendered visibly (never color-only) with role="alert" and wired via aria-describedby, aria-invalid toggled with the error state, and an explicit required indicator. StatusMessage renders screen-reader status text with role="status" and aria-live="polite" for pending/success announcements (the "brief loading state" and confirmation channel later flows will reuse).
   - Non-goal: No validation business rules, no mapping of backend error codes (Phase 04), no form submission or API calls.
   - Verify: npm run test focused on the new specs: label is associated with the control, error is referenced by aria-describedby and announced via role="alert", aria-invalid toggles, keyboard focus reaches the input.
   - Handoff checks: npm run check.
   - Rollback: Revert the commit; removes two components and their tests; no data or migration effect.
   - Depends on: 2

4. Add the auth card layout primitive
   - Scope: src/components/auth-card.tsx, src/components/auth-card.test.tsx
   - Change: Presentational centered `max-w-md` Card with comfortable spacing and title/description/content/footer slots, a single h1 heading, and no fixed heights so content cannot clip; intended container for all future auth screens.
   - Non-goal: No login form, no client-context/product branding data, no routes (Phases 03/07).
   - Verify: npm run test: heading structure and slots render; overflow behavior is proven by the task 9 Playwright suite at 375px.
   - Handoff checks: npm run check.
   - Rollback: Revert the commit; removes one component and its test; no data or migration effect.
   - Depends on: 2, 3

5. Add the account shell with responsive navigation primitive
   - Scope: src/components/account-shell.tsx, src/components/account-nav.tsx, src/components/account-shell.test.tsx
   - Change: Presentational authenticated shell: compact sidebar navigation at desktop widths and a Sheet-based navigation panel with an accessible trigger button on mobile; nav items come from props (label, onSelect, optional active flag rendered as aria-current="page"); a semantic <nav> landmark wraps the list; items are buttons, not links. Radix Sheet must trap focus while open and restore focus to the trigger on close.
   - Non-goal: No React Router, no /account routes, no session or client data (Phases 03/06/09).
   - Verify: npm run test: nav landmark exists, active item exposes aria-current, opening the Sheet moves focus into it and closing restores focus to the trigger.
   - Handoff checks: npm run check.
   - Rollback: Revert the commit; removes two components and the test; no data or migration effect.
   - Depends on: 2, 3

6. Add the destructive confirmation primitive
   - Scope: src/components/confirm-dialog.tsx, src/components/confirm-dialog.test.tsx
   - Change: AlertDialog wrapper for irreversible actions (first consumer: API-key revoke in Phase 10): title/description/body props, a destructive-styled confirm button and a neutral cancel that is the default focused action, onConfirm invoked only on explicit confirmation, dismiss via Escape/backdrop without invoking onConfirm.
   - Non-goal: No revoke/delete calls or flow-specific copy; no business rules.
   - Verify: npm run test: dialog opens with focus on cancel, confirm fires the callback exactly once, Escape closes without confirming, focus returns to the trigger.
   - Handoff checks: npm run check.
   - Rollback: Revert the commit; removes one component and its test; no data or migration effect.
   - Depends on: 2

7. Add loading, empty, and error state blocks
   - Scope: src/components/state-blocks.tsx, src/components/state-blocks.test.tsx
   - Change: Three presentational blocks so no future backend-dependent view is blank: LoadingBlock (Skeleton shapes plus role="status" with sr-only "Loading…"), EmptyState (icon paired with text so meaning is never color-only), ErrorState (renders only a caller-supplied safe message string with role="alert").
   - Non-goal: No error-code-to-copy mapping (Phase 04), no data fetching, no route integration.
   - Verify: npm run test: each block exposes the correct role and text; ErrorState renders only the passed string.
   - Handoff checks: npm run check.
   - Rollback: Revert the commit; removes one component and its test; no data or migration effect.
   - Depends on: 2

8. Render the primitives gallery on the placeholder home route and update dependent assertions
   - Scope: src/routes/home.tsx, src/routes/home.test.tsx, src/App.test.tsx, e2e/app-smoke.spec.ts
   - Change: Replace the Phase 01 placeholder content with a temporary primitives gallery that renders every Phase 02 surface (theme swatches, form-field with error/hint, auth card, account shell, confirm dialog, state blocks, badges/alerts/skeleton) so the existing Playwright setup can exercise it; the gallery is explicitly replaced when Phase 03 owns routing. In the same commit, update the two existing assertions that reference the placeholder so the repo stays green: src/App.test.tsx (currently asserts the placeholder heading "feednow-auth-ui" / "Static React scaffold placeholder" text) and e2e/app-smoke.spec.ts (asserts the placeholder is visible) now assert the gallery heading and one representative primitive per surface is visible.
   - Non-goal: Not a product page; no new behavior beyond the primitives, no routes or links, no API usage.
   - Verify: npm run test (updated home and App specs assert the gallery heading and key primitives mount); npm run build; npm run test:e2e still passes with the updated smoke assertions against npm run preview.
   - Handoff checks: npm run check && npm run test:e2e.
   - Rollback: Revert the commit; restores the placeholder home route and the original App/e2e smoke assertions; no data or migration effect.
   - Depends on: 3, 4, 5, 6, 7

9. Add the Playwright responsive and accessibility evidence suite
   - Scope: e2e/design-system.spec.ts, playwright.config.ts, committed screenshot baseline directory, .gitignore (if baseline path needs an entry)
   - Change: Against the built artifact served by npm run preview, across desktop (1280), tablet (768), and mobile (375) viewport projects: assert document.scrollingElement has no horizontal overflow on the gallery, auth card, and account shell; assert Tab focus produces a visible outline (computed style check on the focused element); open and close Dialog, AlertDialog, and Sheet verifying focus enters the overlay, is trapped, and returns to the trigger; commit toHaveScreenshot baselines as the visual-regression record. Baseline determinism: record the exact generation environment (macOS version, pinned Chromium build from npx playwright --version, viewport projects) in the task commit message and treat that record as part of the evidence per AGENTS.md's "explicitly recorded environment" rule; baselines are only valid when regenerated in the recorded environment.
   - Non-goal: No user flows, auth, or API interactions (Phases 06–11); no manual screen-reader session claimed as automated evidence.
   - Verify: npx playwright install chromium && npm run test:e2e passes; baselines regenerate only via an intentional --update-snapshots run in the recorded environment.
   - Handoff checks: npm run check && npm run test:e2e.
   - Rollback: Revert the commit; removes the spec, config changes, and baselines; no data or migration effect.
   - Depends on: 8

10. Document primitives, accessible behavior, and viewport evidence
   - Scope: docs/README.md
   - Change: Update current-state docs: token palette and its contrast test location (including the emerald-700 --primary deviation note and the literal-hex token/test contract), each primitive's file and accessible behavior (labels, role="alert"/"status", focus trap/restoration, no-color-only rules), the temporary gallery route as the evidence surface, the Playwright responsive/visual suite with its recorded baseline generation environment (OS + Chromium version, from the task 9 commit message) and how to refresh it, and a record of commands/results plus checks not performed (manual screen-reader and tablet-device testing).
   - Non-goal: No claims about flows, backend calls, deployment, or behavior not verified in this phase.
   - Verify: Documentation matches files and test names that exist; final phase gate npm run check && npm run test:e2e passes.
   - Handoff checks: npm ci && npm run check && npm run test:e2e (full phase gate).
   - Rollback: Revert the commit; documentation edits only; no data or migration effect.
   - Depends on: 9
