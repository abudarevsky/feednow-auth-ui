# Phase 12 — Static artifact, private S3, and OAC

**Dependency:** Phase 01  
**Handoff to:** Phase 13

## Goal

Provision reproducible private static hosting without exposing the account UI
bucket publicly.

## Work boundary

- Define infrastructure-as-code for a private S3 bucket, Block Public Access,
  encryption/lifecycle as appropriate, CloudFront Origin Access Control, and
  deployment artifact inputs.
- Define hashed-asset and index caching policy requirements.

## Acceptance criteria

- Static build artifact deploys to a private bucket; direct public S3 access is
  denied and OAC policy permits only the intended distribution.
- Immutable hashed assets and revalidation-friendly index behavior are verified
  by infrastructure assertions and a controlled test.

## Non-goals

Public DNS, API behavior, TLS certificate issuance, or a live production release.

## Handoff

Record stack inputs, policy assertions, artifact upload/rollback procedure.
