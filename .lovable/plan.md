# Sales Distribution Reports module

Add a new business module **Sales Distribution Reports** with three screens, matching the sheet you shared.

| Screen name | T-code | This round |
| --- | --- | --- |
| Sales report KPI | ZFISALES_MIS | Full new screen with filters + KPI/chart layout |
| Sales report for Finance and GST | ZVF05_FIN_N | Placeholder page (name + T-code) |
| Sales Register report | ZVF05_SAL | Placeholder page (name + T-code) |

The existing Sales Analytics screen stays exactly as it is.

## Navigation and access

- New "Sales Distribution Reports" entry in the top shell bar with a dropdown listing the three screens, each showing its T-code as a small caption.
- Three new permission keys in the screen registry (`sdr.kpi`, `sdr.finance-gst`, `sdr.register`) grouped under "Sales Distribution Reports", so they appear in the Screen Permissions matrix and can be granted per role. Sharvi Admin keeps automatic full access.
- Launchpad tiles for the three screens, shown only to roles that have the matching permission.

## Screen 1 — Sales report KPI (ZFISALES_MIS)

Aesthetic filter bar in a sticky card at the top:

- **Posting date** — From and To date pickers, with quick chips (This month / This quarter / This FY).
- **Profit center** — searchable checkbox list in a popover, multi-select, with "Select all" and selected-count chips.
- **Plant** — same searchable checkbox list style, multi-select.
- Apply / Reset actions, and a summary line of active filters as removable chips.

Body:

- KPI strip: total sales value, document count, average value per document, top profit centre — each in a card with a large tabular figure and a small trend caption.
- Charts: sales trend by month (area) and sales by profit centre (horizontal bar), both using the existing chart styling and export buttons.
- Drill-down table under the charts with search and CSV export, reusing the existing drill-down table component.

Filter option lists (profit centres, plants) are derived from the ZFISALES dataset already in the app; when SAP is connected through the middleware they will come from the live extract instead.

## Screens 2 and 3 — placeholders

Each renders inside the standard report shell with the screen title, its T-code badge, and a short "Report coming soon — will be wired to <T-code> through the SAP middleware" note. Routes, permissions and navigation are fully wired so nothing else needs to change when the data is added.

## Technical notes

- Routes: `src/routes/_authenticated/reports/sd/kpi.tsx`, `sd/finance-gst.tsx`, `sd/register.tsx`, each with its own `head()` metadata.
- Registry updates in `src/lib/screens.ts` (new group + three keys) and `src/lib/nav.ts` (new nav group, guarded by the new keys).
- A small `src/lib/sd-reports.ts` holding screen name / T-code / route metadata so nav, launchpad tiles and permissions stay in sync.
- KPI data is served by a new server function over the existing ZFISALES dataset; no schema changes and no new tables.
- All colours come from existing semantic tokens; no hardcoded colour classes.
