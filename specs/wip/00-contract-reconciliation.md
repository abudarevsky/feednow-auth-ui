# Phase 00 — Cross-repository contract reconciliation

**Dependency:** none  
**Handoff to:** Phases 01 and 05

## Goal

Turn the merged UI/service requirements into one unambiguous browser contract
without implementing UI or backend behavior.

## Work boundary

- Reconcile the existing service `/v1` API with the account-host `/api/*`
  browser namespace, including CloudFront path forwarding/rewrite ownership.
- Specify request/response/error schemas for client context, session discovery,
  login outcomes/challenges, verification/recovery, account/security, API keys,
  logout, CSRF, and validated client handoff.
- Record which endpoint/service capability is absent today and assign it to
  Phase 05 rather than implying implementation.

## Acceptance criteria

- Contract names canonical browser paths, backend paths, status/error envelope,
  cookie/CSRF behavior, and opaque fields.
- It identifies every client-supplied field the backend must validate.
- It preserves existing versioned product APIs and does not claim current
  implementation without source/test evidence.

## Non-goals

Writing handlers, React code, CloudFront resources, or changing Cognito.

## Handoff

Publish schema examples, compatibility decisions, open service changes, and a
test matrix usable by both repositories.
