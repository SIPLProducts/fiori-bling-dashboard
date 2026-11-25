# Remove three filters from Daily Production Report

Remove the **Storage Location**, **Work Center** and **Cost Center** dropdowns from the filter panel on the Daily Production Report screen.

- Remaining filters: Plant, Year, Month, Posting Date From/To, Material.
- Cards (Top 10 Work Centers, Production by Cost Center) and table columns stay unchanged.
- Reset/Clear keeps working; the removed filters no longer narrow the data.

## Technical details
- `src/components/daily-production-dashboard.tsx`: drop `field("sloc")`, `field("wc")`, `field("cc")` from the filter grid and stop applying those keys in filtering.
