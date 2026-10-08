# Deploy AH and Total AH

The Cloud database migration has been applied. Self-hosted Quality and Production require the same schema change before deploying the updated application.

1. Apply `supabase/migrations/20261008063000_add_open_sales_orders_ah.sql` using your normal migration deployment. This adds numeric columns and backfills the existing SAP `AH` and `TOT_AH` values without removing any orders.
2. Deploy the updated frontend, including the report data loader, detailed table/search, and Excel exporter.
3. Deploy the rebuilt `middleware/sync-core.mjs` (included), or rebuild from the updated mapper using `bun run --cwd middleware build:sync-core` from the project root.
4. Restart the applicable middleware process, for example `pm2 restart mis-q-middleware --update-env` for Quality. Use the configured Production process name on Production.
5. Refresh the report and check AH and Total AH in the detailed table and Download Excel.

SAP mapping: `AH` → `open_sales_orders.ah`; `TOT_AH` → `open_sales_orders.total_ah`. Both remain unscaled numeric values. Deploying only the frontend before applying the migration will cause report reads to fail.