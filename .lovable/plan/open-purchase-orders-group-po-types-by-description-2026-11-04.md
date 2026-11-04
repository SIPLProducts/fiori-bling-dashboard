# Open Purchase Orders: group PO Types by description

Use your mapping table:

| PO Type | Group |
|---|---|
| ZPDM, ZPNI, ZBBK, ZPCT | DOMESTIC |
| ZPPM | PROJECT |
| ZPCP, ZPIT | CAPITAL |
| ZPSR, ZPIS | SERVICE |
| ZPIM | IMPORTED |
| ZINT | Excluded |
| Any other / blank type | OTHERS |

## What changes
- **PO Value by PO Type donut**: one slice per group, with combined value and share %. For example, ZPDM + ZPNI + ZBBK + ZPCT show as one DOMESTIC slice. The center total is the sum of all groups.
- **PO Type filter**: lists the groups (DOMESTIC, CAPITAL, ...). Picking DOMESTIC filters every chart, tile and the table to all four codes.
- **ZINT lines are left out everywhere** on this screen and in the Open PO launchpad card: tiles, charts, table, Excel and PDF.
- **Launchpad Open PO card**: its PO-Type bars also show the groups.
- **Detail table and Excel**: the PO Type column shows both the code and the group, e.g. "ZPDM – DOMESTIC".

## Technical details
- `open-po-data.ts`: add a pure helper `poTypeGroup(code)`, holding the mapping above with OTHERS as the fallback, and a helper `isExcludedPoType` for ZINT. Rows are filtered once where they are loaded, so every view shares the same rows.
- Use `poTypeGroup` in the donut aggregation, the filter options and matching, the launch card and the table/Excel cell.
- Add unit tests for the mapping: ZPNI→DOMESTIC, ZPIT→CAPITAL, ZINT excluded, unknown→OTHERS.
- The mapping is saved to project memory.
