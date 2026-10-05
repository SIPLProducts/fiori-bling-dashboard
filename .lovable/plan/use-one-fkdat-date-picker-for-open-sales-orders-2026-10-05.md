# Use one `fkdat` date picker for Open Sales Orders

## Request screen
- Detect the **Open_Sales_Orders** endpoint and remove its **Posting date range**, **Posting From Date**, and **Posting To Date** controls.
- Show one editable **Request Date** picker, defaulted to the current local date when `fkdat` is missing or invalid.
- Keep the other SAP endpoints unchanged with their existing posting-range and From/To controls.
- When the Request Date changes, immediately update the payload field `fkdat` in `YYYYMMDD` format; for example, 05-10-2026 becomes `"fkdat": "20261005"`.
- Update the Request payload guidance for this endpoint so it names `fkdat` rather than `BUDAT_F` / `BUDAT_T`.

## Request execution
- For **Test connection** and manually initiated Open Sales Orders syncs, send the selected and saved `fkdat` value.
- For scheduled Open Sales Orders syncs, replace `fkdat` at run time with that day’s current local date, as requested.
- Keep all Net Sales and other endpoint date behavior unchanged.
- Ensure the hosted and self-hosted middleware paths use the same endpoint-specific date rules.

## Validation
- Test that editing the picker updates only `fkdat` in the payload and preserves all other payload fields.
- Test invalid or missing `fkdat` defaults to the current date.
- Test manual/Test requests retain the selected date, while scheduled requests use the current run date.
- Verify the Open Sales Orders Request tab visually and confirm the other endpoint screens are unchanged.
- Run the focused tests and confirm a clean preview build.
