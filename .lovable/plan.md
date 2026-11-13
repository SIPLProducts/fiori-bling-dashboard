# Tables Master: single-file screens, table card, new upload card colour, tighter responsive row

## 1. ZPC GROUP and Valuation Class Wise Subgroup: one Excel only
- Remove the "Select Sheet" dropdown on these two screens. The screen always shows the one uploaded file.
- Uploading again replaces the existing data, after a confirmation ("This will replace the current data"). The Created date is kept and the Updated date changes.
- If an old upload left more than one sheet, only the latest one is kept and shown.
- ZKEYRM and SAP MASTER keep their multi-sheet dropdown as today.

## 2. Table inside a card (Month Wise Upload, plus the other Tables Master screens)
- The table sits in a rounded card with a soft shadow.
- The card has a small title bar, for example "November 2026 · 33 rows", and the Created / Updated line on the right.
- Paging sits at the bottom of the card.

## 3. Upload card colour
- Replace the blue-teal wash with a soft violet-to-sky radiant and a matching border. It contrasts with the green and red buttons and the blue-teal table header.

## 4. Responsive row (fixes your screenshot at about 925px wide)
- From tablet width (768px and up), Month, Year, Search, the row count and all buttons stay on one line.
- Month and Year get narrower. Search shrinks to fill the leftover space.
- The buttons get compact: the "Excel .xlsx" hint is hidden and the padding is smaller. On screens narrower than about 1100px, "Delete month" shortens to "Delete".
- On phones it still wraps neatly: Month and Year side by side, Search below, then the buttons.
- Fix: the "Created on … · Last updated on …" line was wrongly cut short on wide screens. It will show in full.

## Technical details
- master-table-screen.tsx: a new `singleSheet` prop. When it is set, the screen auto-selects the latest master and hides the selector. onFile reuses the existing master id (or deletes the others), so re-uploads replace rows. zpc-group.tsx and valuation-subgroup.tsx pass `singleSheet`.
- The panel becomes `md:flex-nowrap`, with field widths `md:w-32` / `md:w-24` and search `min-w-0 flex-1`. UploadExcelButton gets a `compact` style below xl.
- New `tm-card` wrapper and title bar. `tm-panel` gradient switches to violet→sky in src/styles.css.
- I'll verify with screenshots at 390, 925 and 1366px (signing in with an account that has access).
