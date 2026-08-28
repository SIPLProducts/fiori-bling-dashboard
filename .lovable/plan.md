# Fix SAP connectivity and implement Sales KPI synchronization

## Confirmed current state

- The portal is correctly configured to call `https://donation-pantyhose-starter.ngrok-free.dev`.
- The middleware is reachable through ngrok, but it rejects the current portal origin `https://27aeaa58-eb6a-4965-897d-c1097d9ba383.lovableproject.com` before making an SAP request.
- `Sales_Reports_KPI` is enabled with `*/10 * * * *`, but this value is only stored. No scheduler currently executes it.
- No `sales_reports_kpi` or `sap_sync_runs` tables currently exist, so a successful Test cannot persist report rows.

## Implementation

1. **Restore portal → middleware → SAP connectivity**
   - Update the middleware environment guidance and startup diagnostics to require the exact `lovableproject.com` preview origin, published portal origin, custom domain, and localhost as separate `ALLOWED_ORIGINS` values.
   - Keep `APP_BASE_URL` as the ngrok URL and `PORTAL_BACKEND_URL` as the Lovable Cloud backend URL.
   - Add a startup self-check that clearly reports whether the current origin allow-list and portal token verification are ready.
   - Preserve trace-based logs so a `-> SAP POST ...` line definitively proves SAP was contacted.

2. **Create secure synchronization storage**
   - Create `sales_reports_kpi` for SAP FI/SD report rows, including the business key, principal searchable fields, complete raw SAP row, source endpoint, and `synced_at` timestamp.
   - Use `WERKS + GJAHR + BELNR + POSNR + HKONT` as the deterministic `record_key`.
   - Create `sap_sync_runs` to record start/end time, status, records received, inserted, updated, unchanged, and error details.
   - Apply authenticated access rules for report users and full service access for the trusted sync process.

3. **Build the real sync pipeline**
   - Add a secured server sync handler that loads the active endpoint/system configuration, calls the ngrok middleware, validates and parses the configured response path, and upserts SAP rows by `record_key`.
   - Existing records will be updated, new records inserted, and every successfully processed row will receive the latest `synced_at` value.
   - Record each run in `sap_sync_runs` and update endpoint fields such as last run status/time and last successful sync time.
   - Protect scheduled execution with a dedicated generated secret; browser user tokens remain required for manual admin tests.

4. **Activate the ten-minute schedule**
   - Connect the stored `*/10 * * * *` schedule to the secured sync handler.
   - Ensure scheduled calls work without an interactive browser session while still rejecting unauthorized callers.
   - Keep the middleware/ngrok URL configurable so a future permanent middleware domain can replace the temporary ngrok URL.

5. **Make Test versus Sync explicit in the UI**
   - Keep **Test connection** non-persistent and show SAP status, trace ID, response count, and the stage where a failure occurred.
   - Add **Sync now** to call SAP and persist rows immediately.
   - Display last sync time plus received/inserted/updated/failed counts from the latest run.
   - Show recent middleware trace lines and sync-run history together for diagnosis.

6. **Verify end to end**
   - Confirm middleware health through ngrok from the actual portal origin.
   - Confirm a test produces `-> SAP` and a SAP HTTP response log without inserting rows.
   - Run **Sync now** twice: first run inserts rows; second run updates/matches the same business keys without duplicates.
   - Confirm the ten-minute scheduled run updates timestamps and creates a run-history entry.

## Required server configuration

```text
APP_BASE_URL=https://donation-pantyhose-starter.ngrok-free.dev
PORTAL_BACKEND_URL=<Lovable Cloud backend URL>
ALLOWED_ORIGINS=https://27aeaa58-eb6a-4965-897d-c1097d9ba383.lovableproject.com,https://fiori-bling-dashboard.lovable.app,https://mis.siplproducts.com,http://localhost:8080
```

Restart `node .\server.mjs` after changing `.env`. The ngrok tunnel and middleware process must remain running for scheduled synchronization; for production, replace the temporary ngrok URL with a stable HTTPS middleware URL.
