# Compact Open Sales Orders layout

## Goal
Use the attached screenshot only as a visual reference for a denser dashboard. Keep every existing section, filter, calculation, ranking entry, table column, and ten table rows per page. Prioritize readability, as selected, rather than forcing unreadably small text into one screen.

The current dashboard measures about 2,598 px high at 1,280 px wide. The current preview is 901 × 529 px, so a complete single-screen fit is not promised; reduce scrolling as far as practical without hiding content.

## Requested changes
1. **Plant-wise Pending:** remove the orange Open Order Lines line, its point labels, right-hand count axis, and line legend. Keep order-line counts in tooltips and the bottom total, together with pending value and quantity. Give each plant a distinct bright-to-deep gradient bar, with readable value labels and actual ₹ Cr scales.
2. **Sales Zone:** keep vertical count bars and all existing zone data. Apply distinct bright-to-deep gradient colors and reduce maximum bar width from 32 px to approximately 16–20 px. Keep counts, zone names, and tooltip details.
3. **One chart row:** place Sales Zone and Plant-wise Pending side by side in equal-width columns when each chart has enough room for readable labels. Stack them on narrower screens. Adapt chart rows to the available width instead of squeezing or hiding categories; preserve shared scales across wrapped rows.
4. **Overall density:** reduce screen-only gaps, panel padding, heading sizes, chart margins, filter spacing, summary/status heights, and table cell padding. Target about 200 px for the two chart plots where labels fit, and smaller ranking heights while retaining all Top 10 entries. Keep controls comfortably usable and headings readable.
5. **Preserve everything else:** do not add screenshot-only content, restore removed tiles, alter data loading, change filter behavior, change calculations, reduce pagination size, or collapse sections by default. Keep PDF layout and Excel output unchanged.

## Technical approach
- Scope compact styling to the existing `orders-compact` screen wrapper.
- Update the Plant chart and Sales Zone presentation, using stable unique gradient IDs and existing semantic color tokens.
- Remove the Sales Zone screen-only fixed minimum-width requirement; use width-aware rows for dense category sets with consistent domains and complete tooltips.
- Keep Sales Zone in its existing separate PDF capture block and Plant-wise Pending excluded from PDF.
- During implementation, update the affected preference notes and architecture guidance to reflect the removed plant count line and paired screen layout.

## Checks before completion
- Compare before/after dashboard height at the current preview size and a wider desktop size; report the actual reduction rather than claim a single-screen fit.
- Check narrow layouts for text overlap, clipped controls, and unnecessary page-wide horizontal scrolling. Preserve the detailed table's local horizontal scrolling for all 19 columns.
- Verify every plant and zone remains visible, gradients render, tooltips and totals match, all ten ranking entries remain, and table pagination still shows ten rows.
- Verify filters, Refresh, table search/status, totals, PDF, and Excel retain their existing behavior; run relevant existing tests and inspect preview errors.
- Capture an image of the updated dashboard for visual comparison.