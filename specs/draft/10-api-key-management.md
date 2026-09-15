# Phase 10 — API-key management

**Dependency:** Phases 04, 05, and 06  
**Handoff to:** Phase 11

## Goal

Provide secure, backend-authorized UI for listing, issuing once, copying, and
revoking API keys.

## Work boundary

- Implement scoped list/create/reveal-once/revoke states and destructive
  confirmation, using organization context supplied by the backend.
- Ensure plaintext is transient and no action attempts secret retrieval.

## Acceptance criteria

- Tests prove creation displays the full key once, copy works, later listings
  are masked, and revoke updates to the service’s immediate-revocation state.
- Role/scope decisions are server-side; unauthorized and failed operations have
  safe UX and no secret logging.

## Non-goals

Key rotation, billing/rate limits, organization membership UI, or client-side
credential validation.

## Handoff

Record key lifecycle evidence and supported scope presentation rules.
