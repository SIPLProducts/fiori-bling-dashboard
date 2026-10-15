# Plant-wise Pending: label the bar with the division (VZM)

## What changes
1. **Below each bar** the label becomes the plant's **division** — `VZM` — instead of the plant name `HBL VIZIANAGARAM`. Where a plant ever carries more than one division, they are shown together (`VZM / VZS`); where SAP supplied no division, the plant code is shown so the bar is still identifiable.
2. **The hover tooltip** shows **Division: VZM** and then the three figures — Pending Value (₹ Cr), Pending Quantity, Open Orders. The industry names (`VRLA`, `Scrap`, `CPD`) and the plant name no longer appear in this card.
3. **One bar per plant, unchanged.** Pending value, pending quantity and distinct order counts are calculated exactly as today; only the label and the tooltip text change.
4. Short labels such as `VZM` sit **horizontally** under the bar instead of diagonally, which also frees the vertical space the rotated name needed. The diagonal arrangement is kept automatically whenever a label is too long for its slot (several divisions joined, or many plants in a narrow card).

## What does not change
Smart Filters, summary tiles, all other charts, the detailed table (its Division column stays the plain `VZM`, and the Plant column still shows plant with name), search, status selection, pagination, Refresh behaviour, Excel contents, and the Main Group / Sub Group tooltips (they keep listing their own divisions with industry names). The PDF uses the same card, so its plant block follows the new `VZM` label automatically.

## Technical details
- `src/lib/open-sales-orders-plants.ts`: `summarizePlantPending` keeps grouping by plant code and distinct-order counting, but `divisions` now holds the plain SAP division codes (`DIVISION`, `SPART` fallback), unique and sorted, with `Unassigned` skipped — the ` — industry description` suffix is dropped, since nothing else reads it.
- `src/components/plant-pending-chart.tsx`: the axis tick and the tooltip both take the plant's division codes (joined with ` / `, plant-code fallback). The tooltip header becomes `Division: VZM`, followed by the existing three measures. Bars stay keyed per plant.
- `src/lib/plant-chart-scale.ts`: `plantLabelLayout` returns a horizontal mode when the longest label fits its slot at chart text size (no truncation, small axis height); otherwise it returns today's −45° character and height calculation, which the chart already applies.
- Tests: `tests/open-sales-orders-plants.test.ts` expectations change to plain codes, plus a case where one plant carries two divisions (each listed once, order counts and values untouched); `tests/plant-chart-scale.test.ts` gains a horizontal-fit case alongside the existing diagonal ones.
- No database, SAP mapping or filter changes; no new columns.

## Verification
- Open Open Sales Orders Reports and confirm the bar is labelled `VZM` horizontally, and that hovering shows `Division: VZM` with Pending Value 3.86, Pending Quantity 1,00,925 and Open Orders 12.
- Apply the Plant filter and Reset, and confirm the label and tooltip still read correctly for the matching plants.
- Download the PDF and confirm the plant card carries the same `VZM` label, fully visible.
- Run the test suite and check the build log.
