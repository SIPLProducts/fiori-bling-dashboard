# SD dashboard: trim redundant cards, add item/month depth, fix empty figures

## What the data can and cannot support

I checked the live `zfisales_detail` rows (17 rows, one profit centre, one country group, all Exports). Findings:

- The SAP response *does* carry quantity (`MENGE`), item (`POSNR`), month, `TOT_AH`, and split amounts (`DOMESTIC`, `EXPORTS`, `SERVICE`, `GROSS`, `NET`), but the stored columns `quantity`, `total_ah`, `doc_item`, `country_name` are empty/0 in every row. Cause not yet confirmed — first task is to find out why the mapped values are not landing and re-run the sync so Qty/Item/Month are real.
- There is **no delivery, dispatch, order-status, payment/clearing, or return/rejection data** in this extract. So Fulfillment Rate, Open Backorders / Delayed Deliveries, Payment & Aging Breakdown, and Return/Rejection by Material cannot be built honestly from what SAP is sending today. They need extra APIs (VBRK/VBRP + LIKP/LIPS for delivery, BSID/BSAD for aging, returns doc types). I will not fake them with placeholder logic.

## 1. Fix the underlying figures

- Diagnose why `quantity`, `total_ah`, `doc_item`, `country_name` stay empty despite being present in the raw payload, fix the sync mapping, and backfill existing rows from the stored `raw` JSON so the table and KPIs show real Item, Qty, UOM, AH.
- Also map the amount splits already in the payload: `DOMESTIC`, `EXPORTS`, `SERVICE`, `GROSS`, `NET`, `EXCISEDUTY`.

## 2. Cards to remove

- Quantity KPI card — folded into the new realization card instead of standing alone.
- Revenue by profit centre chart — single bar; the Top Profit Centre KPI already says it.
- Revenue by country chart — single block, no insight.
- Revenue by Segment donut — duplicate of Sales Mix by Type; keep one donut only.

## 3. Cards to add (buildable from this data)

- **Average realization trend** — combined chart per month: bars = billed quantity, line = average realization per unit (amount ÷ quantity). Replaces the removed flat bars.
- **AOV & document depth** — KPI showing average value per document plus average lines per document, using the newly populated `doc_item`.
- **Month-over-month movement** — monthly revenue with % change vs previous month, up/down badge.
- **Revenue mix by amount type** — Domestic / Export / Service / Excise split from the mapped split columns, as a stacked horizontal bar (this is the honest version of the "status breakdown" bar).
- **Top 5 materials by revenue with share badges** — ranked list with % of total badges (the ranked-list pattern requested; on returns data it can later switch to rejection rates).
- Table gains **Item** and **Month** as first-class sortable columns with proper Qty/UOM values.

## 4. Aesthetic

Keep the existing tinted KPI palette; the freed grid space lets the trend chart go full width and the remaining donut sit beside the mix bar, so the page reads as three tidy rows above the document table.

## Technical notes

- `src/lib/zfisales-sync.server.ts`: correct field mapping; add split-amount columns.
- Migration: nullable numeric columns for the amount splits; backfill existing rows from `raw` via a data update.
- `src/lib/sd-live.ts`: new aggregates (per-unit realization, MoM, lines-per-doc, amount-type mix); drop country/profit-centre/segment aggregates no longer rendered.
- `src/components/sd-live-dashboard.tsx`: remove four cards, add the new ones, extend the table columns.

## Not included (needs new SAP APIs)

Fulfillment rate, open backorders/delayed deliveries, payment aging, return/rejection rates. Tell me which SAP extract to wire up for these and I will plan them as a follow-up.
