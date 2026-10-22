# SIT Detailed View: AH column in lakhs

## What changes (Sales In Transit screen only)
- The **AH** column header becomes **AH (LAH)**, and each row's value is shown in lakhs, using the same rounding as the Total AH (LAH) column (e.g. 1,24,000 shows as 1.24).
- The AH total in the table's footer row is shown in lakhs too.
- The downloaded Excel keeps the same header and lakh values, so the file matches the screen.
- Order Book and Open Sales Orders keep their AH column as it is now.

## Technical details
- `open-sales-orders-dashboard.tsx`: header `isSit ? "AH (LAH)" : "AH"`; cell and footer use `toLah(row.ah)` when `isSit`.
- `open-sales-orders-export.ts`: add an optional `ahInLakhs` flag that renames the header and divides the value by 100000; pass it for SIT.
- Add a test that a SIT AH value of 124000 exports as 1.24.
