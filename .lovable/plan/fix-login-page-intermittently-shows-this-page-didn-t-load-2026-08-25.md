# Fix: login page intermittently shows "This page didn't load"

## What's happening

The sign-in page renders fine most of the time, but on a cold server render it can fail and fall back to the app-wide error screen ("This page didn't load"). Reproduced once: the very first request to `/auth` after the server started returned a page with no sign-in content, while later requests rendered normally.

The sign-in page is a browser-only screen — it depends on the auth client and browser storage — so rendering it on the server adds risk with no benefit. The protected area of the app already opts out of server rendering for exactly this reason.

## The fix

1. Mark the `/auth` route as client-rendered (`ssr: false`), matching what the protected layout already does. Page metadata (title/description/OG tags) stays intact for sharing and SEO.
2. Keep the auth client usage inside event handlers only, so nothing auth-related runs during page setup.
3. Verify: load `/auth` cold (fresh server) several times and confirm the sign-in form appears every time with no console errors, then confirm normal sign-in and the demo login still land on the launchpad.

## Technical notes

- `src/routes/auth.tsx`: add `ssr: false` to the `createFileRoute("/auth")` options, alongside the existing `head()` and `component`.
- No change to `src/routes/__root.tsx`, `src/start.ts`, or `src/server.ts`; the error boundary stays as the last-resort fallback.
- No backend, schema, or deployment changes.
