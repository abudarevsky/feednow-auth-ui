# Phase 07 — Managed Login entry and Vispector handoff

**Dependency:** Phases 05 and 06
**Handoff to:** Phases 08 and 11

## Goal

Connect account and Vispector entry points to the existing backend OAuth flow.

## Work boundary

- Turn `/login` into a backend-login redirect entry with accessible pending
  and safe failure states; Cognito Managed Login presents Google and native
  email/password actions and configured challenges.
- Carry Vispector's opaque initiation request to the backend. Display only
  backend-resolved product context, then follow its registered callback or
  one-time result after a valid central session. Test existing-session
  handoff separately from fresh Cognito authentication.
- Keep PKCE, state, callback exchange, session issue, and redirect approval in
  Python. Retire typed custom login/challenge/federation calls from the UI.

## Acceptance criteria

- Account and Vispector flows return to their approved destinations. Unknown
  clients, forged callbacks, stale/replayed state, provider cancellation, and
  backend errors cannot redirect elsewhere or expose provider text.
- Focused tests precede `npm run check`; `npm run test:e2e` covers full-page
  navigation and direct entry. Non-production Cognito smoke is recorded
  separately.

## Non-goals

Custom password/MFA forms, signup/recovery screens, account settings, or
rewriting the backend OAuth handlers.

## Handoff

Record registered client/callback evidence and browser versus live-provider
results.
