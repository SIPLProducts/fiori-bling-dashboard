# Keep Open Sales Orders Request Date and `fkdat` synchronized

## Behavior
- Make the Request Date the single source of truth for the Open Sales Orders request.
- Whenever the date is selected, typed, cleared, or replaced, immediately rebuild the payload with `fkdat` in `YYYYMMDD` format while preserving every other payload field.
- Keep the date picker and payload aligned when the endpoint opens, including saved payloads where `fkdat` is missing or invalid.
- Keep manual/Test requests on the saved selected date and scheduled requests on the current run date.
- Leave all other SAP endpoint date controls and payload behavior unchanged.

## Reliability
- Avoid a transient screen state where the picker shows one date while the payload still contains another.
- Preserve direct payload editing: a valid manually edited `fkdat` will update the picker; invalid JSON will remain editable and show a clear validation message rather than silently replacing fields.

## Validation
- Add a focused interaction test matching the reported case: change 21-09-2026 to 05-10-2026 and confirm the visible payload changes from `20260921` to `20261005` before Save.
- Verify all unrelated payload fields remain unchanged.
- Verify Save, Test connection, manual sync, and scheduled sync receive the expected date.
- Recheck the Request tab visually and confirm a clean preview build.

## Technical details
- Consolidate picker and payload updates through one Open Sales Orders date-update helper instead of relying only on the native date input change event.
- Add regression coverage at both helper and rendered interaction levels.
