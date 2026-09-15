# Replace Demo access with Admin test login

## Goal

Remove the public Demo access block from the sign-in page. In User Management, add a **Login** action only beside active users whose assigned role key is `admin`, so an authorized administrator can test that account without knowing or exposing its password.

## Changes

1. **Remove Demo access**
   - Remove the Demo credentials, Demo access panel, one-click Demo login, and demo-account provisioning code from the sign-in page.
   - Remove the demo account from the self-hosted user-creation seed so future Quality and Production setups do not recreate it.
   - Keep the normal email/username and password sign-in form unchanged.

2. **Add Admin test login in User Management**
   - Show a **Login** action only when the row is active and its exact assigned role is `admin`.
   - Do not show it for Sharvi Admin (`super_admin`), Viewer, Buyer, Approver, inactive users, or the currently signed-in account.
   - Ask for confirmation before switching accounts and clearly name the selected Admin user.

3. **Secure account switching**
   - The server verifies the caller's live session and confirms they currently have User Management screen access.
   - Re-check the target account from the database: it must exist, be active, and still hold the `admin` role.
   - Generate a short-lived, single-use sign-in token through the backend authentication service; never read, store, return, or display the target user's password.
   - Support both deployments: a protected TanStack server function for Lovable-hosted use and a bearer-validated middleware endpoint for the self-hosted static portal.
   - The self-hosted endpoint validates the caller's bearer token and permission itself; it does not trust browser-supplied role details or expose the service key.

4. **Switch session cleanly**
   - On confirmation, cancel requests and clear signed-in caches, exchange the one-time token, then open the launchpad as the selected Admin user.
   - If verification or token exchange fails, keep the original session and show a clear error.
   - The tested Admin account uses the normal Sign out action when testing is complete.

5. **Remove the existing Demo account safely**
   - Stop all automatic creation of `demo@nexus-portal.app`.
   - Delete the existing Demo account through the existing protected User Management delete path in each environment, rather than adding direct Auth-table SQL to a migration.

6. **Verify**
   - Confirm Demo access is absent from `/auth`.
   - Confirm Login appears only for active `admin` rows.
   - Confirm an authorized User Management holder can switch into an Admin account and sees that account's permissions.
   - Confirm inactive, non-Admin, Sharvi Admin, self-target, unauthenticated, and tampered requests are rejected.
   - Confirm both Lovable preview and the self-hosted `/sap-mw/` path work without exposing credentials.

## Deployment note

Production and Quality middleware must be updated and restarted after pulling the change. Existing Demo accounts are removed once from User Management in each environment; no database migration directly edits authentication tables.
