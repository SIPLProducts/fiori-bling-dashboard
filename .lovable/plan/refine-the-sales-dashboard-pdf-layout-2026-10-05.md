# Refine the Sales Dashboard PDF layout

## PDF header
- Keep the HBL logo, company name, and financial-year label unchanged.
- Keep **Sales Dashboard** on the left of its row.
- Remove the duplicate plain **All / Domestic / Services / Exports** labels from the right side of that row.
- Keep the existing boxed sales-type selector row below it, including the active selection.

## PDF chart arrangement
- Keep the normal on-screen dashboard layout unchanged.
- During PDF download only, arrange these six cards as three page-safe two-column rows in this exact order:
  1. **Top 10 Customers** | **Sales Trend**
  2. **Top 10 Profit Centres** | **Segment**
  3. **Customer Contribution (Top Sales up to 10)** | **Sales Mix**
- Preserve each chart’s current data, filters, controls, drill-downs, labels, and styling.
- Treat each two-card row as one PDF pagination block so neither card is split across pages.

## Verification
- Export a populated Sales Dashboard PDF and confirm only the lower boxed sales-type row remains.
- Confirm the six requested cards appear in the specified two-column pairs and order.
- Render and visually inspect every PDF page for clipping, overlap, unreadable labels, or split cards.
- Confirm the regular dashboard still uses its current layout and the preview build remains clean.