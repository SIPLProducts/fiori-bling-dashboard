# Plant visualization and detailed-table totals

## Plant-wise Pending
- Match the attached screenshot with **grouped vertical bars**: three adjacent bars per plant for Pending Value (blue), Pending Quantity (teal), and Open Order Lines (orange), with a legend at the top-right and plant code/name below each group.
- Use the reference’s normalized comparison: each measure’s largest matching plant is 100%, with other plants shown proportionally to that measure’s maximum. Label the vertical axis clearly as **Relative to Largest Plant (%)** so currency, quantity, and counts are not misleadingly mixed on one raw scale.
- Show actual values on the bars and all three actual measures in tooltips, using ₹ Cr for value and unscaled numbers for quantity and lines. Keep small-value labels readable without artificially enlarging bars.
- Keep every matching plant, ranked by pending value, with local horizontal scrolling when needed and no page overflow.
- Replace the table’s Total footer with the reference’s three compact bottom summaries: Total Pending Value, Total Pending Quantity, and Total Open Order Lines.
- Retain the title **Plant-wise Pending**, shared Smart Filters, existing compact Fiori styling, and colored heading divider. Keep this section screen-only, without changing PDF or Excel; use the attachment as a visual reference, not an embedded image.

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