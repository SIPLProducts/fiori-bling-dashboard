# Equal Sales & Distribution cards and direct report opening

## Goal
Make the Sales & Distribution section consistent with the other modules and ensure each available card opens its existing report.

## Changes
- Change the Sales & Distribution grid so Total Sales, Open Sales Orders, Fulfillment Rate, and Billing Cleared all use the same card width and height.
- Remove the special double-width treatment from Total Sales while preserving its live value and sales-mix details in a compact layout.
- Keep spacing, shadows, typography, icon treatment, and responsive stacking consistent with Financial Accounting and Production Planning.
- Make the entire active card and its Open/View action navigate to the same existing report:
  - Total Sales → Sales Dashboard
  - Open Sales Orders → Open Sales Orders report
- Keep screens without an existing report clearly marked as under development; their action continues to open the under-development panel rather than creating a new route.
- Preserve current permissions, live data, authentication, and report logic.

## Validation
- Confirm equal card dimensions across desktop, tablet, and mobile.
- Confirm Total Sales and Open Sales Orders navigate to their existing reports from both the card body and action area.
- Confirm placeholder cards still open their under-development panel.
- Check keyboard access, horizontal overflow, browser errors, and type validation.
