# Plant-wise Pending tooltip: keep each plant's divisions, shown one per line

## What the tooltip means
The **Division(s)** line lists the SAP **Division — industry** pairs belonging to that plant's filtered rows: `VZM — CPD`, `VZM — Scrap`, `VZM — VRLA`. Division comes from the SAP `DIVISION` field (all current rows are `VZM`), and the part after the dash is the SAP industry description `VTEXT_DI`. Only the divisions actually present for that plant appear, each listed once.

This stays. The tooltip keeps showing the divisions of that plant, alongside the plant name and code, Pending Value (₹ Cr), Pending Quantity and Open Orders.

## Changes
1. **One division per line** inside the tooltip. Today the three are joined with commas, so the list wraps in the middle of a name — the screenshot shows `VZM —` ending a line and `VRLA` starting the next. Each division gets its own line so no name is split.
2. **Nothing else in the tooltip moves**: same header (plant name with code), same three figures, same colours.
3. **Detailed table Division column stays as it is** — plain `VZM`, as you confirmed.
4. Filters, summary tiles, all other charts, the detailed table, Excel and PDF contents are untouched.

## Also finishing the plant label in the PDF
The exported PDF currently draws the diagonal plant name partly under the bar, so the end of `HBL VIZIANAGARAM` is lost on screen-free viewing. The fix (paint the axis in front of the bars, and start the label just left of the bar) is already in the code; it needs one re-download check so the PDF shows the complete plant name, matching the screen.

## Technical details
- `src/components/plant-pending-chart.tsx`: in the tooltip, render `plant.divisions` as a small list (one row per division) instead of a comma-joined string, and widen the tooltip box if a line needs more room.
- `src/lib/open-sales-orders-plants.ts`: unchanged — it already returns each plant's own divisions, unique and sorted, which the existing tests in `tests/open-sales-orders-plants.test.ts` cover.
- No database, SAP mapping or filter changes; no new columns.

## Verification
- Open Open Sales Orders Reports, hover the plant bar, and confirm the tooltip shows `VZM — CPD`, `VZM — Scrap`, `VZM — VRLA` as three separate unbroken lines.
- Download the PDF and confirm the plant name is fully visible, not clipped by the bar.
- Run the test suite and check the build log.
