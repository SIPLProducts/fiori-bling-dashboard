# Month Wise Stock: tiles and cards follow the selected months

The tiles and cards use the months in your Month From / Month To filter, not only the latest month.

- **Both filters on All:** every uploaded month is added together (for example Oct + Nov).
- **A range is chosen:** only the months in that range are added. If From and To are the same month, the screen shows just that month.
- **Tiles** (Total Inv Val, Raw material Val, and the rest), **Top Types, Top 10 Plants, Top 10 Material Groups, Top 10 Materials** and **Main Group / Sub Group 1, 2, 3** all follow this rule.
- **Card label:** the "Nov-2026" label at the top right of each card becomes the selected range: "All months" when nothing is picked, "Oct-2026 – Nov-2026" for a range, or the single month name.
- **Month Wise Inventory** and the **ZKEYRM Comparison** stay as they are (one bar per month).
- **Launchpad card:** it also adds up every month, so it matches the screen with no filter set.

## Technical details
- In month-wise-stock-dashboard.tsx, `cur` becomes `filtered`. `sub` becomes the range label built from f.from/f.to (or the min/max periods).
- Update the launchpad Month Wise Stock value the same way.
- Update the existing project-knowledge note that says the screen uses the latest month.
