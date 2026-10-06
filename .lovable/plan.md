# Sales Zone chart: vertical bars

Update only **Open Order Lines by Sales Zone** in Open Sales Orders Reports.

- Change the horizontal bars to vertical columns.
- Place Sales Zone names below the columns, wrapping long names to avoid overlap.
- Place the numeric **Open Order Lines** scale on the left. Values remain line counts, not order amounts.
- Keep count and percentage labels above the columns, existing colours, filters, and tooltip details.
- Apply the same chart orientation in the PDF without changing other cards or calculations.

## Technical details
Update the Sales Zone chart in `src/components/open-sales-orders-dashboard.tsx`: use a category X-axis keyed by `name`, a numeric Y-axis for `count`, horizontal gridlines, and top-positioned bar labels. Adjust chart margins and label space for readable names.

## Verification
Check the screen and PDF for vertical bars, readable names below, counts on the left, unclipped labels, and unchanged filtered totals.