# Refine Sales Dashboard comparisons, PDF models, and launchpad fiscal-year values

## Result

- Keep the Sales Dashboard’s existing current April–March financial-year default.
- Make the launchpad **Net Sales** card use that same current financial-year window instead of summing all active historical sales rows.
- Simplify quarterly visuals on both the screen and downloaded PDF.
- Limit the PDF’s Sales by Model section to the Top 10 models.

## Changes

1. **Quarter cards**
   - Remove the amount-difference figure shown at the right of each quarter’s month range above the bar chart.
   - Keep the quarter total, comparison percentage/text, monthly bars, axes, bar values, and tooltips unchanged.

2. **Quarterly Trajectory & Up/Down Variance Analysis**
   - Remove the Actual/Baseline legend and baseline explanation.
   - Remove the dashed baseline markers.
   - Remove each quarter’s right-side up/down variance value.
   - Remove the footer’s “quarters increased” and average-variance figures.
   - Keep the quarter labels and actual-sales bars so the card remains useful and compact.

3. **Sales by Model PDF section**
   - In the PDF only, rename the heading to **Sales by Model**.
   - Export only the Top 10 filtered models in one model section.
   - Keep the on-screen title and Top 10 / Top 20 / All Models controls unchanged.

4. **Current financial-year module-card values**
   - Update the launchpad Net Sales summary to filter active sales rows from 1 April of the current financial year through today.
   - Apply the same total and Domestic / Service / Exports percentage scope in both **All Modules** and **Sales & Distribution**, since they render the same card.
   - Keep status-only and coming-soon cards such as Dispatches, Order Book, TBN, Cash Flow, and Asset Register unchanged because they do not currently display dated business totals.
   - Preserve the existing explicit Refresh behavior; tab or screen changes will not silently load newer sales data.

## Technical details

- Remove only the requested comparison presentation from the quarter components; do not change quarter calculations or Executive Insights.
- Replace the PDF all-model export state with a PDF Top-10 state and update the chart-ready wait accordingly.
- Extend the Net Sales summary query to accept the current financial-year date bounds and filter `posting_date`, while retaining active-snapshot filtering.
- Apply the database function change through a migration and update generated database types.

## Verification

- Confirm quarter cards no longer show the right-side amount difference on screen or in PDF.
- Confirm the trajectory card has no Actual/Baseline legend, baseline markers, right-side up/down amounts, or variance footer on screen or in PDF.
- Export a PDF and confirm exactly one **Sales by Model** section containing at most 10 models.
- Confirm the launchpad Net Sales total and percentages match the Sales Dashboard’s default current-financial-year scope.
- Verify both All Modules and Sales & Distribution tabs show the same current-year Net Sales values.
- Run focused Sales tests, type checks, and visual PDF inspection for every generated page.
