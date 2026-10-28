# Show today's date in the Sales Register API date window

## Why it shows 27/10/2026
On SAP API Settings, the Billing Date From/To boxes only work out new dates when you change the "Date window" dropdown. When you open the API later, the boxes still show the dates that were saved last time (27 Oct). Each sync works out its dates again on its own, so syncs today still send 28 Oct. Only the boxes on the screen are out of date.

## Change
- When an API with a preset Date window opens, fill the date boxes with dates worked out for today. Presets are Today, Last 7 days, Last 1 month, Last 6 months, Last 1 year and Financial year to date. With Financial year to date, From becomes 01/04/2026 and To becomes today.
- Custom date windows keep the dates you typed.
- Saving the API then stores today's dates.
- This applies to every API that has a date window: Sales Register, SIT, Order Book, Purchase Register and Net Sales.

## Technical details
- `src/routes/_authenticated/admin/sap-api.tsx`: when the endpoint form loads, run `postingWindow(range)` if the range is not `custom`. Write the result into the window keys the same way the dropdown's `onValueChange` already does. For "today", the `_T` key stays empty.
- Add a small test that a preset range replaces old saved dates with today's window, and a custom range keeps them.
