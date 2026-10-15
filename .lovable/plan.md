# Hide "Unassigned" in the Open Orders by Model Wise card

## What changes

The **Open Orders by Model Wise** card will no longer show an "Unassigned" bar. Only order lines that actually carry a model name will appear in that ranking.

Today the card groups every line by its model. Lines where SAP supplies no model (and no product type or product range either) fall into a group labelled **Unassigned**, which then competes for a place in the Top 10. That group will simply be left out of this card.

## What stays the same

- The summary tiles, aging/document-type/zone/plant charts, LD Status card, Quick View, the detailed table, the Excel download and the PDF totals all still include those lines — nothing is removed from the report, only from this one chart.
- "Top 10 Open Orders by Customer" and "Top 10 Open Orders by Product" are untouched.
- The card still shows the Top 10 named models, ordered highest value first.
- If none of the filtered lines carry a model, the card shows its existing "No matching orders" message.
- Smart Filters, Refresh-only behaviour, PDF colours and layout are unchanged.

## Technical details

- A line's model is derived in `src/lib/open-sales-orders-data.ts` as `model → product_type → product_range`, defaulting to `"Unassigned"` when all three are blank.
- Add a small exported pure helper in `src/lib/open-sales-orders-filters.ts`, e.g. `hasModelWiseType(row)`, returning true only when `row.model` is non-blank and not the `"Unassigned"` placeholder.
- In `src/components/open-sales-orders-dashboard.tsx`, the metrics memo currently builds the card data with `models: rankOrders(filteredData, (row) => row.model)`. Change it to rank only the lines that pass the helper: `rankOrders(filteredData.filter(hasModelWiseType), (row) => row.model)`.
- Because the card reads `metrics.models`, the on-screen chart and the PDF snapshot of it both drop the bar with no further edits.
- Add `tests/open-sales-orders-model-wise.test.ts` asserting: a line with model `"KPH"` is kept; a line whose model is `"Unassigned"` or blank is dropped; the retained group keeps its value and line count. Run `bun test` and confirm the build.

## Verification

- Open the Open Sales Orders report in the preview and confirm no "Unassigned" label appears in the Model Wise card while the totals above it are unchanged.
- Download the PDF and confirm the Model Wise panel matches the screen.
