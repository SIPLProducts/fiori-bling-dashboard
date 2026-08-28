# Fix middleware access, then sync SAP sales data every 10 minutes

## Why the test fails (your log answers it)

```text
[mis-sap-middleware] blocked origin: https://27aeaa58-...lovableproject.com
POST /sap/call  403 Forbidden
```

The middleware is up and reachable through ngrok. It refuses the browser because of the config:

1. `ALLOWED_ORIGINS=https://jnugfajppmbrlqrfeeav.supabase.co` is the backend address, not a browser origin. It must list the addresses the portal is **opened from**:
   - `https://27aeaa58-eb6a-4965-897d-c1097d9ba383.lovableproject.com` (the one being blocked now)
   - `https://id-preview--27aeaa58-eb6a-4965-897d-c1097d9ba383.lovable.app`
   - `https://fiori-bling-dashboard.lovable.app`
   - `https://mis.siplproducts.com`
2. `APP_BASE_URL` should be the middleware's own public address: `https://donation-pantyhose-starter.ngrok-free.dev`.

Fixing those clears the 403. The next wall is `SUPABASE_JWT_SECRET=123456` — portal sign-in tokens are not signed with that value, so calls would then fail token verification instead. The raw signing secret is not handed out on this platform, so the middleware must stop relying on it.

## Your newest log — the 403 is gone, a 500 replaced it

```text
15:38  POST /sap/call  403 Forbidden      (origin still blocked)
15:42  POST /sap/call  500 Internal Server Error
```

The origin fix worked: the request now gets past CORS and into the handler, and fails inside it. Two things in the handler can throw a 500 with your current setup, and both are addressed by the changes below:

- token verification against the placeholder secret,
- the saved endpoint path `/fisales_detail/report?sap-client=234`, which the service appends `sap-client` to again — the APIs card shows the doubled result `...report?sap-client=234?sap-client=234`, which is not a valid URL. The path field will be normalised (query string parsed properly, `sap-client` never added twice), and the middleware will return the real reason with the SAP status instead of a bare 500.

**And to answer your question directly: no, nothing is being stored yet.** There is no `sales_reports_kpi` table and no sync job in the project — Test connection only calls SAP and shows the response in the Response tab. Storage is Changes 3 and 4 below.


## Change 1 — verify portal tokens the supported way

`middleware/server.mjs` verifies the caller's token against the backend's published public signing keys (JWKS), cached in memory. No secret to copy. `SUPABASE_JWT_SECRET` is removed from `.env.example` and the README; the project URL replaces it. The allow-list also accepts wildcard entries such as `https://*.lovableproject.com`, so a changing preview URL no longer means editing `.env`.

## Change 2 — a machine caller for the scheduler

Scheduled runs have no signed-in user, so the middleware additionally accepts a request carrying `X-Service-Token` matching `SERVICE_TOKEN` in its `.env` (a long random value you generate once). Everything else is rejected.

## Change 3 — the table, and the unique key

From your sample, a single record is one **line of one FI document**. Look at the four rows you sent:

```text
BELNR 0920007748 · POSNR 10 · HKONT 31112000   (revenue)
BELNR 0920007748 · POSNR 10 · HKONT 36114000   (freight — same doc, same item)
BELNR 0920007817 · POSNR 10
BELNR 0920007817 · POSNR 11
```

So document number alone, or document + item alone, would collide. The unique key is:

```text
GJAHR + BELNR + POSNR + HKONT   (+ WERKS as a safety component)
```

Stored as one `record_key` column with a unique constraint. Re-runs update the matching row; anything new is inserted; nothing is deleted.

New table `sales_reports_kpi` with typed columns for the fields worth filtering, grouping and charting on — plant, division, profit centre, sale type, GL account, document number/year/item, document and posting date, month, reference, document/posting key, customer and name, sales rep, material and description, quantity and unit, amount `DMBTR`, country fields, model/range/type, AH and total AH, plates/width/container, customer group and description, usage and description, sales org description, incoterm, segment, sales order and item — plus:

- `record_key` (unique), `source_endpoint_id`
- `raw` — the complete original JSON row, so the ~120 `Q*` / `DMBTR_*` columns are never lost even though they are not promoted to columns
- `synced_at` — the stored date/time, refreshed on every insert or update
- `created_at` / `updated_at`

A second table `sap_sync_runs` records every run: endpoint, start/finish time, status, records received, inserted, updated, and error text.

## Change 4 — the 10-minute job

- A public endpoint `/api/public/sap-sync` in the portal: authenticates the scheduler, reads the endpoint config from the database, calls the middleware with the saved method, path, headers and body (including the `BUDAT_F` / `BUDAT_T` window), then upserts every returned row in bounded batches.
- Runs every 10 minutes, takes a lease so two runs never overlap, records progress per run, and pauses itself after repeated failures instead of hammering SAP.
- The Scheduler tab shows real values instead of "never": last run time, status, and counts — received / new / updated — plus a **Run now** button.
- Your current expression `10 * * * *` means "once an hour at minute 10". `*/10 * * * *` is every ten minutes; the field will show a plain-language preview of whatever you type so this cannot be silent again.

## Change 5 — the KPI screen reads the synced data

Sales Reports KPI switches from the bundled sample dataset to `sales_reports_kpi`, with a "last synced" line in the header and a clear empty state when no sync has run yet.

## Order of work

1. Middleware auth + origins (unblocks Test connection).
2. Table + sync endpoint + schedule.
3. Scheduler tab counts and Run now.
4. KPI screen switched to live data.

## Security note

The SAP password was pasted in chat again. Rotate that user's password and keep the replacement only in the middleware server's uncommitted `.env`.
