# Add Total AH and AH to Open Sales Orders

## Confirmed storage
- The current database stores SAP **AH** and **TOT_AH** in the original `raw` row for all 1,240 stored orders.
- There are no separate `ah` or `total_ah` columns in `open_sales_orders`, and the current mapper does not populate separate reporting fields for them.

## Changes
- Add numeric **Total AH** and **AH** reporting fields, mapped directly from SAP `TOT_AH` and `AH`, respectively.
- Backfill existing orders from their stored original SAP rows, so another sync is not required to display existing values.
- Add **Total AH** and **AH** beside the quantity columns in the detailed table, preserving pagination, scrolling, and current filters.
- Include both fields in detailed-table search.
- Add **Total AH** and **AH** to Excel for every matching row, with numeric formatting and no Crore or Lakh scaling.
- Keep dashboard summary tiles, PDF contents, and existing calculations unchanged.

## Deployment details
- Deliver an idempotent, timestamped migration under `supabase/migrations/` that adds both numeric columns and safely backfills values from `raw`.
- Update the shared SAP mapper and report loader to preserve both fields in future snapshots.
- Update the generated middleware sync bundle through the existing bundling procedure, and identify the matching middleware files needed for Quality/Production deployment.
- Apply the database migration before deploying code that reads or writes these columns. No additional access permissions are introduced.

## Verification
- Test mapping of AH and TOT_AH, including zero, decimal, missing, and numeric-string values.
- Verify backfilled values match the original stored SAP values.
- Confirm both table columns display correctly and participate in search.
- Download Excel and confirm both columns contain numeric values for all matching rows, independent of pagination.
- Check preview errors and preserve atomic snapshot replacement, manual Refresh, and existing filter behavior.