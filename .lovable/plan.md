# Count order numbers (not line items) in all cards

## Rule confirmed with Sunil

- Every card on the Open Sales Orders screen counts **distinct Sales Order numbers**, not line items.
- Within each group (bucket, document type, status, zone, plant, ranking), an order is counted **once per group it touches** — so if order 1001 has lines in two aging buckets, it counts once in each. Group counts can add up to more than the total; that is expected.
- **Values (₹ Cr) are unchanged everywhere** — they stay the sum over line items.
- The **detailed table stays line-item based**: rows, pagination, totals, Excel, and table search are untouched.

## What changes

1. **Total Open Orders tile** — already shows the distinct order count (e.g. 12); unchanged.
2. **Document Type donut + breakdown** — donut slices, breakdown "Orders" column, tooltip, and the centre "Total Orders" figure switch to unique order numbers per type (centre = distinct orders of the whole filtered set).
3. **Aging Bucket donut + breakdown** — same: unique orders per bucket (1–180, 181–365, 365–730, >730), centre shows the distinct order total.
4. **LD Status card** — Y/N bar counts become unique orders per status; values unchanged (Y red, N green as today).
5. **Open Orders / Partial Delivered status cards** — Count = unique orders among lines with no delivery / with partial delivery; share % = group orders ÷ distinct total orders.
6. **Open Order Lines by Sales Zone** — left-side counts become unique orders per zone; share vs distinct total.
7. **Plant-wise Pending** — the order-line count becomes unique orders per plant (value, quantity, count).
8. **Top 10 Customer / Product / Model Wise** — the count in each ranking becomes unique orders per customer/product/model.
9. **Pending Orders Against AH tile** — becomes the count of distinct orders that have **at least one line with Total AH > 0** (previously it counted every such line).
10. **Donut centres and the small "X of Y orders" caption** — centres show distinct orders; the caption wording becomes "X of Y line items" so the table-side numbers are not mislabelled.

## What does NOT change

- Open Order Value tile, all ₹ Cr values, trend bars and their value tooltips, Quick View content.
- Detailed table (line rows, Status/search, pagination, totals row, Excel download, dd.MM.yyyy dates).
- Launchpad Open Sales Orders card (separate screen) — unchanged.
- Layout, colors, PDF page structure, card sizes.

## Technical details

- `src/lib/open-sales-orders-table.ts`: keep `countDistinctOrders`; change `countPendingOrdersAgainstAh` to count unique orders with any `totalAh > 0` line.
- `src/lib/open-sales-orders-filters.ts`: `summarizeDocumentDescriptions` counts unique `order` per description group (values still summed per line).
- `src/lib/open-orders-ld-status.ts`: `summarizeLdStatus` counts unique orders per Y/N (accept `order` in its row type).
- `src/components/open-sales-orders-dashboard.tsx` metrics memo:
  - Buckets keep their row arrays; `count = countDistinctOrders(bucket.rows)`.
  - Zone, plant, and ranking aggregations accumulate a `Set` of order numbers per group instead of incrementing a line counter.
  - Status-card counts and Pending-AH use distinct orders; all share percentages divide by the distinct order total.
  - Both donut centres render `metrics.distinctOrders`; caption switches to line-item wording.
- PDF uses the same metrics, so all exported counts follow automatically.
- Tests: new `tests/open-sales-orders-order-counts.test.ts` — one order with lines in two buckets counts in both; per-type/per-status/per-zone unique counts; Pending-AH tile counts orders not lines; values unchanged. Update `tests/open-orders-ld-status.test.ts` and `tests/open-sales-orders-pending-ah.test.ts` for the new counting rule.

## Verification

- Apply a filter and cross-check a card count against a database `COUNT(DISTINCT sales_order)` on active rows for the same selection.
- Check the four overview cards, zone/plant rows, Top-10 cards, status cards and the PDF export at the 889×529 viewport and on wide desktop.
- Run the test suite and confirm a clean build.
