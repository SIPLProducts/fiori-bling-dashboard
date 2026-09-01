# Login failure, scheduled sync 404, and payload visibility

Three separate issues. All three causes are confirmed from the database.

## 1. "Email not confirmed" for abshankar@hbl.in

Confirmed: that account exists but its email was never confirmed (all other accounts are confirmed and can sign in). The account was created before admin-created users were auto-confirmed.

Fix:
- Confirm this account now (one-time), so the user can sign in with the existing password.
- Add a clearer sign-in message: instead of the raw "Email not confirmed", show "This account is not activated yet — ask your administrator to activate it."
- In User Management, add an "Activate account" action for Sharvi Admin so any future unconfirmed user can be fixed from the screen instead of needing support.

## 2. The 10-minute sync is not running

Confirmed: the schedule exists and is active (`*/10 * * * *`), it fired, and the call came back **404 Not Found**. The only successful runs in the log are the manual "Test" runs you did from the preview.

Cause: the schedule calls the published production site, and the published build does not yet contain the sync endpoint — it was added after the last successful deployment, so the published server returns 404. This is the same root cause as the earlier "Not Found" on mis.siplproducts.com.

Fix:
- Republish the app so the sync endpoint exists in production.
- Verify by checking the next scheduled call returns 200 and that a new run row appears roughly every 10 minutes.
- Add a small "Scheduler health" line on the Scheduler tab showing the last scheduled call's outcome (HTTP status / error), so a broken schedule is visible in the UI rather than only in the database.

Note that stays true: the middleware address is a free ngrok URL. Every time ngrok restarts, the URL changes and the scheduled job will fail until the new URL is saved in Middleware Configuration.

## 3. Which payload is sent, and showing it in the console

What is sent today, for both Test and the scheduled job:
- Body = the **Request payload** box on the Request tab (`BUKRS`, `BUDAT_F`, `BUDAT_T`, `PRCTR`, `WERKS`), with `BUDAT_F` / `BUDAT_T` kept in sync with the two date pickers as `YYYYMMDD`.
- Headers = the rows in the Headers table (currently one row, `BUDAT_F: 20250828`).
- Query parameters = the Query parameters rows (currently none).

Improvement:
- Echo the exact outbound request back to the browser (URL, method, headers, query, body) and `console.log` it on Test, plus show it read-only in the Connectivity panel, so you can always see exactly what went to SAP.
- Also record the outbound request on each scheduled run so it can be inspected afterwards.

## Technical notes

- Run `admin_confirm_user_email` for the unconfirmed user; expose the same RPC behind an admin-only button in `admin/users.tsx`.
- `src/lib/sap-pull.server.ts` already builds the request; return the built request object in the test result and store it on the `sap_sync_runs` row for scheduled runs.
- Scheduler health reads the latest `net._http_response` status for the cron job plus the newest `sap_sync_runs` row.
- No schema change beyond one nullable JSON column on `sap_sync_runs` for the outbound request.
