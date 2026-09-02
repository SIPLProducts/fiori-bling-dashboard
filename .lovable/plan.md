# Fix: 632 rows fetched but nothing stored, and make the card show real success/failure

## What I verified just now

- Your Postman/middleware call is fine: SAP answered **HTTP 200, 1.28 MB, 632 rows**.
- The portal's **Test / fetch path truncates the SAP body at 200,000 characters** before it is saved (`src/lib/sap-api.functions.ts`, in `callMiddleware`). Your 1.28 MB response is cut mid-JSON, so parsing fails and **zero rows** are written. This is a second truncation, separate from the middleware one already removed.
- The card still said "Synced 02-09-2026, 11:52 am IST" because the code sets `last_synced_at` whenever the HTTP call succeeded — even when the save failed. So the timestamp lies.
- `zfisales_detail` still holds **65 rows, last written 01-09-2026 19:30 IST**.
- Every scheduled run today (05:20–06:20 UTC) failed with **middleware/tunnel 404** — the tunnel was not answering until you started `node server.mjs` at 11:52. The saved middleware URL is now `https://donation-pantyhose-starter.ngrok-free.dev`, which matches the tunnel you are running.
- The background job now runs on your saved `*/5 * * * *` and posts to the correct sync URL.

## Fixes

1. **Remove the 200,000-character cut on the fetched body** so the full multi-MB SAP response is what gets parsed and upserted. The truncated copy is kept only for the on-screen preview, never for the data path.
2. **Don't route megabytes through the browser.** Test/fetch will store the response server-side in one hop (middleware -> portal server -> database) instead of sending the body down to the browser and back up. This removes the size/timeout failure for 80,000-row pulls.
3. **Truthful status on the endpoint card.** Replace the always-optimistic "Synced <time>" with the real outcome of the last run: green **Success — <time> IST, N records (x new, y updated)** or red **Failed — <time> IST, <reason>**, read from the run history that the scheduler already writes. Manual tests write a run row too, so a manual fetch shows there as well.
4. **Only stamp `last_synced_at` when rows were actually written.** A failed save no longer moves the synced time forward.
5. Verify by running one fetch and confirming ~632 rows land in `zfisales_detail`, then confirm the next 5-minute scheduled tick records a success row.

## One thing on your side

The middleware you have running is an older copy — its log says `timeout=30000ms`, while the updated `middleware/server.mjs` in the project uses 600000 ms and no response truncation. Pull the latest `middleware/server.mjs` and restart `node server.mjs`, otherwise large pulls can still time out at 30 s.

Also worth checking: your middleware `.env` has SAP dev `client=243`, while the endpoint path forces `sap-client=234`. The path wins today, so the data comes from 234 — tell me if 243 is the intended client.

## Technical notes

- `src/lib/sap-api.functions.ts`: drop `.slice(0, 200000)` from the body in `callMiddleware`; move the store step into a server function that calls the middleware and upserts without returning the payload to the client; gate the `last_synced_at` update on a successful store.
- `src/lib/sap-pull.server.ts`: reuse `pullSapEndpoint` for the manual Test/fetch so both paths share the same batched upsert and run logging.
- `src/routes/_authenticated/admin/sap-api.tsx`: card badge driven by the latest `sap_sync_runs` row (status, IST time, record counts, error message).
