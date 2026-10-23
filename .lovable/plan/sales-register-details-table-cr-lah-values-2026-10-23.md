# Sales Register Details table: Cr / LAH values

## Changes
- **Net Value** column becomes **Net Value (₹ Cr)**: each row and the totals row are shown in crores (2 decimals).
- **Invoice Value** column is hidden from the table and from the totals row.
- **Billed Qty** becomes **Billed Qty (LAH)**: shown in lakhs (2 decimals).
- **CGST, SGST, IGST** become **CGST (LAH)**, **SGST (LAH)**, **IGST (LAH)**: shown in lakhs (2 decimals).
- The Excel download uses the same headers and values, so the file matches the screen.
- Tiles, charts and search are unchanged.

## Technical details
- Add pure helpers `toCr(v) = v/1e7` and `toLah(v) = v/1e5` (2-decimal rounding) in `src/lib/sales-register.ts`, with tests for exact values (e.g. 25,000,000 → 2.50 Cr; 250,000 → 2.50 LAH).
- `sales-register-dashboard.tsx`: drop the Invoice Value column/footer cell, rename headers, format cells and footer totals with the helpers.
- `sales-register-export.ts`: remove Invoice Value from `SALES_REGISTER_EXPORT_COLUMNS`, rename headers and convert values the same way; update the existing export test.
