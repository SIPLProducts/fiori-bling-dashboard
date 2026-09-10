# Fix: why the server portal returns no data, and no run history

Postman works, the portal does not. The screenshots show three separate causes, all on the portal side.

## 1. The portal sends a different date window than Postman

Postman sends `BUDAT_F 20260601` / `BUDAT_T 20260731` and gets 786 KB back. The portal falls back to "last 7 days" whenever it does not consider the saved dates valid, and SAP correctly answers "Data Not Available for this selection" for that empty window.

Fix: send the saved request body exactly as entered. The last-7-days default only fills in a date field that is genuinely blank — it never replaces a date you saved. The Request tab also shows the exact window that will be sent.

## 2. The run history cannot be written (403)

Console: `POST .../sap_sync_runs 403 (Forbidden)`. The `sap_sync_runs` table is read-only for signed-in users; only the server may write it. On the hosted site the server writes it, but on the on-site build the sync runs in the browser, so every attempt is rejected — which is why Scheduler health stays empty and the card says "No sync run recorded yet".

Fix: add two database functions callable only by a Sharvi Admin — one to open a run row and one to close it with the final counts and status. The browser sync calls those instead of writing the table directly. The table stays read-only for direct access, and the hosted server path is unchanged.

## 3. The duplicate check makes an over-long URL (414)

Console: `GET .../zfisales_detail?select=record_key&record_key=in.(...)` → `414 Request-URI Too Large`. The sync checks 500 existing keys per request, and 500 long keys exceed the URL limit, so the whole sync fails after SAP has already answered.

Fix: check existing keys in much smaller chunks (about 50 keys) and send that check as a POST-style filtered read so the URL stays short. The row write itself keeps its 500-row batches.

## 4. Clear result messages

After pressing Test:
- SAP answered but sent no records → warning toast: "No data available for this selection (01-06-2026 to 31-07-2026)".
- SAP sent records → success toast: "Data synced successfully — 12,480 records (11,900 new, 580 updated)".
- Anything failing before SAP → the existing error toast naming the hop.

The same text is stored on the run row, so Scheduler health shows it too.

## Technical notes
- `withPostingDates` in `src/lib/sap-pull-shared.ts` stops overwriting valid saved dates; only missing/blank values get the default.
- Migration adds `security definer` functions `start_sync_run` / `finish_sync_run`, guarded by `public.is_super_admin(auth.uid())`, granted to `authenticated`; `sap_sync_runs` policies remain read-only.
- `runEndpointSyncBrowser` in `src/lib/sap-api.functions.ts` switches to those RPCs, reduces the existing-key lookup chunk size, and returns a typed "no rows" outcome so the toast can differ from an error.
- No Nginx or middleware change. Rebuild with `npm run build:static` and copy `dist/` to the server.

## Validation
1. Typecheck passes.
2. On the server with the Postman window saved: Test shows "Data synced successfully" with a record count, a run row appears in Scheduler health, and the sales table row count increases.
3. With a window that has no postings: the warning toast appears and the run is recorded as a successful call with 0 records.
