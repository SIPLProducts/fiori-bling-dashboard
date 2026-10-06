# Add open value to both order-status cards

## Changes
- Show clearly labeled **Count** and **Open Value (₹ Cr)** in both **Open Orders** and **Partial Delivered Orders**, on screen and in PDF.
- Keep the existing count percentage alongside the count.
- Calculate each card’s open value from the same filtered order lines used for its count:
  - **Open Orders:** lines with no delivered quantity.
  - **Partial Delivered Orders:** lines with delivered quantity greater than zero.
- Use the remaining open value, not the delivered value or original order value.
- Preserve the recently reduced spacing, existing colors, icons, and Quick View layout. Allow natural height growth only if needed to avoid clipping.

## Technical details
- Sum each status group’s existing `row.value` and pass its total into `StatusCard`.
- Reuse the existing rupee/crore formatting and dashboard filter dataset; do not change storage, status rules, charts, or table-only filtering.

## Verification
- Confirm both status counts add up to Total Open Orders and both status values add up to Open Order Value.
- Check filter changes and empty results, including zero counts and values.
- Verify readable labels and values at desktop and narrow widths, and inspect all PDF pages for clipping.