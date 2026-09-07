# Net Sales — renames, filter reset placement, growth fix, AH Sales tile

Answer to your question first: the **Total Sales** tile is built from the stored column **Amount in local currency** (the money amount that comes from SAP for every line). So that value is already in the database; it just isn't shown as its own column in the list yet.

## Changes

1. **Rename screen** — "Net Sales (ZFISALES_MIS)" becomes "Net Sales" in the header, launchpad tile and navigation.
2. **Rename list card** — "ZFISALES_MIS List" becomes "Net Sales List" (record count stays).
3. **Smart filters card** — move the Reset button next to the collapse/expand control on the left, beside the "Smart filters" title and count, with a chevron icon showing open/closed state. Search box stays on the right.
4. **Sales growth on tabs** — growth is month-over-month within the currently selected tab. On Services the previous month had almost no service sales, which produced +523372.3%. It will instead compare the two most recent months that both actually have sales for the selected tab, and the caption will name the two months compared, so All / Domestic / Services / Exports each read sensibly. When there is no valid earlier month, the tile shows "—".
5. **Amount in local currency column** — add it to the Net Sales List as a numeric column, formatted like the other money values.
6. **New "AH Sales" tile** — shows the total of the stored **Total AH** values for the current filters and tab (today: Domestic 50.67 Cr, Exports 12.43 Cr, Service 0). It sits in the KPI row with the other tiles and reacts to filters, search and tab exactly like Total Sales. If you meant AH Sales to total a different column, say the word and I'll switch it.

## Technical notes

- `src/lib/sap-modules.ts`: SD module title/groupTitle to "Net Sales".
- `src/components/sd-live-dashboard.tsx`: list panel title; Reset button moved into the left header cluster; new `amount` (local currency) column in `COLUMNS`; new AH Sales `KpiCard` using a summed `totalAh` and included in the responsive tile-count grid.
- `src/lib/sd-live.ts`: add `totalAh` sum to `kpis`; change month-over-month calculation to use the last two months with non-zero revenue and report their labels.
- No schema, sync or permission changes.
