# Industry Name card (BRTXT) — Net Sales + Sales Register

## Is BRTXT stored?
- Sales Register: yes — 4,025 of 4,032 lines have Industry Name.
- Net Sales: yes, it's saved. But only 956 of 33,246 lines have a value, because SAP leaves it blank for most rows. Blank lines will show as "Unassigned" so the card total still matches Net Value.

## What gets built
- A new **Industry Name** card on both screens: coloured bars of value (₹ Cr) by industry, highest first, each bar labelled with its value. It follows the screen filters.
- Net Sales uses the same value it already shows (Net Sales amount). Sales Register uses Net Value (NETWR_EX).
- **PDF**: the card goes into both PDFs, keeping the PDF's own sizing.
- **Excel**: an "Industry Name" column is added to the detailed Excel on both screens, plus an Industry summary sheet (Industry, Value ₹ Cr, Lines).

## Technical details
- Pure helper `industryTotals(rows, valueFn)` in `src/lib/industry-name.ts`: groups by trimmed BRTXT, blank → "Unassigned", sorted desc; unit test.
- Sales Register: read `brtxt` in `sales-register-data.ts` (query key bump); add card in `sales-register-dashboard.tsx`; Excel/PDF export updates.
- Net Sales: read `branch` (BRTXT) column in the Net Sales query (key bump); add card to Net Sales dashboard + its PDF/Excel.
- No database changes and no sync changes needed.
