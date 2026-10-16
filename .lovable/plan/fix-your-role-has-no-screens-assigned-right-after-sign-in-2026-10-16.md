# Fix "Your role has no screens assigned" right after sign-in

## What happened
Right after Sharvi Admin signed in, the request that loads the module tiles was rejected with "JWT issued at future" (sign-in token timestamp slightly ahead of the server clock, usually a few seconds of clock difference right after login). The other requests in the same second succeeded. The launchpad treated the failed tile list as "no tiles" and showed the misleading "no screens assigned" message. Permissions and data are fine; a page refresh a moment later works.

## Changes
1. Launchpad data loading: check the error of every query (tiles, groups, profile, roles). When a request fails with the "issued at future" / temporary auth error, wait about 1–2 seconds and retry automatically (up to 3 tries).
2. If it still fails, show a clear "Could not load modules — Retry" message with a Retry button instead of "Your role has no screens assigned".
3. Apply the same retry to the role/screen lookup used by every report screen, so a report never shows "Access denied" due to this timing glitch.
4. Show "no screens assigned" only when the data loaded successfully and truly has no tiles.

## Technical details
- `src/lib/sap.functions.ts` `getLaunchpad` and `src/lib/access.ts` `accessForUser`: throw on Supabase errors instead of silently using `[]`.
- Add small `withAuthRetry(fn)` helper in `src/lib/access.ts`: retries when error code is `PGRST303` or HTTP 401 with a "future"/JWT message, delays 1s/2s.
- `useLaunchpad` query: render an error state with retry in the launchpad route.
- Test: helper retries on PGRST303 and succeeds; does not retry on other errors.
- Separately pending (from before): apply the Net Sales speed fix migration.
