# Phase 13 — Account CloudFront, API routing, TLS, DNS, and headers

**Dependency:** Phases 05, 11, and 12  
**Handoff to:** Phase 14

## Goal

Expose the account application safely at its public same-origin domain.

## Work boundary

- Configure the account CloudFront distribution, `/*` static behavior,
  uncached `/api/*` backend behavior including `/api/oauth/login` and the
  registered `/api/oauth/callback`, required forwarding, SPA fallback
  exclusions, ACM in `us-east-1`, Route 53, HTTPS redirect, and response
  security headers.
- Validate explicit CORS/CSRF handling with the service; do not use wildcard
  authenticated CORS.

## Acceptance criteria

- Direct UI routes load; API 404/errors remain API responses, not `index.html`.
- Cognito authorization redirects and callback query strings, cookies,
  methods, Authorization, Origin, Referer, and CSRF
  data required by the approved backend contract survive the edge.
- TLS/DNS/header policy and non-embeddability are proven in a non-production
  environment.

## Non-goals

Production promotion, product-domain changes, or client-side redirect policy.

## Handoff

Record endpoint/edge tests, deployed non-production URL, and rollback steps.
