# SIT Sales Document Type: AUART code + VTEXT_DC description everywhere

## Problem
- On the SIT screen the code comes from the invoice type (FKART "ZDF2" / VTEXT "Domestic Invoice") instead of the sales order type **AUART "ZDOR"**.
- Long dropdown entries are cut off ("…").
- The detailed table shows only the code, no description.

## Result
- SIT dropdown shows **ZDOR — Domestic Sales** (code = AUART, description = VTEXT_DC), full text, not cut off.
- **Detailed table** Sales Document Type column shows **ZDOR — Domestic Sales**; the Excel column shows the same, and table search finds either part.
- "SIT by Sales Document Type" card uses the same AUART code.
- ZDOR is a default type, so it is pre-selected when the screen opens.
- Dropdown list items wrap instead of being cut off (visual only, all screens).

Order Book and Open Sales Orders data stay unchanged.

## Technical details
- `src/lib/sit-data.ts`: add `auart` to the row type; `documentType: t(r.auart, t(r.fkart))`; description stays `salesType` = VTEXT_DC. Bump SIT query key.
- `src/components/multi-select.tsx`: option label `truncate` → `whitespace-normal break-words`; popover `w-64` → `w-80 max-w-[90vw]`.
- SIT only: table cell, table search text (`open-sales-orders-table.ts`) and Excel documentType (`open-sales-orders-export.ts`) render `code — documentTypeDescription(row)` (code alone when they match).
- Update `tests/sit.test.ts` to assert documentType = AUART.
