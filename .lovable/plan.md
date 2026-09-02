# Sales report KPI — card accents, revenue trend fill, and last-synced fix

## 1. Coloured left border on every card

Add a 3px coloured left edge to each analytics card so the sections read as distinct blocks:

- Revenue trend — primary blue
- Sales mix by type — teal
- Volume & average realization by month — green
- Top 5 materials — amber
- Top customers — purple
- Revenue mix by type — teal
- Document lines (31,862) — primary blue

Implemented by extending the shared `Panel` component with an optional accent prop (semantic `--kpi-*` tokens, no hardcoded colours) so the same treatment stays consistent across other report screens later.

## 2. Revenue trend background

Give the Revenue trend chart a soft tinted area under the line (light blue gradient fading to transparent) instead of a flat white plot area, matching the line colour at low opacity so the numbers stay readable.

## 3. "last synced —" is showing blank

Confirmed cause: the dashboard reads the newest row from the sync-run log filtered on the endpoint name `ZFISALES`, but every real run is logged under the endpoint name `Sales_Reports_KPI`, so no row matches and the label falls back to a dash.

Fix:
- Stop hardcoding a single endpoint name; take the most recent run for the sales endpoints (match the configured sales endpoint name, falling back to the newest run for any sales-KPI endpoint).
- Also read the newest `synced_at` timestamp from the sales detail table and show whichever is more recent, so the label still shows a real time after bulk loads that don't create a run row (current data shows 2 Sep 2026, 12:46 IST).
- Show the run status next to the time when the latest run failed, e.g. `last synced 02-Sep-2026 14:50 IST · last run failed`, so a stale figure is visible rather than silently old.

## Technical notes

- `src/components/report-shell.tsx`: add optional `accent` prop to `Panel`, rendering a `border-l-[3px]` in the chosen token colour.
- `src/components/sd-live-dashboard.tsx`: pass accents to each Panel; convert the Revenue trend `LineChart` to a `ComposedChart`/`Area` with a `linearGradient` fill.
- `src/lib/zfisales.functions.ts`: `getSalesSyncStatus` queries the newest `sap_sync_runs` row without the `ZFISALES` equality filter (ordered by `started_at`), plus `max(synced_at)` from `zfisales_detail`, and returns the later of the two along with the latest run status.
