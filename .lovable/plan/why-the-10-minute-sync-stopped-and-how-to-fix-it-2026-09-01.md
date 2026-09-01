# Why the 10-minute sync stopped, and how to fix it

## What I checked

- The scheduler itself is healthy: it has fired every 10 minutes without a miss, most recently at 5:50 pm IST.
- Every one of those calls got a reply from the live site saying:
  "skipped — Paused after repeated failures — run Test on the SAP API screen to resume".
- Because the run was skipped, no new row was written to the sync history, which is why the screen still shows 4:09 pm as the last sync.

So the job is running; the live site is refusing to do the work.

## Root cause

The "pause after repeated failures" safety rule (circuit breaker) tripped after the 404/502 tunnel errors this afternoon and has been blocking every scheduled run since.

That rule was already removed in the current working code, but that change has not been published — the live site (which the scheduler calls) is still running the older build with the pause logic.

## Fix

1. Publish the current build so the live site runs the version without the pause rule and with the skipped-run logging and 6-run history pruning.
2. Trigger one scheduled run manually right after publishing and confirm a fresh row appears in the sync history with a real status.
3. If that run reports a middleware/tunnel error, that is the separate ngrok/middleware issue — the scheduler will keep retrying every 10 minutes instead of pausing.

## Technical notes

- Confirmed via `cron.job_run_details` (all runs succeeded, every 10 min) and `net._http_response` (all responses are the "Paused after repeated failures" skip).
- No code change is required; the required change already exists in `src/lib/sap-pull.server.ts` and only needs to reach production.
