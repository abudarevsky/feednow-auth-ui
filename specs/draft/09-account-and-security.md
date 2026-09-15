# Phase 09 — Account and security views

**Dependency:** Phases 04, 05, and 06  
**Handoff to:** Phase 11

## Goal

Deliver a compact authenticated account and security experience backed only by
implemented service capabilities.

## Work boundary

- Render/edit supported profile attributes, email verification status, password
  change, and current-session information.
- Use responsive account navigation and safe loading/empty/error states.

## Acceptance criteria

- Backend state is authoritative; unsupported features are not displayed.
- Desktop and mobile evidence covers navigation, forms, errors, and focus.
- Tests cover load, edit success/failure, session expiry, and safe messaging.

## Non-goals

MFA/passkeys, session history/revocation, organization/member administration.

## Handoff

Record supported fields and any deliberately deferred backend capability.
