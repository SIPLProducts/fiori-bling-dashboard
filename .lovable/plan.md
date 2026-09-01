# Fix scheduled SAP data synchronization

## Confirmed issue

- The 10-minute scheduler is running correctly.
- The latest run started at **6:00 PM IST**, reached the middleware, and SAP returned HTTP 200 with about **231 KB**.
- The middleware currently truncates every SAP response to **200,000 characters** before sending it to the portal.
- Because the 231 KB JSON response is cut mid-document, the portal cannot parse it and reports: **“SAP returned 231 KB that could not be parsed as JSON.”**
- No rows are inserted or updated when parsing fails, so `zfisales_detail` remains unchanged.

## Fix

1. Remove the 200,000-character truncation from the middleware’s `/sap/call` response so the complete SAP JSON reaches the portal.
2. Keep response previews bounded only in the admin UI/log display; never truncate the data used for synchronization.
3. Improve parse errors to record the SAP content type and a safe short response preview, making HTML/error responses distinguishable from truncated JSON.
4. Validate with the current `Sales_Reports_KPI` payload and confirm received/new/updated counts are recorded.
5. Confirm subsequent scheduled attempts continue every 10 minutes and only the latest 6 history rows remain.

## Important configuration note

The saved request currently asks SAP for **2025-01-01 through 2026-09-01**, not a rolling seven-day window. The fix will preserve that configured payload; it may return a large dataset, but it will no longer be truncated.
