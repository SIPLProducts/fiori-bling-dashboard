# Inventory Aging: show today's date in the Request payload

## Why it's empty now
With "Current date" selected, the app fills in today's date only when it sends the request to SAP. It never writes the date into the saved payload, so the box shows `"P_BUDAT":""`. The request SAP receives already contains today's date.

## What changes
- With **Current date**, the Request payload box shows today's date, for example `"P_BUDAT":"20261127"`. This happens when the page opens, when you switch to Current date, and when you save.
- With **Custom date**, the box shows the date you picked, as it does now.
- On each future day the box shows that day's date. Every sync still sends the day's own date.

## Technical details
- `sap-api.tsx`:
  - In the ageing branch of `withDefaultDates`, also set `P_BUDAT` to today (IST, YYYYMMDD) when `posting_range !== "custom"`.
  - In `AgeingRequestFields`, write today when "Current date" is chosen, in place of `""`.
