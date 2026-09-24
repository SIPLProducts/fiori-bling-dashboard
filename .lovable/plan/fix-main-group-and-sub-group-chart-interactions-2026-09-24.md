# Fix Main Group and Sub Group chart interactions

## Goal
Make every visible bar segment reliably hoverable, let **Others** reveal the remaining groups, and use the available width to show all Sub Groups more clearly.

## Changes
- Keep the default right-hand chart as one differently colored bar per Main Group.
- Make hover detection target the exact bar or stacked segment under the pointer, including very small upper segments such as **SMS**, **PEU**, **OTHERS**, and the top segment of **BATTERY**.
- Show only one focused tooltip at a time:
  - Main Group view: Main Group, amount, records, and percentage.
  - Sub Group view: Sub Group, PC Short Name, amount, records, and percentage.
- Increase the usable plot area by tightening chart margins, labels, and bar gaps.
- Reduce individual Main Group and Sub Group bar widths so more categories fit without hiding any data.
- Render every Sub Group in descending amount order. Use horizontal scrolling only when the full list still cannot fit legibly.
- Preserve every actual PC Short Name in the drilled stacked bars and legend; do not combine divisions into **Other Division**.

## Others drill-down
- Keep the **Others** summary tile on the left for smaller Main Groups.
- Clicking **Others** will replace that tile with the next group of remaining Main Groups.
- If more groups remain, show another **Others** tile; clicking it continues through the remaining groups.
- Clicking any revealed Main Group opens its complete Sub Group view in the right-hand chart.
- Keep the breadcrumb/back control so the user can return to all Main Groups.

## Verification
- Hover SMS, PEU, OTHERS, and each BATTERY stack segment and confirm the correct single tooltip appears.
- Click **Others** repeatedly and confirm all remaining Main Groups become reachable.
- Select a revealed Main Group and confirm all its Sub Groups appear in descending order.
- Confirm the 4-column/8-column card layout, totals, filters, expansion, desktop presentation, and mobile scrolling remain correct.
