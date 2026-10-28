# Segment card (BRSCH, named by BRTXT) — Net Sales + Sales Register

## What I found
- Neither screen shows a Segment card yet, so I'll add a new one.
- Both screens already save BRSCH, so no database or sync change is needed. Sales Register has it on 4,025 of 4,032 lines; Net Sales has it on 31,860 of 33,246 lines.
- BRTXT (the name) is on almost every Sales Register line, but on only 956 Net Sales lines.

## What gets built
- A new **Segment** card on both screens: coloured bars of value (₹ Cr) for each segment, highest first. It follows the filters.
- Bars are grouped by the segment code (BRSCH) but labelled with the segment name (BRTXT), so the code itself isn't shown.
- If a code has more than one name in SAP, the most common name is used.
- If a code has no name at all (likely for many Net Sales lines), the bar shows the code so the value isn't lost.
- Lines with no segment code are left out, the same as the Industry Name card.
- A **Segment** column (showing the name) is added to the details table and to the Excel/CSV download on both screens. The card also appears in both PDFs.

## Technical details
- Add a pure helper `segmentTotals(rows, code, name, value)` to `src/lib/industry-name.ts`. It groups by trimmed code, picks the most common name for each code (falling back to the code), skips blank codes and sorts highest first. Add unit tests for these rules.
- Sales Register: read `brsch` in `sales-register-data.ts` and add `segmentCode` and `segmentName` to the row; bump the query key; add the card, a table column, the Excel column and an Excel Segment sheet.
- Net Sales: read `industry` (BRSCH) in `sd-live.ts` (BRTXT is already read as `industryText`); bump the query key in the dashboard and the drill-down; add a Panel next to Industry Name and add a Segment column to the table, which also puts it in the CSV.
