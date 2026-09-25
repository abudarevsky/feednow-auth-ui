# Phase 08 — Legacy auth route migration and Cognito self-service journeys

**Dependency:** Phases 05–07
**Handoff to:** Phase 11

## Goal

Retire planned custom credential screens and verify Cognito Managed Login owns
registration, verification, recovery, Google, and native sign-in.

## Work boundary

- Remove public navigation and frontend API types/modules for custom signup,
  verification, password reset, challenge, and separate federation start.
- Redirect old `/signup`, `/verify-email`, `/forgot-password`, and
  `/reset-password` bookmarks to the backend login entry, preserving only a
  backend-approved account/product destination. Never accept or retain
  credentials/codes on those routes.
- Verify Cognito Managed Login pool/client/domain branding and
  providers enable native and Google entry, self-service signup, verification,
  and recovery. Verify shadow registration
  only after successful callback and no email-only identity merge.

## Acceptance criteria

- No app-owned password/code form or reachable custom credential API remains.
  Legacy routes reach Managed Login safely; direct-route browser checks pass.
- Focused checks, `npm run check`, `npm run test:e2e`, and available
  non-production Cognito journey evidence distinguish mocks from provider
  behavior.

## Non-goals

Cognito UI cloning, frontend secrets, direct registration endpoints, Shopify,
profile editing, or billing.

## Handoff

Record removed/reused components and routes, provider configuration, browser
results, and any unperformed live journey.
