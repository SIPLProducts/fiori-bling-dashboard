# LD Status chart and all-date launchpad totals

## 1. Four report cards in one row
- Arrange these cards in order on desktop, including your approximately 951px screen:
  1. Open Orders by Sales Document Type
  2. Open Orders by Aging Bucket
  3. Open Order Value Trend
  4. **LD Status**
- Keep every existing card. Maintain readable chart heights and labels, using local overflow for the donut breakdowns where necessary; use fewer columns on tablets and stack on phones.
- In **LD Status**, show two vertical bars with **Y** and **N** below them and an **Open Value (₹ Cr)** scale on the left.
- Sum KWERT_INR for rows with LD_STATUS = Y separately from rows with LD_STATUS = N. Use radiant **green for Y** and **red for N**.
- Display each bar’s value and show its order-line count and open value in the tooltip. Keep zero-value categories visible.
- Apply the same Smart Filters as the other report charts. These bars summarize matching rows; they do not change the report’s delivery-status controls or introduce click-to-filter behavior.
- Keep N/Y unchanged. Missing or other statuses are not assigned to either bar.
- Include the new chart in the PDF with matching colors and unclipped capture; preserve the existing charts and export content.

## 2. Open Sales Orders launchpad card
- Show the total open value and order-line count across **all active available rows**, without financial-year date restrictions or the preset document-type restriction.
- Change **Current FY Orders** to **Total Open Orders**.
- Remove the **FY 2026–27 · 01.04.2026 – 10.10.2026** caption entirely.
- Keep the description bars, their counts and values, last successful sync time, and View details link. All description groups must reconcile to the total.
- Leave Net Sales and the report’s editable date filters and existing defaults unchanged.

## Technical details
- Add a pure LD-status aggregation helper using the report’s filtered rows; convert KWERT_INR to Crores only for display.
- Update the overview grid and its desktop width overrides for four equal tracks. Preserve independent PDF sizing; capture the new chart separately if needed to prevent crowding or clipping.
- Remove launchpad date/document-type query restrictions and use a new all-date cache identity so the previous FY total cannot be reused.
- Update the saved requirements and architecture notes during implementation.

## Verification
- Test Y and N sums and line counts, zero values, missing statuses, and filtered-row inputs.
- Test that launchpad totals include rows outside the current FY and outside the preset document types, and that breakdown counts and values reconcile.
- Check four-card alignment at 951px and wider desktops, readable tablet/phone arrangements, and no page-width overflow.
- Download a fresh PDF to verify the LD Status card, green/red gradients, and no clipped cards or sync labels.
- Confirm the launchpad has no FY caption and shows all-date totals; provide an updated screenshot after implementation.