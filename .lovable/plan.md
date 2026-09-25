# Fiscal-year sales tiles and sequential quarter comparisons

## Fiscal calendar and comparison rules

- Introduce one shared fiscal-period helper where SAP year `2026` means **FY 2026–27**:
  - Q1: 1 Apr–30 Jun 2026
  - Q2: 1 Jul–30 Sep 2026
  - Q3: 1 Oct–31 Dec 2026
  - Q4: 1 Jan–31 Mar 2027
- Use this helper for Year filtering, quarter totals, labels, trends, and historical baselines so January–March stays in the preceding fiscal cycle.
- Make **This Year** select the current April–March fiscal year rather than the calendar year.
- For one fiscal year, always compare the physical preceding quarter: Q2 vs Q1, Q3 vs Q2, Q4 vs Q3. Q1 compares with the previous fiscal year's Q4 when that history exists; otherwise it is a neutral starting baseline.
- Quarter filters only control which tiles are visible; they do not change the comparison sequence. Preserve matching-quarter YoY behavior when multiple fiscal years are selected.
- Calculate growth as `((current − baseline) / abs(baseline)) × 100`; missing or zero baselines remain neutral.

## Total Sales tile

- Rebuild the tile to match the supplied compact Fiori reference while keeping all values tied to the active dashboard filters.
- Show the fiscal-year label, total sales amount, filtered posting count, and Domestic, Service, and Exports amounts and percentages.
- Add a three-colour proportional breakdown track using the existing `sales_type` totals; keep unknown sales types truthful rather than silently assigning them to a named category.
- Add an annual Revenue Target vs Actual progress indicator. When no target exists for the selected fiscal year, show **Target not configured** instead of inventing a value.

## Revenue target setting

- Add a fiscal-year revenue-target table in Lovable Cloud, keyed by fiscal year, with positive amount validation and audit timestamps.
- Allow all authenticated dashboard users to read targets; allow only Sharvi Admin to create, update, or remove them through server-validated access and row-level security.
- Add an admin-only **Revenue Targets** control near the dashboard actions. It will open a compact editor for selecting a fiscal year and entering the annual target in rupees.
- Include explicit table grants, policies, generated types, and matching self-hosted upgrade SQL so Preview, Quality, and Production can use the same configuration.

## Quarter tile refinement

- Match the reference hierarchy: quarter title and month range, amount in Crores, compact comparison badge, variance, and an in-tile monthly sparkline.
- Show an exact green upward percentage or red downward percentage from the sequential baseline; neutral Q1 has no fabricated trend.
- Highlight the latest visible quarter containing filtered sales with the stronger border, tint, and active badge. Other quarters retain their individual accent colours.
- Build each sparkline from the three fiscal months in order, including zero-value months, without combining data from another fiscal year.
- Keep the existing quarterly analysis, insights, filtering, drill-down, and PDF export connected to the corrected summaries.

## Technical details

- Refactor `src/lib/sd-live.ts` so fiscal-year membership is derived consistently from posting dates and the selected SAP fiscal-year convention, replacing calendar-year inference in quarter summaries.
- Extend dashboard analytics with normalized sales-type breakdown values and fiscal-year target achievement data.
- Add authenticated target read/write server functions and a focused target editor in `src/components/sd-live-dashboard.tsx` using existing Fiori tokens and controls.
- Add only any missing semantic light/dark tokens to `src/styles.css`; do not embed the reference screenshot.

## Tests and verification

- Cover all fiscal boundaries, especially 31 Mar/1 Apr, and confirm SAP year `2026` maps to FY 2026–27.
- Cover Q2→Q1, Q3→Q2, Q4→Q3, Q1→prior-year Q4, hidden intervening quarters, zero/missing baselines, and negative values.
- Cover **This Year**, fiscal-year filtering, sparkline month order, latest-quarter highlighting, sales-type percentages, and target achievement/unconfigured states.
- Verify Sharvi Admin can manage targets while other authenticated users can only view them.
- Check desktop and narrow layouts, dark mode, and the dashboard PDF while confirming the Net Sales List remains excluded.
