# SIT: creation date label and latest-year default

## What the SIT screen uses today
- Date, Financial Year, Month on Month and sorting all use SAP **ERDAT** (creation date). If ERDAT is empty, it uses FKDAT (billing date).
- Stored SIT lines have ERDAT from 13.11.2025 to 31.03.2026, so every line is in **FY 2025** (April 2025 – March 2026). No line is in FY 2026 yet.

## Why the year looked wrong
- The screen first opens with **2026** (the current year, same as the other screens) and only switches to the latest year in the data once the rows finish loading. Before that switch, or on an older build, you can see 2026 picked while 2025 lines are listed.
- The year list also always adds 2026 even when SIT has no 2026 lines.

## Changes
1. Detailed table and Excel: rename "Sales Order Creation Date" to **"SIT Creation Date"** on the SIT screen only (shows ERDAT). Order Book and Open Sales Orders keep the old name.
2. SIT starts with no year picked while it loads, then picks the **latest financial year found in ERDAT** (2025 now; it becomes 2026 by itself once SAP sends lines created from 1 April 2026). Reset goes back to that year.
3. The SIT year list shows only years that exist in the SIT data, so you can't pick an empty 2026.
4. Tiles, charts, table and Excel all follow the picked year.

## Technical details
- `open-sales-orders-dashboard.tsx`: SIT initial `fiscalYears` = `[]` until rows load; `yearOptions` skips adding `currentFiscalYear()` when `isSit`; column heading conditional on `isSit`.
- `open-sales-orders-export.ts`: same heading switch for SIT.
- Test: latest FY from ERDAT rows (2025-11-13…2026-03-31 gives "2025").
