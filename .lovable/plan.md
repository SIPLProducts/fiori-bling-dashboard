# Fix: empty SAP result + no rows in Scheduler history

## What the two symptoms mean

**1. "Data Not Available for this selection"**
This is SAP's own answer, not an error in the portal. The connection worked end to end: HTTP 200 in 232 ms from `http://10.10.4.18:8000/fisales_detail/report?sap-client=234`. SAP simply found no records for the selection that was sent (posting-date window, company code, profit centre, plant, and the SAP client number).

Two things to check on that request:
- The SAP client in the URL is **234**, while the working development connection used **243**. If 234 is not the client that holds the sales data, every call returns exactly this message.
- When the saved request has no valid posting dates, the portal fills in "last 7 days". If nothing was posted in that window on that client, SAP returns the same message.

**2. Scheduler shows no runs**
Confirmed cause in the database rules: `sap_sync_runs` allows signed-in users to **read** only — insert and update are denied. On the Lovable-hosted site the run is written by the server, which is allowed. On your on-site build the sync now runs in the browser, so its attempt to record the run is rejected and the Scheduler list stays empty even after a successful call. Nothing else is broken: the data write itself is a separate path.

## Changes

### 1. Let the on-site build record its runs
Add two database functions, callable only by a Sharvi Admin:
- `start_sync_run(endpoint, snapshot, counters)` — creates the run row and returns its id
- `finish_sync_run(run_id, status, counts, message)` — closes it and keeps only the latest runs per endpoint

The browser sync path in `src/lib/sap-api.functions.ts` calls these instead of inserting into `sap_sync_runs` directly. The hosted server path is unchanged. Result: every Test/sync on the server appears in "Scheduler health" with payload, counts, size, duration and hop.

### 2. Show SAP's own message plainly
When SAP answers 200 with a `MESSAGE` field and no rows, the result banner and the recorded run say:
"SAP returned no records for this selection (client 234, posting 20260903-20260910)" — including the client and date window actually sent, so a wrong client or empty window is obvious at a glance instead of looking like a failure.

### 3. Surface the effective request
The Request tab shows the exact posting-date window that will be sent (including the auto-filled default), so it can be corrected before testing.

## Technical notes
- Migration adds the two `security definer` functions guarded by `public.is_super_admin(auth.uid())`; `sap_sync_runs` policies stay read-only for direct access.
- Browser sync uses `supabase.rpc(...)`; the server pull in `src/lib/sap-pull.server.ts` keeps its admin-client writes.
- No Nginx or middleware change; rebuild with `npm run build:static` and copy `dist/` up.

## Validation
1. Typecheck passes.
2. On the server: press Test — a row appears in Scheduler health with received/new/updated counts.
3. With a date window that has data (and the correct SAP client), the same run shows rows stored in the sales table.

## One thing to confirm
Which SAP client holds the sales data on this server — **234** (currently saved) or **243** (used earlier)? If it should be 243, that is a one-field change on the SAP Systems tab and may be the whole reason for the empty result.
