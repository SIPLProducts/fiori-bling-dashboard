# Use P_VALUE1 for Open Value

## Requested change
- Replace **B_VALUE** with SAP **P_VALUE1** for every Open Value amount: summary tiles, launchpad, charts (including LD Status), rankings, detailed table, Excel and PDF.
- Store P_VALUE1 as the original numeric rupee amount; divide by **10,000,000** only for Crore display. Do not multiply by quantity or fall back to B_VALUE, KWERT_INR or NETWR. Missing or invalid P_VALUE1 produces zero.
- Preserve B_VALUE, KWERT_INR, exact LD_STATUS text and complete raw SAP rows. Keep layouts, filters, counts, dates and sync schedules unchanged.

## Existing records and deployment
- Backfill the new stored amount from each record’s saved raw P_VALUE1 and update the Open Value compatibility mirror. Do not delete records or automatically run SAP sync.
- Provide a matching timestamped migration and installation instructions for Quality/Production. Rows containing valid raw P_VALUE1 will not require a fresh sync; rows without it need a subsequent SAP response containing the field.
- Deploy the updated application and rebuilt middleware synchronization bundle to Quality/Production, then restart their existing middleware and reload the report.

## Technical details
- Add a numeric `p_value1` column through an additive migration, with normalization matching the shared SAP mapper (commas, decimals and trailing minus).
- Update the mapper to persist P_VALUE1 / p_value1 and mirror it to `open_value`; retain the other monetary columns independently.
- Switch report and launchpad reads to `p_value1`, and version both query keys so cached B_VALUE amounts cannot remain after navigation.
- Apply the connected database migration and mirror it for self-hosted deployment. Update source documentation and the saved monetary-source requirement during implementation.

## Validation
- Test P_VALUE1 as the sole source using differing B_VALUE/KWERT_INR/NETWR values; test zero, missing, invalid, decimal, comma and trailing-minus inputs, without quantity scaling.
- Confirm raw fields and exact Y/N status are unchanged.
- Check stored totals against the report, launchpad and Excel, and download a fresh PDF to verify the new values and unchanged colors/layout.
- Quality/Production totals require verification on those installations after deployment; the connected preview does not establish their state.
