# Phase 11 — Cross-flow E2E, logout, and accessibility hardening

**Dependency:** Phases 07, 08, 09, and 10  
**Handoff to:** Phases 13 and 14

## Goal

Verify the complete account experience and close cross-flow safety/accessibility
gaps before production edge rollout.

## Work boundary

- Implement backend-routed logout and registered destination handling.
- Add browser E2E flows for session/login/handoff, onboarding/recovery,
  account/security, API keys, protected routes, mobile layout, and critical
  accessibility behavior.

## Acceptance criteria

- Logout does not accept arbitrary destinations and leaves no stale privileged UI.
- Critical flows pass browser-level tests; automated accessibility and manual
  keyboard/mobile checks have recorded evidence.
- Raw exceptions, sensitive values, and blank loading states are absent.

## Non-goals

CloudFront deployment, DNS, or a claim of Cognito production verification.

## Handoff

Publish E2E commands/results and the exact deployed smoke requirements.
