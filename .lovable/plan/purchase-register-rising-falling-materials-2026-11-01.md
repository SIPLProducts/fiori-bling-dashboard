# Purchase Register — Rising & Falling Materials

Add a new "Material Price Movers" section to the Purchase Register screen. It shows only materials bought often that have a clear upward or downward trend. Clicking a material opens its full purchase history.

## What the user will see

**1. Rising / Falling card (left)**
- A Rising | Falling switch. Rising shows red bars, Falling shows green bars.
- Top 10 materials, ranked by how strong and steady the trend is.
- Each row shows the material name, then first rate → latest rate per unit (for example ₹ 5.00 → ₹ 5.80 per NOS), the % change, and the quantity change.
- A short note at the bottom: "Only materials bought 5 or more times, on at least 3 different dates, with a steady trend. N materials checked, M qualified."

**2. Trend table (right)**
- Columns: Material, Purchases (count), First Rate, Latest Rate, Change %, First Qty → Latest Qty, Impact (₹ Cr).
- Shows the same Rising or Falling list, with every qualifying material (paged), not only the top 10.

**3. Click a material → Material detail popup**
- Header: material name and code, unit, purchase count, first and latest rate, change %.
- Line chart of the rate over each purchase date, plus quantity bars.
- A list of every purchase: date, document no, vendor, plant, quantity, rate, value.
- Excel download named "Purchase Register_<material>_DD-MM-YYYY".

## Rules for including a material
- Purchased **5 or more times** within the selected year and filters. Materials bought once or twice (or up to 4 times) are left out.
- Purchases fall on **at least 3 different dates**.
- **Steady trend:** at least 70% of the steps from one purchase to the next move in the same direction, and the overall trend line agrees.
- **Big enough change:** first to latest rate changes by at least 5%.
- Unusual jumps (over +1,000% or under −95%, usually a unit or data mistake) are left out and counted in the note.
- Rate = net value ÷ quantity, worked out for each purchase. Credit/return lines are skipped.

These limits (5 purchases, 70%, 5%) will be kept in one place so they are easy to change later.

## Technical details
- Add `menge_i`, `meins_i`, `net_price` to the purchase register select in `purchase-register-data.ts`. Add `qty`, `unit`, `rate` to `PurchaseRow`, and bump the query key.
- New pure helper `src/lib/purchase-material-trend.ts`: `materialTrends(rows, opts)` returns `{ rising, falling, excludedOutliers, scanned }`. It groups rows by material, sorts them by date, and works out monotonic-step share, linear-regression slope and first/latest rate and quantity.
- Unit tests `purchase-material-trend.test.ts` for: under 5 purchases excluded, a steady rise included, a zig-zag excluded, outliers excluded.
- New `material-trend-card.tsx` (card, table, detail dialog) placed in `purchase-register-dashboard.tsx`. It uses the existing filtered rows, radiant colours and `datedFileName`.
- Front-end only. No database or middleware changes.
