# Order Book request fields: optional filters in one row

## Change
In SAP API Settings, open the Order Book API's Request tab. Put **Order Type From, Order Type To, Plant From and Plant To** side by side in a single row of four equal columns.
- The first row is unchanged: Created date window, Created From, Created To.
- On narrow screens the four fields wrap to 2 columns, then 1 column, so they stay readable.
- The payload, field values and sync behavior do not change.

## Technical details
In `src/routes/_authenticated/admin/sap-api.tsx`, in `OrderBookRequestFields`:
- Keep the date-window and Created From/To fields in the existing 3-column grid.
- Move the four optional inputs into a separate `grid gap-4 sm:grid-cols-2 lg:grid-cols-4` wrapper.
- Remove the empty spacer `<div />`.
