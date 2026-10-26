# SIT tooltip wording fix

On the SIT screen only (Order Book keeps its wording):

- **Month on Month tooltip**: "Order Value" -> "SIT Value", "Orders" -> "SIT Invoices".
- **SIT by Main Group / Sub Group tooltips**: "212 orders" -> "212 SIT invoices" (each division line and the Total line).
- Also catch any remaining "orders" text in SIT ranking tooltips and empty messages ("No matching orders" -> "No matching SIT invoices").

## Technical details
- `order-book-month-chart.tsx` and `order-book-subgroup-chart.tsx`: add an optional `sit` prop (or wording labels) used in the tooltip text; pass it from `open-sales-orders-dashboard.tsx` when `isSit`.
- `RankingTooltip` / empty-state strings in `open-sales-orders-dashboard.tsx`: switch on `isSit`.
