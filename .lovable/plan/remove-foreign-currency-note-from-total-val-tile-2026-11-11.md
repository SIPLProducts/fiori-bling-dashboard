# Remove foreign-currency note from Total Val tile

On the Purchase Orders screen, take away the small line "N foreign-currency lines not in ₹ totals" shown under the **Total Val** tile.

- Total Val stays as it is now (INR lines only, in ₹ Cr).
- Nothing else changes.

## Technical details
- `src/components/purchase-orders-dashboard.tsx`: delete the `foreignNote` constant and drop the `note` prop from the Total Val `Tile`.
