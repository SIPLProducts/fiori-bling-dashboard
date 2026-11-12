# Purchase Orders: dynamic Document Type tiles

## What changes
- Keep the **Total Val** tile first.
- Replace the **DOMESTIC Val** and **Remaining Val** tiles with dynamic tiles: one for each document type group present in the filtered data (e.g. DOMESTIC, PROJECT, CAPITAL...), sorted by value, showing its ₹ Cr value (INR lines only).
- Each tile uses that group's existing colour (same as the Document Type donut).
- Tiles follow the screen filters; types with no lines in view are hidden, and new types appear automatically.
- Tiles wrap across rows on smaller screens and are included in the PDF.

## Technical details
- `src/components/purchase-orders-dashboard.tsx`: build tiles from the non-zero entries of `types = sumInr(filtered, poGroup)`, sorted desc, coloured via `PO_GROUP_COLORS`; responsive grid. Drop the `domesticSplit` usage (helper and its test kept).
