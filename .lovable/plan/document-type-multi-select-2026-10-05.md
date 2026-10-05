# Document Type Multi-Select

## Changes
- Replace the single-select **Document Type** control with the portal’s existing checkbox-style multi-select.
- On screen opening, preselect **ZDOR**, **ZEOR**, and **ZSOR**; leave every other available document type unchecked.
- Filter the entire Open Sales Orders dashboard using the selected document types, including tiles, charts, rankings, table, Excel, and PDF.
- Keep the other six Smart Filters as single-select controls.
- Make **Reset** restore the default three checked document types rather than selecting every type.
- Treat an empty Document Type selection as no matching rows, so unchecked types never appear implicitly.

## Verification
- Confirm the three requested types are checked on first load and other types are unchecked.
- Confirm multiple types can be checked or unchecked without closing the selector.
- Confirm dashboard totals and exports follow the selected types.
- Check the preview on desktop and mobile, then confirm tests and preview health pass.

## Technical details
- Change the document-type filter state from one string to a string array.
- Initialize and reset that array to `ZDOR`, `ZEOR`, and `ZSOR`, while safely ignoring any default type absent from the loaded options.
- Reuse the existing shared `MultiSelect` control and update active-filter counting accordingly.
