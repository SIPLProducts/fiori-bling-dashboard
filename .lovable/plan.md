# Underline only the card title

- On Open Purchase Orders chart cards, remove the full-width line under the header.
- Instead, draw the colored line only under the title text (e.g. "PO Value by PO Type"), as wide as the words.
- The full-screen button and caption on the right have no line.

## Technical
- `open-po-dashboard.tsx` `Card`: drop `border-b-2 pb-1` from the header row; put `border-b-2 pb-0.5` with the tint border color on the `<h2>` itself.
