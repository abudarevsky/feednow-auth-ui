# Phase 06 — Client context, session, and protected routing

**Dependency:** Phases 03, 04, and 05  
**Handoff to:** Phases 07, 09, and 10

## Goal

Resolve backend-authoritative product context and central session safely at route
entry.

## Work boundary

- Fetch trusted context, render product branding, discover existing sessions,
  handle unknown/invalid client state, and enforce protected-route transitions.
- Preserve only opaque backend-approved state; add loading and safe error UX.

## Acceptance criteria

- Tests prove browser product labels/return URLs are not trusted.
- Existing-session and unauthenticated flows are deterministic and accessible.
- Account routes never flash protected content while state is unresolved.

## Non-goals

Credential submission, registration, profile editing, or key management.

## Handoff

Record session/context state model and route test evidence.
