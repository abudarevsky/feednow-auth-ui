# Phase 03 — Routing, layouts, and local edge shape

**Dependency:** Phases 01 and 02  
**Handoff to:** Phases 06–11

## Goal

Make all intended UI paths routable with public/protected layouts and a local
development shape that matches production.

## Work boundary

- Add React Router paths for auth and account areas, route guards based on an
  injected session abstraction, 404 handling, and responsive shells.
- Configure Vite `/api/*` proxy to local `feednow-auth`; no component uses
  an API Gateway URL.
- Test direct route loading and unknown-route behavior.

## Acceptance criteria

- Public and protected paths render deterministic loading/unauthenticated states.
- Local proxy forwards API requests while frontend navigation remains local.
- No SPA fallback, proxy, or mock disguises an API error as HTML.

## Non-goals

Fetching a real session, login, or production CloudFront configuration.

## Handoff

Record route table, proxy configuration, and direct-navigation test evidence.
