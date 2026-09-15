# Phase 07 — Login, challenges, and Vispector handoff

**Dependency:** Phase 06  
**Handoff to:** Phase 11

## Goal

Deliver the primary credential and existing-session path through a validated
return to Vispector.

## Work boundary

- Build email/password login, structured status handling, opaque challenge UI,
  backend-provided federation start action, and handoff loading/failure states.
- Exercise the registered Vispector client/callback contract in browser tests.

## Acceptance criteria

- Valid login and a pre-existing FeedNow session return only through a
  backend-validated client path.
- Invalid credentials, disabled accounts, rate limits, verification, MFA, and
  new-password challenges have safe accessible UX.
- UI neither parses Cognito strings nor creates/exchanges authorization codes.

## Non-goals

Signup/recovery, profile, keys, or direct Cognito integration.

## Handoff

Record end-to-end fixture and browser evidence for each outcome.
