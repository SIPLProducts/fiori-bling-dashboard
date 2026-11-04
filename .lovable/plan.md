# Purchase Orders: move Delivery Aging Status beside PO Type

- Row 1 becomes four cards: **PO Value by Document Type, Delivery Aging Status, Top 10 Vendors, Top 10 Materials** (same as Open Purchase Orders' first row).
- Row 2 goes back to two half-width cards: **Plant Analytics** and **Monthly PO Value Trend**.
- Nothing else changes.

## Technical details
- `purchase-orders-dashboard.tsx`: move the aging `Card` into row 1 after the Document Type card; row 1 grid `lg:grid-cols-4` (keep `sm:grid-cols-2`), row 2 back to `lg:grid-cols-2`.
