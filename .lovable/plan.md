# Open Sales Orders dates, summary tiles, and detail ordering

## Requested changes
1. **No default date restriction:** Open the report with From and To empty. Reset also clears both dates while restoring the existing document-type and other filter defaults.
2. **Optional From and To:** Provide separately selectable From and To dates within Smart Filters:
   - Neither selected: no date restriction.
   - From only: Sales Order Creation Date on or after From.
   - To only: Sales Order Creation Date on or before To.
   - Both selected: include dates between From and To, including both endpoints.
   - Prevent an end date earlier than the start date. Keep Clear available without changing other filters.
3. **Hide Open Quantity:** Remove only the Open Quantity summary tile from the screen and PDF. Arrange the remaining three tiles neatly. Keep quantity columns, totals, charts, and Excel data unchanged; retain every other card.
4. **Newest creation dates first:** Keep the existing Sales Order Creation Date column in the detailed table and sort all matching rows by that date descending before pagination. Missing or invalid dates appear last, with consistent order-number/line-item ordering for same-date records. Excel follows the same sorted matching dataset.

## Scope
- Date selections apply consistently to report totals, charts, detailed rows, PDF, and Excel.
- Preserve document-type defaults (ZDOR, ZEOR, ZSOR), other filters, table search/status, explicit Refresh, and PDF color/sync-time safeguards.
- Leave launchpad current-financial-year totals and captions unchanged; this request changes the report's opening date restriction only.
- No SAP mapping, stored data, or scheduled-sync changes.

## Technical details
- Replace the report's automatic current-FY date initialization and Reset dates with empty optional boundaries.
- Use existing Shadcn calendar/popover controls for independent From/To selection, keeping calendar wrappers interactive with `pointer-events-auto`.
- Count either selected date boundary as an active date filter.
- Add a pure creation-date sorting helper and apply it to the shared table/Excel dataset before pagination, without mutating cached report records.
- Update the focused date-filter and table-order tests, and revise project requirements to reflect these approved changes.

## Verification
- Test unrestricted opening/Reset, inclusive From-only, To-only, and two-boundary filtering, Clear, and invalid ranges.
- Test descending dates across multiple pages, same-date ordering, and missing/invalid dates last.
- Check three-tile layouts at desktop and narrow widths, unchanged quantity data, matching Excel order, and PDF without Open Quantity or sync metadata.