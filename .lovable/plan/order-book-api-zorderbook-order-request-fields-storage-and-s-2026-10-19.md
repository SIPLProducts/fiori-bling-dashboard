# Order Book API (zorderbook/order) — request fields, storage and schedule

## What you will get
1. **SAP API Settings → Add API → Request tab**: when the endpoint path contains `zorderbook` (or name contains "Order Book"), the empty `{}` box is replaced by a form:
   - **Created From / Created To** — date pickers (same style as other screens), plus the same window choice (Last 7 days / 1 month / 6 months / 1 year / Custom). Sent as `ERDAT_F` / `ERDAT_T` (YYYYMMDD). Required.
   - **Order Type From / To** — optional text inputs → `AUART_F` / `AUART_T`.
   - **Plant From / To** — optional text inputs → `WERKS_F` / `WERKS_T`.
   - Other SAP fields are sent automatically with defaults: `VKORG = "1000"`, `SPART_F/T`, `VTWEG_F/T`, `VBELN_F/T` empty.
   - The payload box still shows the exact JSON sent, so a different payload can be pasted if SAP changes it.
2. **New table `order_book`** storing every response line with **all ~100 response fields from the PDF as their own columns** (APPTYP through SUB_GRP — text fields as text, amounts/quantities as numbers, dates as dates), plus the complete raw SAP row so nothing is ever lost.
3. **Insert/update rule**: one row per **Sales Order + Item (VBELN + POSNR)** — re-syncing updates existing lines and adds new ones; no snapshot, nothing deleted on empty/failed responses.
4. **Schedule**: same scheduler as other APIs (multiple IST times, manual Fetch, last 6 run history). Scheduled runs recompute Created From/To from the chosen window using today's date.
5. **Access**: signed-in users read rows filtered by their assigned Plant OR Profit Centre (same rule as other screens); admins see all.
6. The Order Book report screen itself stays "Coming soon" — only API + storage in this step.

## Deployment files
- `supabase/migrations/<timestamp>_order_book.sql` (main backend, applied here).
- `deploy/order-book/install-order-book.sql` for Quality/Production (table, policies, endpoint seed row).
- Rebuilt `middleware/sync-core.mjs` so the on-prem scheduler stores Order Book rows; copy it and restart middleware on Quality/Production, then rebuild frontend.

## Technical details
- `src/lib/order-book-map.ts`: pure mapper (`isOrderBookEndpoint`, `mapOrderBookPayload`) with numeric normalization of space-padded strings (`" 2178000.00"`, `"  16"`), POSNR number→text, dates to ISO; invalid rows without VBELN/POSNR counted and skipped; duplicates within one response collapsed. Tests in `tests/order-book-map.test.ts`.
- `sap-pull-shared.ts`: `withEndpointDates` fills `ERDAT_F/ERDAT_T` for order book endpoints from the posting-range window.
- `sap-pull.server.ts`: `storeOrderBookPayload` upserts on `sales_order,sales_order_item` in batches of 500; dispatch added; exported from `sync-core.entry.ts`; scheduler.mjs wired the same way as ZCASH_FLOW.
- Migration: table with GRANTs, RLS SELECT policy using `user_can_see(plant, profit_center)`, unique index (sales_order, sales_order_item), indexes on created_date/plant, updated_at trigger.
- `sap-api.tsx`: `OrderBookRequestFields` component alongside the existing ZCASH form.
