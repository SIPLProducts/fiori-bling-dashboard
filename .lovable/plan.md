# Sales Register dashboard (matching the screenshot)

## What you will see
Below the existing Smart Filters (collapsed by default to save space), the screen fits on one desktop screen:

1. **Four tiles in one row**: Total Invoice Value, Total Net Value, Unique Customers, Unique Billing Documents (icon circle, coloured tint, "vs. previous period" line).
2. **Four cards in one row**: Sales by Plant (Top 10, horizontal bars), Top 10 Customers (horizontal bars), Sales by Main Group (donut with total in the centre + legend %), Distribution Channel (donut + legend %).
3. **Three cards in one row**: Sales Register (Daily) — Invoice Value bars + Net Value line; Tax Breakdown — weekly stacked CGST/SGST/IGST/TCS; Sales by Product Category — horizontal bars with %.
4. **Sales Register Details table**: search box, Columns picker, pagination at top right; columns Bill. Date, Bill. Doc. No, Invoice No, Customer Name, Plant, Profit Center, Main Group / Sub Group, Material Description, Billed Qty, Net Value, Total Invoice Value, CGST, SGST, IGST, Posting Status (green Posted / amber Pending badge). Table scrolls inside its card so the page stays one screen.

- Values in ₹ Cr on charts, full rupees in tiles/table, same colours/gradients and light/dark theme as other screens.
- Tablets: 2 per row; phones: 1 per row.

## Data
The SAP Sales Register API is not connected yet, so tiles show "—", charts and table show "No data yet" (no made-up numbers). Once you send the API endpoint, request body and a sample response, I will store the data and every card/filter will fill from it.

## Technical details
- New `src/components/sales-register-dashboard.tsx` (recharts, existing Panel styling) fed by a pure `src/lib/sales-register.ts` aggregator taking typed rows (empty array for now), with a test for totals/top-10/distinct counts.
- `dispatches.tsx` renders filters + dashboard instead of the placeholder; Smart Filters get a `defaultOpen={false}` prop.
- Compact single-screen sizing via a scoped `.sales-register-compact` block in `src/styles.css` (chart heights ~200px, table max-height with internal scroll).
