# Gradient Reset buttons + Sync button on every report screen

## What you will see
1. **Reset buttons** on every screen use the gradient look: Sales Register, Net Sales (SD Live), Sales KPI, TBN, Open Sales Orders, Cash Flow.
2. **Sync button** (gradient, with a sync icon) next to Refresh / PDF on each report screen: Net Sales, Sales In Transit, Sales Register, Order Book, Open Sales Orders, Cash Flow.
   - Clicking it runs that screen's API from SAP API Settings, the same way the Sync button there does (same dates and settings).
   - While it runs, the button shows a spinner. After it finishes you see a message with the number of rows received, and the screen reloads its data.
   - Only **Admins** and **Sharvi Admins** can see the button. Other users don't see it.
3. TBN has no Sync button because its scheduled sync is still turned off.

## Technical details
- Change Reset buttons to `variant="action"` (the `ghost`/`outline`/`default` ones in tbn-dashboard, sales-register-filters, sd-live-dashboard, open-sales-orders-dashboard, cash-flow-dashboard, kpi.tsx).
- New shared `SyncNowButton` component: takes the endpoint name(s) and query keys to invalidate, calls `runNamedEndpointSync`, shows a sonner toast, uses `btn-action` styling. Cash Flow's existing sync button is replaced by this one.
- Each screen finds its endpoint by its normalized name (Sales_Reports_KPI, Z_SIT, Sales _Register, ZORDERBOOK, open orders, ZCASH_FLOW). If no endpoint is set up, the button is disabled and says "Not configured".
- Server check in `runEndpointSyncServer` / browser path: allow `admin` or `super_admin` (it currently allows only Sharvi Admin). SAP API Settings stays Sharvi-Admin only.
- Show/hide on the client uses the existing role info from the user's session.
- Add a test for the helper that decides who can sync: admin yes, super_admin yes, viewer/approver/buyer no.
