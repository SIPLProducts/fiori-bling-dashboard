# Plant Analytics card: show DIVISION_NAME instead of plant code

On the Purchase Orders screen, in the **Plant Analytics** card:

- Bars: the label under each bar shows DIVISION_NAME (for example "VSEZ"), not the plant code.
- Table below the bars: the first column, now "Plant Code", shows DIVISION_NAME instead of the code, and the **Short Name** column also shows DIVISION_NAME.
- If a plant has no DIVISION_NAME, it falls back to the plant code.
- Values, Top 12 and Total stay the same.

## Technical details
- `src/components/purchase-orders-dashboard.tsx`: in `plantRows`, store `division` (`r.division || r.plant`). Render it in the first table cell and in the Short Name cell. Build the `PlantColumns` data from the division label so the bar captions show DIVISION_NAME.
