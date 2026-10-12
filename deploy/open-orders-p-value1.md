# Open Sales Orders: P_VALUE1 monetary source

Open Value now reads SAP `P_VALUE1` in rupees. The report, launchpad, charts, detailed table, Excel and PDF divide by 10,000,000 only for Crore display. There is no quantity multiplication or fallback to B_VALUE, KWERT_INR or NETWR. B_VALUE and KWERT_INR remain saved independently; LD_STATUS is unchanged.

## Quality / Production installation

1. Apply `supabase/migrations/20261012074000_open_orders_p_value1_source.sql` to each self-hosted database. It adds `p_value1`, backfills saved raw SAP values and updates the `open_value` compatibility mirror. No records are deleted.
2. Deploy the updated application and shared mapper. Deploy the rebuilt `middleware/sync-core.mjs`, or run `bun run build:sync-core` inside `middleware`, then restart the existing middleware process.
3. Reload the report and launchpad. A fresh sync is unnecessary for rows already containing valid P_VALUE1; missing fields require a future SAP response that includes them. Missing/invalid P_VALUE1 is zero, never another amount.
4. Verify:

```sql
SELECT count(*) AS active_rows,
       count(*) FILTER (WHERE raw ? 'P_VALUE1' OR raw ? 'p_value1') AS rows_with_source,
       sum(p_value1) AS total_rupees,
       sum(p_value1) / 10000000 AS total_crores,
       count(*) FILTER (WHERE p_value1 <> open_value) AS mirror_mismatches
FROM public.open_sales_orders WHERE is_active_snapshot = true;
```

The launchpad includes every active row. Report totals follow its selected filters; clear restrictions before comparing all-active totals.

The connected Lovable Cloud migration is applied separately. Quality/Production installation must be performed by their operator.