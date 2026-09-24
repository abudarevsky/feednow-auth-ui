# feednow-auth-ui current state

Phase 01 (static UI scaffold and quality baseline) and Phase 02 (design system
and accessibility primitives) are implemented and locally verified. This is a
static React + TypeScript + Vite browser application. Phase 02 provides reusable
presentation primitives and a temporary gallery at `/`; it does not implement
authentication flows, account API calls, session behavior, or deployment.

The current phase-02 requirements and task breakdown live in
`specs/wip/02-design-system-and-accessibility-primitives.md` and its accepted
breakdown. Future, unaccepted work remains in `specs/` and is not current
behavior.

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
| State blocks | `src/components/state-blocks.tsx` | LoadingBlock announces “Loading…” with `role="status"` and decorative Skeletons; EmptyState pairs an icon with visible text; ErrorState renders only its caller-supplied safe message with `role="alert"`. |

The home route in `src/routes/home.tsx` is a temporary primitives gallery so
the components can be reviewed in the browser. Phase 03 replaces this route
when routing and account layouts are implemented.

## Local development and checks

Node 22 LTS is pinned in `.nvmrc`. Use the pinned version and npm:

```text
nvm use
npm ci
npm run dev
```

Vite serves the app on port 3000. Browser API requests, when introduced, must
remain relative `/api/...` calls through typed API modules; Phase 02 makes no
backend calls. The static production output is `dist/`, intended for private S3
hosting behind CloudFront in the later hosting phases.

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

The Phase 02 handoff sequence `npm ci`, `npm run check`, and
`npm run test:e2e` passed. Lint and strict TypeScript passed; 14 Vitest files
and 84 tests passed; the production build completed. Playwright passed all 18
Chromium tests across the configured viewports.

## Responsive and accessibility evidence

`e2e/design-system.spec.ts` runs against the built static artifact on these
Chromium projects:

| Project | Viewport |
| --- | --- |
| `desktop-1280` | 1280 × 800 |
| `tablet-768` | 768 × 1024 |
| `mobile-375` | 375 × 812 |

The suite checks horizontal overflow in the gallery, auth card, and account
shell; verifies a visible computed focus outline after Tab; and checks focus
entry, containment, Escape dismissal, and focus restoration for Dialog and
AlertDialog at every viewport and for the mobile Sheet. Six committed
`toHaveScreenshot` baselines cover the AuthCard and account shell at these
viewports.

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

No manual screen-reader session or physical tablet-device test was performed.
No deployed, edge, backend, or live authentication behavior is claimed by these
local checks.
