# Smaller text inside both donuts

- Reduce the center count from 22px to 18px in **Open Orders by Sales Document Type** and **Open Orders by Aging Bucket**.
- Reduce the center labels (“Total Orders” and “Orders”) from 12px to 10px, with tighter spacing so they fit clearly inside the donut opening.
- Keep the count bold, centered, and high-contrast; keep labels centered without touching the colored ring.
- Leave donut sizes, tables, the three-card desktop row, other cards, calculations, and PDF/Excel exports unchanged.

## Technical approach
Update only the screen-scoped donut text rules in `src/styles.css`; preserve PDF text styling.

## Verification
Check both donut centers at the current 949px desktop width and on narrow phones, including the displayed 1,174 total, and confirm no text overlaps the rings.