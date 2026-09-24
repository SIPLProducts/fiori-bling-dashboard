# Add Sales by Model (Amount & Per AH)

## Result
Add one full-width analytics card directly below the **Total AH** and **AH Sales** tiles and above the **Net Sales List**.

- Title: **Sales by Model (Amount & Per AH)**
- Horizontal bars rank models by summed local-currency sales.
- A segmented control switches between **Top 10 Models**, **Top 20 Models**, and **All Models**.
- The card follows every active dashboard filter and uses the same `Total AH > 0` rowset as the two AH tiles.
- The card can expand using the dashboard’s existing chart expansion behavior.

## Calculations
1. Start with the active filtered Net Sales List rows.
2. Reuse the shared qualifying rowset where parsed `totalAh > 0`; do not filter by the separate `ah` field.
3. Group qualifying rows by `model`, using **Unassigned** when Model is blank.
4. For each model calculate:
   - `totalAmount`: sum of `amount`, including negative amounts.
   - `totalAh`: sum of `totalAh`.
   - `perAhRate`: `totalAmount / totalAh`.
   - `recordCount`: number of qualifying Net Sales List rows.
   - `salesSharePct`: model `totalAmount` divided by total AH-qualified sales amount.
5. Sort descending by `totalAmount`, then apply the selected Top 10, Top 20, or All limit.

## Chart and interaction
- Use a Recharts vertical-layout horizontal bar chart.
- Y-axis: Model names, with the realization rate shown beside each model as `₹XX.XX/AH`.
- X-axis: local-currency sales formatted in Crores; preserve sensible formatting for smaller or negative values.
- Bar-end labels: exact sales amount in `₹XX.XX Cr`.
- Tooltip shows Model, Sales Amount, Total Volume in Lakhs AH, Realization Rate, Records, and Share of Total AH Sales.
- Use semantic dashboard colors, the existing card styling, and a subtle theme-safe hover cursor rather than a hardcoded color.
- Give All Models a scrollable/dynamically sized chart so labels and bars remain readable on desktop and mobile.

## Technical details
- Extend the shared sales analytics result with model-level aggregates derived from the already-created `qualifyingRows` collection; do not create an independent filter pass.
- Add a focused chart component and local Top 10/20/All state in the Sales Dashboard.
- Keep the Net Sales List, CSV export, global filters, and AH tile calculations unchanged.
- Add tests for shared `totalAh > 0` qualification, model grouping and ordering, negative-amount inclusion, blank models, per-AH rate, record count, share, and top-limit behavior.
- Verify the chart appears in the requested position and responds to active filters and all three display limits.
