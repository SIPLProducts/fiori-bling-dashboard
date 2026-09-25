# Dynamic quarter comparisons and reference-matched analysis section

## Fix the missing comparisons

- Keep quarter totals based on the active filtered Sales Dashboard rows.
- Derive the comparison year context from the filtered posting dates/rows whenever the Year filter is empty. This fixes manual date ranges and quick ranges such as **This year**, which currently leave Year empty and therefore fall through to **No comparison**.
- Preserve Profit Centre, Segment, Customer, search, and sales-type filters for both current and comparison values; only relax date/year/quarter boundaries when retrieving the historical baseline.

## Automatic comparison rules

- For a selected date span under 18 months, compare quarters sequentially using the fiscal calendar:
  - Q2 vs Q1, Q3 vs Q2, Q4 vs Q3.
  - The first visible quarter compares with the immediately preceding fiscal quarter from available history.
  - If specific quarters are selected, compare them in fiscal order; for example, selected Q1 and Q3 means Q3 compares with Q1.
- For a selected date span of 18 months or more, use year-over-year comparisons:
  - The latest fiscal year's quarter compares with the matching quarter from the preceding fiscal year.
- Explicitly selected multiple fiscal years continue using matching-quarter year-over-year comparison.
- A zero or unavailable baseline remains neutral; otherwise calculate `((current - baseline) / abs(baseline)) × 100` and show green upward or red downward status.
- Partial quarters use only postings inside the active date range for the current amount, while the historical baseline comes from the corresponding complete comparison period available in the data.

## Rebuild the summary area to match the third screenshot

- Restyle **Total Sales** and Quarter 1–4 as the compact reference tiles, using the existing Fiori design tokens and responsive dashboard grid.
- Each quarter tile will show:
  - quarter name and fiscal month range;
  - filtered sales amount;
  - comparison badge with direction, percentage, and baseline label;
  - a data-driven mini trend line/sparkline from the quarter's monthly postings;
  - neutral messaging only when no valid historical baseline exists.
- Continue showing only selected quarter tiles when quarter filters are active; otherwise show all four.

## Quarterly analysis and insights

- Add the reference-style **Quarterly Trajectory & Up/Down Variance Analysis** panel below the tiles.
  - Show each visible quarter's actual amount against its computed comparison baseline.
  - Show the absolute variance and direction using the same calculation as the tiles.
  - Use “Actual” and “Comparison baseline” rather than inventing business targets that are not stored in the data.
- Add a responsive **Executive Insights** panel beside it.
  - Generate concise insights only from the active filtered data: strongest quarter, largest increase/decrease, and current-quarter pace when enough data exists.
  - Do not fabricate causes, targets, pipeline, budgets, or forecasts.
- Connect **Generate Detailed Variance Report** to the existing dashboard PDF export so the new tiles, analysis, and insights are included while the Net Sales List remains excluded.

## Technical details

- Extend `QuarterSummary` and `buildQuarterSummaries` in `src/lib/sd-live.ts` with inferred fiscal years, span-based comparison mode, monthly sparkline points, absolute variance, and period labels.
- Update `src/components/sd-live-dashboard.tsx` with the reference-matched tile, trajectory panel, insight panel, and existing PDF action integration.
- Add semantic light/dark tokens in `src/styles.css` only where the existing dashboard tokens do not cover the reference styling.
- Keep current filters, drill-down behavior, stable snapshot loading, table, and all later dashboard sections unchanged.

## Tests and verification

- Add focused tests for:
  - **This year** with no Year selection producing QoQ comparisons;
  - manual date ranges under 18 months producing QoQ comparisons;
  - ranges of 18 months or more producing matching-quarter YoY comparisons;
  - non-adjacent selected-quarter comparison;
  - first-quarter historical fallback;
  - zero/missing baseline neutral states;
  - negative current amounts and percentage direction;
  - all categorical filters applying equally to current and baseline data.
- Verify the supplied date-range and **This year** examples show comparison labels, arrows, percentages, and sparklines instead of **No comparison** where history exists.
- Check desktop and narrow layouts, then export the A4 landscape PDF and confirm the new full section is included without the Net Sales List.
