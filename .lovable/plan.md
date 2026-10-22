# SIT Sales Document Type fix + dated download names

## 1. SIT Sales Document Type: AUART code + VTEXT_DC description
Problem: the SIT code comes from the invoice type (FKART "ZDF2" / VTEXT "Domestic Invoice") instead of the sales order type **AUART "ZDOR"**. Long dropdown entries are cut off. The table shows only the code.

- SIT dropdown shows **ZDOR — Domestic Sales** (code = AUART, description = VTEXT_DC), full text, not cut off.
- **Detailed table** Sales Document Type column shows **ZDOR — Domestic Sales**; Excel shows the same; table search finds either part.
- "SIT by Sales Document Type" card uses the same AUART code; ZDOR is pre-selected on open.
- Dropdown list items wrap instead of being cut off (visual only, all screens).

## 2. Every PDF / Excel download named "Screen name + today's date"
Format: `<Screen name>_DD-MM-YYYY`, for example:
- `Sales In Transit (SIT)_22-10-2026.pdf` / `.xlsx`
- `Order Book_22-10-2026.pdf` / `.xlsx`
- `Open Sales Orders_22-10-2026.pdf` / `.xlsx`
- `Net Sales_22-10-2026.pdf` (replaces the financial-year-based name)
- `Cash Flow_22-10-2026.xlsx`, `TBN_22-10-2026.pdf`
- Chart CSV/PNG downloads on Sales Analytics and KPI: `<chart name>_22-10-2026`

Date is today's date in India time. File contents are unchanged.

## Technical details
- `src/lib/sit-data.ts`: add `auart`; `documentType: t(r.auart, t(r.fkart))`; bump SIT query key.
- `src/components/multi-select.tsx`: option label `truncate` → `whitespace-normal break-words`; popover `w-64` → `w-80 max-w-[90vw]`.
- SIT only: table cell, table search (`open-sales-orders-table.ts`) and Excel documentType render `code — description`.
- New pure helper `datedFileName(screen, ext, now)` in `src/lib/format.ts` (IST date, DD-MM-YYYY) with a test; used by open-sales-orders-dashboard, sd-live-dashboard, tbn-dashboard, cash-flow.ts, chart-export-buttons.
- `open-sales-orders-export.ts`: value-column header chosen from an explicit variant argument instead of `fileName.startsWith(...)`.
- Update the memory rule "Name PDFs by the FY ending year" to the new date-based naming; update `tests/sit.test.ts` for AUART.
