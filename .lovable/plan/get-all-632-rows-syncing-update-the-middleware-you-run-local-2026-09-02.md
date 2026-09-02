# Get all 632 rows syncing — update the middleware you run locally

## What the database shows right now

- `zfisales_detail` holds **159 rows**, last written 02-09-2026 12:06 pm IST.
- The last successful run stored only **98 records**.
- Every run since (12:05, 12:10, 12:15, 12:20 pm IST) failed with the same message:
  **"SAP returned 232 KB that could not be parsed as JSON"**, and the preview shows the body starts with valid data — so it is a cut-off body, not an error page.

232 KB is exactly the old 200,000-character cut. SAP sent 1.28 MB (632 rows); the copy of the middleware running on your machine truncates it before the portal ever sees it. The portal side no longer truncates anything.

## Why the file copy is still pending

I cannot write to `D:\Calibration_Angular\fiori-bling-dashboard\middleware\` — that folder is on your PC, not in this project's runtime. The corrected `middleware/server.mjs` already exists in the project; it has to be pulled down and restarted by you.

## Steps for you (2 minutes)

1. Pull the latest project code so `middleware/server.mjs` on disk matches the project version (v1.2.0 with no response truncation).
2. Edit `middleware/.env` and change the timeout line — your current value forces 30 seconds, which is too short for multi-MB pulls:

   ```text
   SAP_TIMEOUT_MS=600000
   ```

3. Restart: `Ctrl+C`, then `node server.mjs`.
4. Confirm the startup/first-call log line reads `timeout=600000ms` (today it reads `timeout=30000ms` — that is the tell that the old copy is still running).

## Then I verify

- Trigger one sync from the SAP API Settings screen and read the run row: expect `records_received ≈ 632`, status success.
- Query `zfisales_detail` to confirm the row count jumps from 159 to ~632.
- Check the next scheduled 5-minute tick also lands as success.
- If it still fails, I read the exact byte count and preview from the run history and report which hop cut it.

## Portal-side change in this plan

One safeguard: when a response fails to parse, the run record will also store the **reported byte count from the middleware vs the bytes actually received**, so a truncating middleware is named explicitly ("middleware returned 232 KB of a 1.28 MB SAP response") instead of a generic parse error. No other application behaviour changes.

## Technical notes

- `middleware/server.mjs` in the project already returns `result.body` untruncated and defaults `REQUEST_TIMEOUT_MS` to 600000; `.env` overrides that default, which is why your local copy must change too.
- `src/lib/sap-pull.server.ts`: include the middleware-reported `bytes` field alongside the received length in the parse-failure message written to `sap_sync_runs`.
