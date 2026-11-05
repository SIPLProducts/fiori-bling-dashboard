# ZRMMAT Material Comparison: searchable dropdown and Back button

## What changes
1. **Search inside the dropdown** – Replace the separate "Search material" box and the plain dropdown with one dropdown that has a search box at its top. Typing filters materials by code or description; the first option stays "All ZRMMAT materials (N)". Materials without purchases still show "(no purchase)".
2. **Back button** – After a material is picked, a "Back" button (arrow icon) appears beside the dropdown. Clicking it returns to "All ZRMMAT materials", clears the search, and closes any open item-details popup.
3. Excel button, tiles, chart and month table stay as they are.

## Technical details
- File: `src/components/zrmmat-compare-card.tsx` only.
- Use the existing shadcn `Popover` + `Command` (CommandInput/CommandList/CommandItem) as a combobox; remove the standalone `<input>` and `<select>`.
- Back button: `Button variant="outline" size="sm"` with `ArrowLeft`, shown when `sel !== ALL`; sets `sel=ALL`, `search=""`, `detailMonth=null`.
