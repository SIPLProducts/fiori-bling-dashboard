# Order Book: 7 / 3 / 2 card widths

These changes apply only to the Order Book Report screen. Open Sales Orders stays as it is.

- On wide screens, the first chart row is split into 12 equal parts:
  - **Month on Month** takes 7 parts (widest).
  - **Orders by Sales Document Type** takes 3 parts.
  - **LD** takes 2 parts.
- On smaller screens, the cards stack the same way they do today.
- The PDF uses the same proportions.

## Technical details
- In the overview row, change `lg:grid-cols-3` to `lg:grid-cols-12` when `isBook` is true. Add `lg:col-span-7` to the Month on Month panel, `lg:col-span-3` to the Doc Type panel and `lg:col-span-2` to the LD panel.
- Keep the Doc Type donut stacked above its table (one column) so it fits the narrow card. Let the LD bars shrink to fit the 2-part width.
