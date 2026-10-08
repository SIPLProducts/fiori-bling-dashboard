# Complete AH and Total AH in Open Sales Orders

The table headings, report data loader, and Excel export currently omit both fields. The earlier changes were not completed.

## Requested result
- Add **AH** and **Total AH** beside the quantity columns in the detailed table.
- Include both columns in Download Excel for every matching row, not just the current page.
- Show ordinary numeric values without currency or Crore/Lakh scaling. Keep decimal precision where present.
- Include both fields in the existing table search; preserve all filters, pagination, and other report values.
- No new summary tiles or PDF changes.

## Technical details
1. Verify the current database columns and stored SAP `AH` and `TOT_AH` values before changing storage.
2. Where required, create an idempotent timestamped migration under `supabase/migrations/` adding numeric `ah` and `total_ah` and safely backfilling existing rows from their raw SAP values. Apply it through the migration system so the same file can be deployed to Quality and Production.
3. Map SAP `AH` → `ah` and `TOT_AH` → `total_ah` for future syncs. Add the fields to the report query, row types, and conversion.
4. Update table cells, empty-state column span, shared search, and Excel headers, row values, and number formats.
5. Include the mapper change in the middleware sync bundle and provide the deployment order: database migration first, then frontend and rebuilt middleware.

## Verification
- Test normal, decimal, comma-formatted, trailing-minus, and missing SAP values.
- Check that stored values match the table and downloaded Excel, including a nonzero sample if available.
- Verify table search, filtered exports across pages, and clean compilation.