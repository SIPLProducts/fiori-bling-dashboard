# Remove Sales Organization from Open Sales Orders Excel

- Remove **Sales Organization** from the downloaded Excel sheet.
- Keep every other column, its order, formatting, and all matching exported rows unchanged.
- Leave dashboard filters, calculations, PDF, stored data, and SAP synchronization unchanged.

## Technical details
- The report currently substitutes **Unassigned** when `sales_org` is blank. This explains the displayed fallback, but does not establish why SAP or the stored field is blank.
- Remove the `salesOrg` column definition and its exported row value from `src/lib/open-sales-orders-export.ts` only.

## Verification
- Download an Excel sheet and confirm Sales Organization is absent, remaining headers align with their values, and the exported row count is unchanged.