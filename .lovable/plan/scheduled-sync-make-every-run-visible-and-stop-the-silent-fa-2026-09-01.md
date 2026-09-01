# Scheduled sync: make every run visible and stop the silent failures

## What the data actually shows

The 10-minute job **is** firing on schedule — there is a run row every 10 minutes without gaps. It is not "not syncing"; recent runs are failing before SAP is reached:

```text
03:40 pm IST  error   Middleware HTTP 404
03:30 pm IST  error   SAP response was not valid JSON
03:20 pm IST  error   Middleware HTTP 404
03:10 pm IST  error   Middleware HTTP 404
03:00 pm IST  error   Middleware HTTP 502
02:50 pm and earlier  success  received 17, updated 17
```

Two separate causes:

1. **404 / 502** come from the ngrok tunnel, not from SAP. When the local `node server.mjs` is restarted or the tunnel reconnects, the saved middleware URL answers 404/502 for a while. The portal records that correctly but the message ("Middleware HTTP 404") does not say who returned it.
2. **"SAP response was not valid JSON"** is the big pull. Your console shows SAP returning **5,445,603 bytes**. That response is fine, but it is truncated/rejected on the way back, so the run stores nothing.

Also worth noting: the payload the scheduler sends is the saved endpoint body, currently
`{"BUKRS":"1000","BUDAT_F":"20250101","BUDAT_T":"20260901","PRCTR":"PGNLB12001","WERKS":"1200"}` —
a 20-month window, which is why the response is 5 MB. The successful 17-row runs used a narrow 28–31 Aug window. Nothing is hard-coded; the scheduler simply reuses whatever is saved on the Request tab.

## What will be built

**1. Per-run detail in the Scheduler tab**

Each row in "Scheduler health" becomes expandable and shows, for that run (not just the last one):

- payload actually sent (body, path, method, system, middleware URL)
- Received / New / Updated / Skipped counts
- SAP response size in KB/MB and duration in seconds
- HTTP status and which hop failed (portal → middleware → SAP)

Row count columns stay visible in the collapsed table so "how much came in, how much inserted, how much updated" is readable at a glance for every run.

**2. Honest error messages**

Replace "Middleware HTTP 404" with e.g. "Middleware/tunnel returned 404 — SAP was not contacted (tunnel likely restarted)" and "SAP returned 5.2 MB that could not be parsed as JSON" so a failure names its hop.

**3. Handle the 5 MB response**

- Raise the middleware and portal read timeouts and read the response as a stream instead of one string.
- Store the received byte count and row count on the run.
- Log payload and row count in the Node middleware console for each call, so the terminal output matches the portal.

**4. One automatic retry**

On a 404/502/timeout from the tunnel, retry once after a short delay before recording the run as an error — this absorbs tunnel reconnects instead of losing a 10-minute slot.

## Technical notes

- `sap_sync_runs` gains `response_bytes`, `duration_ms`, `http_status`, `records_skipped` (migration, with grants unchanged — the table is read-only to authenticated users).
- `src/lib/sap-pull.server.ts`: capture timing/size/status, classify the failing hop, single retry with backoff, keep the existing single-flight and circuit-breaker guards and the "never delete on empty response" rule.
- `src/lib/sap-api.functions.ts`: return the new fields in `listSyncRuns`.
- `src/routes/_authenticated/admin/sap-api.tsx`: expandable run rows with per-run payload and counts, replacing the single "Payload sent on the last scheduled run" box.
- `middleware/server.mjs`: log outbound payload, response bytes and parsed row count per request id.

## Not changing

The cron schedule itself (already every 10 minutes) and the saved request payload — you keep controlling the date window on the Request tab.
