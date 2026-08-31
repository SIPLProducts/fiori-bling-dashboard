# Permanently stabilize the login page

## Confirmed problem

The screenshot is the app’s server-level fallback page, not a login-form or credential error. The current `/auth` route has regressed: it no longer includes `ssr: false`, even though the sign-in screen depends on browser auth storage and the earlier approved fix required client-only rendering. The server entry also caches its first dynamic-import promise indefinitely, including a rejected promise, so one transient startup failure can keep subsequent page requests on the fallback until the server restarts.

## Fix

1. **Restore the login route’s browser-only boundary**
   - Add `ssr: false` to `/auth` so the login UI is never server-rendered or blocked by preview auth storage.
   - Keep the existing HBL design, labels, normal sign-in, remembered identifier, and demo login unchanged.

2. **Prevent one startup failure from poisoning later requests**
   - Update the custom server-entry loader to clear a rejected cached import before rethrowing it.
   - A later request can then recover instead of repeatedly returning “This page didn’t load” until a process restart.
   - Preserve the existing safe fallback page and error reporting.

3. **Keep root navigation deterministic**
   - Preserve the direct `/` → `/auth` client redirect without adding a blocking session lookup.
   - Let `/auth` perform its existing non-blocking signed-in-user redirect after the form can render.

4. **Add regression coverage and verify the real flow**
   - Add a focused route test asserting that `/auth` remains client-only, preventing this setting from being accidentally removed again.
   - Repeatedly open and reload `/auth` and `/` in a fresh browser context; confirm the login form appears and the fallback never appears.
   - Verify normal sign-in and demo sign-in still reach `/launchpad`, and check browser/server logs for errors.

## Technical scope

- `src/routes/auth.tsx`
- `src/server.ts`
- A focused regression test using the project’s existing test conventions, or the smallest compatible test setup if none exists
- No database, credentials, roles, SAP integration, or login-page visual changes
