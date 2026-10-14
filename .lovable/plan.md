# Cash Flow: table totals, click-only Refresh, and Sync button

## What changes
1. **Totals row in the ledger table**: a fixed bottom row reads "Total" and shows the sums of Credit (₹), Debit (₹) and Net Balance. These cover all rows that match the filters and search, not only the 4 rows on the current page.
2. **Refresh only on click**: the data no longer reloads when you switch browser tabs, move to another screen and come back, or reconnect. It reloads only when you click the Refresh icon.
3. **Sync button** next to Refresh: it calls the SAP ZCASH_FLOW API, the same way "Sync" works in SAP API Settings. While it runs, the button spins and shows "Syncing…". When it finishes:
   - A success message shows how many rows were received and stored. On failure, it shows the error.
   - The screen reloads the data, and "Last synced" updates.
   - If SAP returns no data or an error, the existing data stays unchanged.
4. Header order: `Last synced: dd.MM.yyyy, hh:mm pm IST` | Refresh icon | Sync button.

## Who can sync
Only Sharvi Admin users can run SAP syncs today, so the Sync button appears only for them. Other users see only Refresh.

## Technical notes
- `cash-flow-data.ts`: add `gcTime: Infinity`, `refetchOnMount: false` and `refetchOnReconnect: false` to the existing `refetchOnWindowFocus: false`.
- `cash-flow-dashboard.tsx`:
  - Add a `<tfoot>` that uses the `ledger` sums.
  - Add the Sync button, which calls the existing `runEndpointSync("ZCASH_FLOW")` from `sap-api.functions.ts`. That path already uses the server or middleware route with the Sharvi Admin check.
  - On success, `query.refetch()` runs, and a `sonner` toast shows the result.
  - Admin visibility comes from `useLaunchpad().isSuperAdmin`, which is passed in from the route.
- Add a pure `cashLedgerTotals` helper in `cash-flow.ts`, with a test.
