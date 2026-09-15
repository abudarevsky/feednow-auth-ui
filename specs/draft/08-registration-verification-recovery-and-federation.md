# Phase 08 — Registration, verification, recovery, and federation start

**Dependency:** Phases 04, 05, and 07  
**Handoff to:** Phase 11

## Goal

Complete backend-controlled account-onboarding and credential-recovery journeys.

## Work boundary

- Implement configuration-gated signup, email verification/resend, recovery
  request/code/new-password/completion, and federation-start UX.
- Preserve backend anti-enumeration behavior and opaque challenge semantics.

## Acceptance criteria

- Tests cover successful, expired, invalid, already-verified, unavailable, and
  backend-failure states without revealing account existence when withheld.
- Passwords/codes are not logged or stored; federation URL comes only from the
  backend.

## Non-goals

Direct Cognito UI, MFA administration, passkeys, or account settings.

## Handoff

Record test matrix and copy/accessibility evidence.
