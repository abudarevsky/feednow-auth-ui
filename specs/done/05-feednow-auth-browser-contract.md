# Phase 05 — Backend browser and OAuth contract

**Dependency:** Phase 04 contract inventory and existing backend OAuth work
**Repository:** `feednow-auth`
**Handoff to:** Phases 06–11 and 13

## Goal

Make the backend the verified browser authority for Managed Login, account
sessions, logout, registered Vispector handoff, and account data.

## Work boundary

- Reuse `/oauth/login` and `/oauth/callback` code and its PKCE, one-time state,
  code exchange, profile gate, provisioning, and cookie behavior. Mount and
  verify it in the intended runtime; align the registered callback URI and
  `/api/oauth/*` edge rewrite. Avoid rewriting working OAuth logic.
- Add/test browser session discovery, CSRF for unsafe cookie requests, backend
  and Cognito logout, and the session-auth bridge for existing `/v1/me` and
  organization API-key routes. Preserve bearer product clients.
- Define a registered Vispector initiation/handoff contract: approved client,
  bound opaque request state, approved callback, one-time result, and existing
  session behavior. A raw `next` or allowed origin is insufficient authority.
- Define and implement only approved account profile, subscription, usage,
  status, and administrator read/mutation schemas. Document unsupported
  capabilities and enforce backend authorization.
- Verify callback provisioning occurs only after successful authentication;
  identity lookup is by provider subject, with email collision handled as a
  conflict instead of automatic merge.

## Acceptance criteria

- Mounted route and integration tests cover login start, callback success,
  replay/expiry/failure, session cookie, destination restore, Vispector
  handoff, logout, CSRF, and no pre-auth user creation.
- Google and native provider configuration is tested without putting secrets
  or tokens in the browser app. Safe errors and existing `/v1` compatibility
  hold.
- Every browser endpoint has a concrete path/schema and mount evidence;
  subscription, usage, status, and admin gaps remain explicitly deferred.

## Non-goals

Custom credential APIs/forms, a second SPA session, CloudFront deployment,
Shopify, or rewriting the existing OAuth callback.

## Handoff

Publish endpoint/schema matrix, callback/logout configuration, focused and full
service results, and exact live-Cognito/deployed checks still pending.
