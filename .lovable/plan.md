# Compact Open Sales Orders dashboard

## Recommendation
Keep every section together on the same page, as requested. Reduce unused space and oversized cards rather than shrinking text or introducing tabs.

The loaded dashboard measured approximately **2,492 pixels tall at 1280 pixels wide**. Your current preview is **1114 × 677 pixels**. All charts, all three Top 10 lists, Quick View, filters, and the detailed table cannot fit simultaneously into that height without sacrificing readability. The best layout will require scrolling, but substantially less than the current page.

## Proposed layout
Preserve this order:
1. HBL bar, report title, Refresh, and PDF.
2. Smart Filters with all six existing controls, search, and bulk selection.
3. Three compact summary tiles: Total Open Orders, Open Order Value, Open Quantity.
4. Document Type, Aging Bucket, and Value Trend in one equal-width row.
5. Full-width Sales Zone chart.
6. Customer, Product, and Model Top 10 charts in one equal-width row.
7. Open Orders, Partial Delivered Orders, and Quick View immediately above the table.
8. Detailed table, with search and Status beside Excel, and pagination below-left.

## Space-saving changes
- Reduce summary tiles from their current 128-pixel minimum height to approximately 72–80 pixels; retain strong values and colored icons.
- Tighten section gaps and panel spacing consistently, without crowding headings or controls.
- Target roughly 250–280 pixels for the first chart row. Arrange each donut and its breakdown to use the available width efficiently, with no overflowing columns.
- Reduce the Sales Zone chart's excess plotting space while retaining narrow bars, count labels, and readable 45° zone names. Preserve horizontal scrolling when all zones cannot fit across the available width.
- Keep all ten entries in each ranking chart. Maintain enough vertical space for distinct rows and show full names in tooltips.
- Compact status cards and Quick View by removing repeated labels and excess internal space. Preserve the grey Quick View header, colored bodies, white values, and Highest Value's white labels and icons.
- Keep ten detailed-table rows per page and every existing column. Preserve horizontal table scrolling instead of compressing columns into unreadable widths.
- Keep filters expanded initially; retain the existing collapse control for additional space when desired.

## Readability and scope
- Do not scale the entire page down, clip content, hide charts, introduce tabs, or impose a fixed height that conceals overflow.
- Preserve summary tints, chart colors, all calculations, filters, defaults, stored data, manual refresh behavior, and export contents.
- Use compact desktop layouts only where headings, legends, and values fit. Stack sections on narrower screens when necessary.

## Technical details
- Limit changes to the Open Sales Orders dashboard's presentation and small supporting layout helpers if needed.
- Keep a separate spacious PDF presentation where necessary so screen density changes do not clip exported charts or change the established PDF section order.
- Validate with loaded data at the current 1114 × 677 preview size, standard desktop sizes, and a narrow screen. Check long names, dropdowns, chart labels, table controls, and PDF output.
- Measure the final page height and report the actual reduction. A preliminary compact-layout estimate is approximately **1,700–2,100 pixels**, depending on width and label wrapping; this is a target, not a verified result.
- After approval and implementation, provide an image reference captured from the actual updated dashboard. Preserve the current design rather than using the discarded visual concepts; label the image as a dashboard capture, not a single-screen fit.

## Acceptance criteria
Every existing section remains on one continuous page, with less scrolling, no overlapping content, readable totals and labels, working table controls, and unchanged reporting results and exports.