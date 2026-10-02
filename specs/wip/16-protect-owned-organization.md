# Protect owned organizations in administration

## Goal

Prevent an application administrator from suspending or deleting an
organization they own. In the admin dashboard, identify that organization
with a **Your Organization** badge in place of the actions menu.

## Accepted scope

- Include the current administrator's ownership state in backend admin
  organization search and detail responses.
- Reject backend suspend and delete requests for that administrator's owned
  organization.
- Replace the UI action menu with the ownership badge for that organization.

## Non-goals

- Changing organization ownership or membership.
- Changing reactivate behavior, other organization actions, or authorization
  for organizations the administrator does not own.
- Any storage migration or production deployment.

## Completion evidence

The backend integration suite proves owner self-actions are rejected and that
administrators can still act on other organizations. The focused UI test proves
the ownership badge replaces the menu. Canonical docs describe the resulting
behavior after verification.
