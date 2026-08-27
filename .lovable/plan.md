# Fix username edit lock and login-page routing

## Changes

1. **Keep Username read-only while editing**
   - Disable the Username input only in the Edit User dialog.
   - Keep Username available when creating a new user.
   - Preserve the existing username during updates so editing other fields cannot clear or change it.

2. **Make the login page reliably appear**
   - Change the root `/` route to send users to `/auth` instead of first sending them through the protected launchpad.
   - Add a session-aware guard on `/auth`: signed-out users see the login form, while already signed-in users go directly to `/launchpad`.
   - Keep protected routes redirecting signed-out users to `/auth`.

3. **Regression verification**
   - Verify `/` and `/auth` display the login form when signed out.
   - Verify an authenticated user is taken to the launchpad.
   - Verify Edit User shows Username as read-only and still saves changes to the other fields.

## Technical details

- Frontend routing and form behavior only; no database migration is needed.
- The username remains part of the update payload unchanged, preserving existing uniqueness validation and login-by-username behavior.
