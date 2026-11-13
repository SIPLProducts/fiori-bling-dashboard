# Month Wise Stock – new Top 10 Materials card

- Add a "Top 10 Materials" card: the 10 materials with the highest CB Val in the latest month of the filter range, full values.
- Shown as a column bar chart like Top 10 Plants: material names along the X axis (shortened when long, full name in tooltip), value on the Y axis, a different radiant colour per bar, value on top.
- Placement: in the row with Top 10 Plants and Top 10 Material Groups (three cards side by side on wide screens, stacked on small screens). Empty material names ignored.
- Included in the PDF like the other cards.

## Technical
- month-wise-stock-dashboard.tsx: `sumBy(cur, r => r.materialName || r.material)` top 10, chart with own gradient ids (`mws-m*`), grid `lg:grid-cols-3`.
