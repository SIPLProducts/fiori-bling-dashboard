# Plant visualization and detailed-table totals

## Plant-wise Pending
- Replace the current numeric-only table with compact horizontal pending-value bars beside each plant’s code and name, retaining separate numeric columns for Pending Value (₹ Cr), Pending Quantity, and Open Order Lines.
- Rank plants by pending value and keep every matching plant available through local scrolling. Use a truthful linear scale; keep numeric values readable even when smaller bars are tiny.
- Retain the Total footer and shared Smart Filters. Keep this section screen-only, without changing PDF or Excel.
- Preserve the existing Fiori colors, compact spacing, and colored heading divider; do not use the discarded design previews.

## Detailed View totals
- Add a clearly distinguished **Total** row at the bottom of the detailed table, immediately before pagination.
- Sum **Open Qty**, **Delivered Qty**, **AH**, **Total AH**, and **Open Value (₹ Cr)** under their respective columns.
- Calculate totals across **all matching rows**, not only the current page, after Smart Filters, Status, and table search have been applied.
- Preserve AH and Total AH decimal values without currency or Crore/Lakh scaling. Format Open Value consistently with its existing ₹ Cr column.
- Show zero totals for empty results; leave unrelated columns blank and preserve existing pagination and document-type row colors.

## Technical details
- Reuse the existing plant aggregation and loaded report rows. Add a pure totals helper for the detailed table and a semantic table footer.
- Changes are presentation and frontend calculations only: no database migration, SAP mapping, middleware, PDF, or Excel changes.

## Verification
- Check plant bars and numeric totals against the same filtered rows, including single-plant and empty selections and Reset.
- Test all five detailed-table totals with decimals, Status, search, and results spanning multiple pages; changing pages must not change totals.
- Verify column alignment, horizontal scrolling, readable plant labels, and no page overflow at wide and narrow widths.
- Run focused tests and check preview errors.