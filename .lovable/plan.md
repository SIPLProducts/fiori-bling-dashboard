# Show full PO Type and Days names in donut tables

On Open Purchase Orders, the names in the two donut tables get cut off ("DOMES…", "PROJE…", "61 – 1…", "181 – 3…").

## Fix
- Make the donut a little smaller so the table beside it gets more room.
- Show the full name. Shrink the Val and % columns to fit their numbers, so the name column gets the space left over.
- If a card is still too narrow, let the name wrap onto a second line instead of cutting it off. Hovering still shows the full name.
- Keep headers (Type/Days, Val, %), colors, the total in the middle and the PDF layout as they are.

## Technical
- `Donut` in `src/components/open-po-dashboard.tsx`: donut column `minmax(0,6rem)`, name span `min-w-0 flex-1 break-words` (no `truncate`) plus a `title`, value `shrink-0` instead of `ml-auto pl-2`, % column `w-8`.
- Check with Playwright at 949px and 1280px widths.
