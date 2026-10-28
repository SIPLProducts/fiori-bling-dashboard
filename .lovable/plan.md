## Sales Register: remove TCS from Tax Breakdown

- The Tax Breakdown card shows only CGST, SGST and IGST; the TCS bar and its legend entry are removed (screen and PDF).
- Nothing else changes.

### Technical
- `sales-register-dashboard.tsx` line 127–129: drop `tcs` from the mapped data and from the bar list.
