# Make the sync schedule real (no hardcoding) and stop losing large SAP responses

## What I verified just now

- The Scheduler tab saves your interval into the endpoint record (`*/10* * * *` is what is stored today), but **nothing reads it**. The actual background job is a fixed 10-minute schedule created separately, so changing the box to `*/5` does nothing. This is the hardcoding you suspected.
- The value you typed, `*/10* * * *`, is also missing a space (`*/10 * * * *`). There is no validation, so a bad expression is accepted silently.
- The middleware still cuts every SAP response at **200,000 characters** before returning it (`middleware/server.mjs`). Your 80,000-row pull can never survive that — it arrives as broken JSON.
- Today's runs did fire (05:20, 05:30, 05:40, 05:50, 06:00, 06:10 IST-equivalent) and every one failed with **404 from the tunnel** — 86 bytes back, SAP never contacted. The saved middleware URL is `https://drilling-situation-chewing.ngrok-free.dev`, so either that tunnel is down or the local middleware is not running behind it. Nothing is recorded as a successful sync because of this, not because the scheduler stopped.

## What will be built

**1. Schedule is driven by what you set — no fixed 10 minutes**

- The interval you choose is applied to the real background schedule the moment you press Save, and removed when you switch scheduled sync off.
- The Scheduler tab gets a picker icon at the right of the input with ready presets: every 5 min, 10 min, 15 min, 30 min, hourly, every 6 hours, daily, weekly. Picking one fills the expression; you can still type your own.
- Below the input: a plain-English read-out ("Runs every 5 minutes"), the **next 3 run times in IST**, and the last run time — so first/second/third scheduled times are visible.
- Invalid expressions are rejected on save with a clear message instead of being stored and ignored.

**2. Large responses (80,000+ rows) stop failing**

- Remove the 200,000-character truncation from the middleware's `/sap/call` response; the full payload is returned.
- Keep truncation only for the log/preview display, never for the data used to sync.
- Stream and upsert in batches with raised timeouts on both middleware and portal so multi-MB pulls complete.
- Record real byte count, duration and row counts per run.

**3. Clearer tunnel failures**

- When the middleware/tunnel returns 404 (as it does right now), the run message will say the saved middleware URL that was called, so a stale ngrok URL is obvious at a glance.

## Note on today's 404s

Even after these fixes, syncs will keep failing until the middleware URL saved on the Middleware Configuration tab points at a live tunnel with `node server.mjs` running behind it. Your latest message shows `drilling-situation-chewing.ngrok-free.dev`, which is what is saved — it is answering 404. Please confirm that tunnel/middleware is up, or paste the current URL and I will update it.

## Technical notes

- Schedule applied through the database scheduler keyed by endpoint name, created/updated/removed from the endpoint save path in `src/lib/sap-api.functions.ts`; cron expression validated server-side.
- Preset picker + human-readable/next-runs display in `src/routes/_authenticated/admin/sap-api.tsx`.
- Remove `result.body.slice(0, 200000)` in `middleware/server.mjs`; add content-type + short preview to parse errors.
- No change to the upsert rule: existing rows are never deleted on an empty response.
