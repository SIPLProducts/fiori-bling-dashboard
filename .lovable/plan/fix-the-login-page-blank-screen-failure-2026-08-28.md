# Fix the login page blank-screen failure

## Confirmed cause

The app successfully reaches `/auth` and sets the correct page title, but its body remains empty while the route waits for `supabase.auth.getSession()` inside `beforeLoad` (`src/routes/auth.tsx`). In the embedded preview, the generated auth storage can wait two seconds and retry once before returning (`src/integrations/supabase/previewAuthStorage.ts`), so the client-only route has nothing to render during that delay. This matches the reproduced state: `/auth` had an empty body initially, then the login form appeared later without a route change or reported runtime error.

The root `/` route also performs a session lookup before redirecting, adding the same avoidable blocking point before users can reach the login page.

## Changes

1. **Make `/auth` render immediately**
   - Remove the blocking async session lookup from the route's `beforeLoad`.
   - Render the complete login screen immediately for signed-out visitors.
   - Check for an existing authenticated user after the page mounts and redirect signed-in users to `/launchpad` without blocking the form.

2. **Make the root redirect deterministic**
   - Change `/` to redirect directly to `/auth` without waiting for browser auth storage.
   - The non-blocking check on `/auth` will forward already signed-in users to `/launchpad`.

3. **Prevent stale navigation after async checks**
   - Cancel/ignore the post-mount session result when the auth page unmounts.
   - Keep the existing sign-in, demo-login, labels, and visual design unchanged.

4. **Regression verification**
   - Repeatedly open and reload `/` and `/auth` while signed out; confirm the form is visible immediately and the body never remains blank.
   - Confirm normal login and demo login still reach `/launchpad`.
   - Confirm visiting `/auth` with an active session redirects to `/launchpad`.
   - Check browser console and runtime logs for errors.

## Technical scope

Frontend routing/session timing only: `src/routes/index.tsx` and `src/routes/auth.tsx`. No database, credential, permission, or deployment changes.
