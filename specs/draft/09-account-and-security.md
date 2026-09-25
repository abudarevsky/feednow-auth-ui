# Phase 09 — Account profile, status, subscription, usage, and admin views

**Dependency:** Phases 05 and 06
**Handoff to:** Phase 11

## Goal

Deliver authenticated account management from backend-supported capabilities.

## Work boundary

- Render/edit supported profile fields; show authoritative account status,
  subscription information, and usage statistics with period, units, and
  freshness. Use backend responses, never locally inferred entitlements.
- Add administrator views/actions only where Phase 05 supplies capability
  discovery and operation-level authorization. Hide unsupported actions and
  handle 403 without leaking privileged data.
- Reuse the account shell, navigation, state blocks, safe error mapping, and
  responsive primitives. Credential change, verification, and recovery remain
  in Cognito Managed Login or backend-owned navigation.

## Acceptance criteria

- Load/empty/error/expiry/unauthorized and supported mutation tests pass;
  sensitive/unsupported fields do not appear. Backend rejects unauthorized
  admin access even if a browser reveals or calls a hidden action.
- Focused tests, `npm run check`, and `npm run test:e2e` cover desktop/mobile,
  direct routes, focus, and service capability gaps.

## Non-goals

Custom password/security forms, frontend authorization decisions, payments,
Shopify, or organization/member management without an approved backend contract.

## Handoff

Record exact supported fields, endpoints, permissions, test results, and
explicitly deferred subscription/usage/admin capabilities.
