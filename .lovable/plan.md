# Permanently stabilize the login page

## Confirmed findings

- The earlier protections are still present: `/auth` is client-only, and a rejected server-entry import is cleared instead of being cached forever.
- The displayed message is the application-wide server/error fallback, not a credential or login-form validation error.
- A fresh-browser check reproduced delayed login rendering: the first requests returned an empty client shell before the form rendered on a later navigation. No browser console or failed-network signal identified the original server exception in the current preview.
- The current server recovery only helps the **next** request after a transient startup/import failure; the request that encounters the failure still receives “This page didn't load.”

## Fix

1. **Recover within the failing request**
   - For safe page-load requests, retry the application server handler once after clearing the cached entry when startup/import processing fails or returns the framework’s generic catastrophic 500.
   - Never retry mutations, API calls, or server-function requests, preventing duplicate writes.
   - Return the existing fallback only if the retry also fails.

2. **Make `/auth` resilient during client startup**
   - Preserve `ssr: false` and the existing login design and behavior.
   - Ensure the client-only route always has a visible loading shell while JavaScript/auth storage initializes, instead of a blank page.
   - Keep auth-session lookup non-blocking so failure or delay in session restoration cannot prevent the sign-in form from rendering.

3. **Improve actionable diagnostics**
   - Log the request path, failure stage, retry attempt, and raw error/stack on the server without exposing secrets.
   - Attach a short incident reference to the final fallback so a future occurrence can be matched to server logs.
   - Preserve the existing global error capture and branded fallback behavior.

4. **Prevent regression**
   - Extend focused tests to cover: `/auth` remains client-only; failed startup imports are not cached; safe document requests retry once; API/mutation requests are never retried; and a second failure returns the fallback.
   - Verify repeated fresh loads and reloads of both `/auth` and `/` at desktop and mobile widths, with the sign-in form appearing every time and no fallback, blank screen, console error, or failed request.
   - Verify normal and demo sign-in still navigate to `/launchpad`.

## Technical scope

- `src/server.ts`
- `src/routes/auth.tsx` and/or the root client shell for a visible hydration fallback
- `src/lib/error-page.ts` only if an incident reference is needed
- Focused regression tests
- No database, SAP integration, credentials, roles, or login-page visual redesign
