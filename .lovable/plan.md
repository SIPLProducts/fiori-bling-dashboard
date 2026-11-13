# Top 10 Materials as a list like Top 10 Material Groups

On the Month Wise Stock screen, change the Top 10 Materials card from a column chart to the same horizontal bar list used by Top 10 Material Groups.

- Same look: name on the left, coloured bar, full value on the right.
- Same data: the 10 materials (name, or code when no name) with the highest stock value in the latest month of your filter range.
- Keeps its violet card colour and its place beside Top 10 Plants and Top 10 Material Groups.

## Technical details
In month-wise-stock-dashboard.tsx, replace the Top 10 Materials ComposedChart card with `groupCard("Top 10 Materials", (r) => r.materialName || r.material, "violet")`. Drop the now-unused `mws-m*` gradient defs.
