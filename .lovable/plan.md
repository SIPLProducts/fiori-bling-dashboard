# SIT Sales Document Type: AUART code + VTEXT_DC description, full text

## Problem
- On the SIT screen the dropdown code comes from the invoice type (FKART "ZDF2" / VTEXT "Domestic Invoice") instead of the sales order type **AUART "ZDOR"**.
- Long entries are cut off ("…") in the dropdown list.

## Result
- SIT dropdown shows **ZDOR — Domestic Sales** (code = AUART, description = VTEXT_DC).
- The "SIT by Sales Document Type" card, detailed table and Excel use the same AUART code.
- Since ZDOR is one of the default types, it is pre-selected when the screen opens.
- Dropdown list items wrap to show the full text instead of being cut off; the list gets a bit wider. Applies to all screens using this dropdown (only visual).

Order Book and Open Sales Orders data stay unchanged.

## Technical details
- `src/lib/sit-data.ts`: add `auart` to the row type; `documentType: t(r.auart, t(r.fkart))`. Description already comes from `salesType` = VTEXT_DC. Bump SIT query key so cached old codes are not reused.
- `src/components/multi-select.tsx`: option label `truncate` → `whitespace-normal break-words`; popover `w-64` → `w-80 max-w-[90vw]`.
- Update `tests/sit.test.ts` to assert documentType = AUART.
