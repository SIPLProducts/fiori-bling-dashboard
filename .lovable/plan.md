# Refine Sales Dashboard titles, units, quarter tiles, and Main Group drill-down

## Labels and amount display

Update the Sales Dashboard cards as follows:

- **Top 10 Profit Centres by Amount** → **Top 10 Profit Centres**
  - Keep the values calculated in crores, but remove the visible `Cr` suffix from bar labels and tooltips in this card.
- **Sales by Segment (Amount)** → **Segment**
- **Customer Contribution Pareto (Top Sales up to 10)** → **Customer Contribution (Top Sales up to 10)**
- **Sales Mix by Type** → **Sales Mix**
  - Keep values scaled in crores and remove the visible `Cr` suffix from the graph and legend.
- **Top 10 Materials**
  - Keep the title and remove the visible `Cr` suffix from its values.
- **Top 10 Sales Employees** → **Top 10 Sales Men**
  - Remove the visible `Cr` suffix from its values.
- **Total AH** → **Total LAH (Lakhs)**
  - Keep the existing positive Total AH calculation, but remove the trailing `L` from the displayed value because the unit is now in the title.
- **Total Sales (Amount)** → **Total Sales**

These unit changes are scoped to the requested cards; other dashboard charts retain their current formatting.

## Quarter summary tiles beside Total Sales

Keep **Total Sales** at 4 desktop columns and use the remaining 8 columns for quarter tiles.

- Add up to four tiles: **Quarter 1**, **Quarter 2**, **Quarter 3**, and **Quarter 4**.
- Quarter values use the same active dashboard rows and all current filters as Total Sales.
- When no quarter filter is selected, show all four tiles.
- When quarter filters are selected, show only those selected quarters; the visible tiles divide the available space evenly.
- Each tile shows its sales amount and a compact comparison graphic with:
  - green upward arrow and positive percentage when sales increased;
  - red downward arrow and negative percentage when sales decreased;
  - neutral state when no valid baseline exists or the baseline is zero.

### Comparison rules

- **One fiscal year selected:** compare selected quarters sequentially within that fiscal year. For non-adjacent selections, compare each selected quarter with the previous selected quarter. The first selected quarter uses the immediately preceding fiscal quarter from available historical data; if unavailable, show a neutral baseline.
- **Two or more fiscal years selected:** use the latest selected fiscal year as the current year and the immediately preceding selected fiscal year as the baseline; compare matching quarters (Q1 vs Q1, Q2 vs Q2, etc.).
- **No fiscal year selected:** calculate the quarter totals from the currently filtered rows and show neutral comparisons, avoiding an ambiguous cross-year percentage.
- Quarter definitions remain fiscal: Q1 Apr–Jun, Q2 Jul–Sep, Q3 Oct–Dec, Q4 Jan–Mar.

## Main Group drill-down

- Rename **Main Group vs Sub Group (Amount)** to **Main Group in CR**.
- After selecting a main group, show a clear context line such as **Selected main group · INDL.BATTERY**.
- Keep the existing subgroup and PC Short Name data, stacking, scrolling, tooltips, and shared selection behavior unchanged.
- In full-screen view, place a prominent **Back to Main Group** button at the upper-left of the chart content so it remains clearly visible.
- Keep an accessible back action in the normal card view as well.

## Technical implementation

- Update `src/components/sd-live-dashboard.tsx` for titles, card-specific amount formatters, the Total LAH value, quarter tile layout/visuals, and clearer Main Group selection/back controls.
- Update `src/lib/sd-live.ts` with a reusable fiscal-quarter comparison calculation that works from the active filtered data while retaining historical rows only for the first-quarter baseline lookup.
- Extend `tests/sd-live-filters.test.ts` for:
  - selected-only quarter visibility data;
  - single-year sequential and non-adjacent QoQ comparisons;
  - first-selected-quarter historical fallback and neutral fallback;
  - multi-year matching-quarter YoY comparisons;
  - positive, negative, zero-baseline, and missing-baseline states;
  - confirmation that every quarter amount follows the same active filters as Total Sales.

## Verification

- Confirm the desktop summary row renders as 4 columns for Total Sales plus 8 columns shared by visible quarter tiles, and stacks cleanly on smaller screens.
- Confirm selecting one, two, or four quarters shows exactly those tiles and updates every dashboard result consistently.
- Confirm requested cards display crore-scaled numbers without a visible `Cr` suffix, while unrelated charts remain unchanged.
- Confirm Total LAH shows the same Lakhs result without a trailing `L`.
- Confirm Main Group drill-down shows the selected group and a clearly visible full-screen back button.
- Confirm the existing PDF export captures the visible quarter tiles and Main Group state while continuing to exclude the Net Sales List.
