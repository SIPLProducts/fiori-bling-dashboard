# Keep only the last 6 sync runs

Goal: the scheduler history permanently holds only the 6 most recent runs per API; anything older is deleted, and the 10-minute job never stalls again.

## What changes

1. **Prune on every run** — after a sync run finishes (success or error), delete all but the newest 6 runs for that endpoint. History stays small and always current.
2. **One-time cleanup** — remove the existing older run records now (16 rows today), leaving the newest 6.
3. **Never silently stop** — the current rule that parks the job after 5 consecutive failures is removed, so cron keeps calling every 10 minutes and each attempt is recorded (with its real error) instead of vanishing from the list.
4. **Skipped attempts are visible** — if a run is skipped because another one is still in flight, it is recorded as a skipped row rather than disappearing.

## Technical notes

- `src/lib/sap-pull.server.ts`: add a `pruneRuns(endpoint, keep = 6)` helper that deletes `sap_sync_runs` rows outside the newest 6 by `started_at`; call it at the end of `storeZfisalesPayload` and on the error path. Remove `circuitOpen` and its call site; keep the in-flight single-flight guard but log a skipped run.
- One-time delete of older `sap_sync_runs` rows via a data change (keeping the newest 6 per endpoint).
- No UI changes needed — the scheduler table already lists the most recent runs with size/time/payload detail.
