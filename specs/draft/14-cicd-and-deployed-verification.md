# Phase 14 — CI/CD and deployed verification

**Dependency:** Phases 11 and 13  
**Handoff to:** operations and future consumer adoption

## Goal

Make UI delivery repeatable and provide truthful non-production evidence for the
full browser-to-service path.

## Work boundary

- Add independently triggered UI pipeline stages: install, lint, typecheck,
  tests, build, artifact deployment, targeted cache revalidation, and smoke.
- Define protected environment inputs, rollback, release observation, and
  Cognito-backed non-production smoke procedures.

## Acceptance criteria

- Failed checks prevent deployment; UI deployment does not deploy Vispector or
  the service unintentionally.
- CI records artifact/version, static edge checks, and an authenticated
  non-production smoke result or an explicit environment blocker.
- Rollback restores a known static version without invalidating immutable assets
  unnecessarily.

## Non-goals

Automatic production rollout, product adoption, billing, or future SSO features.

## Handoff

Deliver pipeline configuration, release/runbook evidence, and remaining
production approval requirements.
