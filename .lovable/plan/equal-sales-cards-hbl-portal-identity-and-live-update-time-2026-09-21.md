# Equal Sales cards, HBL portal identity, and live update time

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

## Top bar
- Replace the temporary SAP badge with the existing HBL logo.
- Rename “SAP ENTERPRISE PORTAL” to “HBL MIS PORTAL”.
- Remove “Connected to PRD-01 (S/4HANA)” and its separator entirely.

## Sales update time
- Replace the fixed “Updated 5 mins ago” text on Total Sales with the actual latest completed sync time for the `Sales_Reports_KPI` API.
- Read the latest matching successful sync run and use its completion time; do not use an unrelated SAP endpoint’s run.
- Display the result as a concise relative time such as “Updated 3 mins ago”, with the exact date and time available as accessible detail.
- Show a neutral “Update time unavailable” state when no completed `Sales_Reports_KPI` run exists.
- Refresh this timestamp with the existing launchpad query cycle so it changes dynamically after later API syncs.

## Validation
- Confirm equal card dimensions across desktop, tablet, and mobile.
- Confirm Total Sales and Open Sales Orders navigate to their existing reports from both the card body and action area.
- Confirm placeholder cards still open their under-development panel.
- Confirm the HBL logo and “HBL MIS PORTAL” appear without the PRD connection text.
- Confirm the displayed update time matches the latest completed `Sales_Reports_KPI` run and ignores other endpoint runs.
- Check keyboard access, horizontal overflow, browser errors, and type validation.
