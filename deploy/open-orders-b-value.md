# Open Sales Orders: B_VALUE monetary source

Open Value now reads SAP `B_VALUE` in rupees. Screen, launchpad, charts, table, Excel and PDF divide by 10,000,000 only when displaying Crores. `KWERT_INR` remains saved separately; there is no fallback to it or NETWR. LD_STATUS is unchanged.

## Quality / Production installation

1. Apply `supabase/migrations/20261012071000_open_orders_b_value_source.sql` to each self-hosted database. It adds `b_value`, backfills it from saved raw SAP rows and updates the `open_value` compatibility mirror. No records are deleted.
2. Deploy the updated application and shared mapper. Deploy the rebuilt `middleware/sync-core.mjs`, or run `bun run build:sync-core` inside `middleware`, then restart the existing middleware process.
3. Reload the report and launchpad to load the new monetary source. A new sync is not needed for rows already containing B_VALUE; missing values require a response that contains it.
4. Verify totals using:

```sql
SELECT count(*) AS active_rows, sum(b_value) AS total_rupees,
       sum(b_value) / 10000000 AS total_crores,
       count(*) FILTER (WHERE b_value <> open_value) AS mirror_mismatches
FROM public.open_sales_orders WHERE is_active_snapshot = true;
```

The connected Lovable Cloud migration is applied separately from these self-hosted installations.