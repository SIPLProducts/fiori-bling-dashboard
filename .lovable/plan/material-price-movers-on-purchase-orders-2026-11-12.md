# Material Price Movers on Purchase Orders

Add the same Material Price Movers card (Rising / Falling materials) that Purchase Register has, plus its second screen (material detail page with Back button) to the Purchase Orders screen.

## What you will see
- On Purchase Orders, directly below the ZKEYRM Comparison card: the Material Price Movers card with Rising and Falling lists, using the same rules as Purchase Register (5+ purchases, 3+ dates, consistent direction, 5%+ change, same material code prefixes, ZKEYRM materials excluded).
- Clicking a material opens the material detail screen (price trend, lines) for that material; Back returns to Purchase Orders.
- It follows the Purchase Orders filters and uses INR PO lines only. Unit price = PO value ÷ order quantity (NETWR ÷ MENGE), dated by PO date.
- Not included in the PDF detail table area changes; PDF stays as it is today.

## Technical details
- `src/components/purchase-orders-dashboard.tsx`: add `openMat` state; when set, render `MaterialPricePage trend={openMat} rows={zkRows} onBack=...`; render `MaterialTrendSection rows={zkRows} onOpen=...` after `ZrmmatCompareCard`.
- Reuse existing `poToPurchaseRows` mapping (already feeds ZKEYRM card); no backend or data changes.
