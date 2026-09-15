# Phase 05 — feednow-auth browser contract

**Dependency:** Phase 00  
**Repository:** `feednow-auth`  
**Handoff to:** Phases 06–10 and 13

## Goal

Implement and verify the backend capabilities required by the account UI while
preserving the service’s existing provider-neutral domain and product API rules.

## Work boundary

- Add versioned handlers/services for approved context, session, login/challenge,
  registration/verification/recovery, account/security, API-key, handoff,
  logout, and CSRF contracts.
- Integrate Cognito/session/redirect behavior server-side; use structured safe
  outcomes and register trusted clients/callbacks.
- Add service unit/integration tests and update current-state docs only for
  verified functionality.

## Acceptance criteria

- Browser contracts from Phase 00 are implemented with no direct UI Cognito
  dependency and no plaintext/token leakage.
- Existing sessions, redirect validation, one-time authorization results,
  immediate key revocation, and CSRF are covered by appropriate tests.
- Existing `/v1` consumers retain documented compatibility or an approved
  migration path.

## Non-goals

CloudFront, React implementation, organization-management UI, or broad CORS.

## Handoff

Publish real endpoint/schema/version evidence, local integration instructions,
and configuration required for Phase 13.
