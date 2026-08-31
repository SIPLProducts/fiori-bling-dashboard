# Store SAP responses in a Sales_Reports_KPI table

Goal: when the SAP API returns data (Test / Fetch on the SAP API screen), the rows are saved into a dedicated cloud table named `Sales_Reports_KPI`, and you can browse that table from inside Lovable.

## 1. New table

Create `public.sales_reports_kpi` (the backend stores names in lower case; it is the same table you asked for as `Sales_Reports_KPI`).

Columns:
- `record_key` — unique business key (plant + fiscal year + document no + item + GL account) so a re-sync updates instead of duplicating
- Report fields: plant, profit centre + name, GL + name, group, sales type, company code + name, customer + name, fiscal year, document no, document date, posting date, month, reference, document type, posting key, amount, segment, sales order + item, material + description
- `raw` — full original SAP row as JSON, so nothing is lost even if a field isn't mapped yet
- `source_endpoint`, `synced_at`, `created_at`, `updated_at`

Access rules:
- Signed-in portal users can read it
- Only the server-side sync writes to it — no browser inserts/updates
- No anonymous access

## 2. Saving the received data

- After a successful SAP call from the SAP API screen, the response rows are mapped and upserted into `sales_reports_kpi` (batched, keyed on `record_key`).
- A run entry is recorded in the existing sync-runs log (endpoint name, received / inserted / updated counts, status, error text) so freshness is visible.
- The existing public sync endpoint keeps working the same way for scheduled 5-minute pushes; it will write to this table too, under the endpoint name `SALES_REPORTS_KPI`.
- On the SAP API endpoint screen, the Test/Fetch result shows: HTTP status, duration, rows received, rows inserted, rows updated.

## 3. Where you check the tables in Lovable

There is no separate database console to log into — the cloud backend is viewed from the editor:
- Use the **View Backend** button in chat (or the Backend/Cloud tab in the editor) to open the database view, pick the `Tables` section and select `sales_reports_kpi` to see rows.
- Inside the app itself, **Table Master → ZFISALES_DETAIL / Sales Reports KPI** tile shows the mapping config (API name, table name, sync schedule, last sync time and record count).

## Technical notes

- Reuse the existing mapper in `src/lib/zfisales-sync.server.ts` (payload unwrapping, date/number normalisation, record key) with a table-name parameter, so ZFISALES and Sales_Reports_KPI share one mapping path.
- Writes go through the server-side admin client only (`createServerFn` / the public sync route); the browser never writes.
- Unique index on `record_key`; indexes on `posting_date`, `fiscal_year`, `company_code`, `profit_ctr`; amount as `numeric(18,2)`; `updated_at` trigger.
- Note: `zfisales_detail` already exists with this exact shape. If you'd rather keep one table instead of two, say so and the SAP responses will be written there instead of creating `sales_reports_kpi`.
