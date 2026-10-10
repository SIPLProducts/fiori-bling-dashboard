# Open Orders KWERT_INR / LD_STATUS deployment

1. Back up `public.open_sales_orders` and temporarily disable its SAP schedule to avoid old-mapper writes during upgrade.
2. Apply `supabase/migrations/20261010162000_open_orders_kwert_inr_ld_status.sql` using your normal SQL deployment process. Existing AH migrations must already be applied.
3. Deploy the updated frontend and `middleware/sync-core.mjs` together. Restart the existing SAP middleware service with your normal PM2 command.
4. In SAP API Settings, paste `sap-sample-response.json` into the existing Open Sales Orders sample response. Do not change its endpoint URL, credentials, request dates or schedule. The sample is not live data.
5. Remove any retired VKORG Sales Organization mapping for Open Orders only; the physical column stays deprecated for older installations.
6. After the backup and upgrade are confirmed, run the separate `cleanup-old-open-orders.sql`. It deletes only Open Orders rows; reports remain empty until the next successful sync.
7. Run a fresh manual SAP sync and verify `kwert_inr` equals raw `KWERT_INR`, `ld_status` preserves N/Y, and table, tile and Excel totals reconcile. Re-enable the saved schedule after verification.

KWERT_INR is stored in rupees and divided by 10,000,000 only for Crore display. NETWR and P_VALUE1 are not fallback amounts. `open_value` is maintained as a compatibility mirror by new syncs. The three sample values total 11,175,330 rupees (1.117533 Crore). LD_STATUS is text and does not replace delivery-status logic. All 124 SAP keys stay in the raw row; only the two requested keys gain typed columns.

The Cloud database migration and sample update are already applied. Quality/Production self-hosted installations still need these deployment steps; no SAP request is performed by the migration or cleanup.
