# Plant Analytics table: Plant Code shows WERKS

On the Purchase Orders screen, in the **Plant Analytics** table:

- **Plant Code** column shows the plant code (WERKS, e.g. "1200").
- **Short Name** column keeps DIVISION_NAME (e.g. "VSEZ").
- The bars keep DIVISION_NAME labels. Values and Total don't change.

## Technical details
- `src/components/purchase-orders-dashboard.tsx`: in the Plant Analytics table, render `{p.code}` in the first cell instead of `{p.name}`.
