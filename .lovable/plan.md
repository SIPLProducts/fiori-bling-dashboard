# Smart Filters: four columns

## Layout
- Show four equal-width columns in the Open Sales Orders Smart Filters card at desktop widths, including your current 901px view.
- Row 1: **Plant · Distribution Channel · Sales Document Type · Date Range**.
- Row 2: **Customer · Sales Zone · Products · Division**.
- Keep four columns on wider desktops rather than expanding to seven.
- Keep two columns on tablets and one on narrow phones for readable controls.
- Keep the Single / From–To switch within Date Range, with aligned labels and date buttons that fit their column.

## Scope
Change only the filter arrangement. Preserve all selections, date behavior, Reset, calculations, charts, table and downloads.

## Technical details and validation
Update the scoped filter grid in `src/components/open-sales-orders-dashboard.tsx` to use four columns from 900px, removing the three- and seven-column desktop overrides. Verify both date modes, populated date labels, dropdowns and no page overflow at 901px, wide desktop, tablet and phone widths.