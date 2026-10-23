# Remove "vs. previous period" from Sales Register tiles

- Remove the "vs. previous period" caption from all four Sales Register tiles (Total Sales Count, Total Net Value, Unique Customers, Total LAH).
- Keep each tile's icon, title, value and color unchanged.

## Technical details
- Delete the caption line in the `Tile` component in `src/components/sales-register-dashboard.tsx`.
