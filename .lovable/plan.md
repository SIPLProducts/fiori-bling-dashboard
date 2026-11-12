# Purchase Orders: tiles by Document Type

## What changes
- Keep the **Total Val** tile first.
- Replace the **DOMESTIC Val** and **Remaining Val** tiles with one tile per document type group: **DOMESTIC, PROJECT, CAPITAL, SERVICE, IMPORTED, OTHERS** (₹ Cr, INR lines only).
- Each tile uses that group's existing colour (same as the Document Type donut).
- Tiles follow the screen filters; a type with no value shows 0.00.
- Tiles sit in one row on desktop (wrapping on smaller screens) and are included in the PDF.

## Technical details
- `src/components/purchase-orders-dashboard.tsx`: render tiles from `PO_GROUPS` using the existing `types = sumInr(filtered, poGroup)` and `PO_GROUP_COLORS`; grid `sm:grid-cols-3 lg:grid-cols-7`. Drop the `domesticSplit` usage (helper and its test kept).
