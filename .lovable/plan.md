# Sales Register request fields: fix duplicate From/To dates, show the Date window clearly

## The problem
The Sales Register request has two date pairs, and the Request fields section labels every date field "From date *" or "To date *":
- `fkdat_f` / `fkdat_t` (Billing Document Date)
- `erdat_f` / `erdat_t` (Billing Creation Date)

That's why "From date" and "To date" each appear twice. The **Date window** dropdown also currently drives both pairs. Picking "Last 7 days" overwrites the creation-date pair as well, but the daily sync only rolls the billing-date pair. So the screen and the actual request don't match.

## What changes
1. **Clear labels.** Each date field is named after its SAP key:
   - Billing Date From (FKDAT_F) / Billing Date To (FKDAT_T)
   - Creation Date From (ERDAT_F) / Creation Date To (ERDAT_T)
   - Posting Date From (BUDAT_F) / Posting Date To (BUDAT_T)
   - Any other key falls back to "<KEY> From" / "<KEY> To"
2. **Date window comes first.** It sits as the first field in the Request fields grid, with the label "Date window (daily sync)" and the hint "Rolls Billing Date From/To to today on every sync".
3. **The window controls one pair only.** For Sales Register that is FKDAT_F/FKDAT_T, the same pair the daily sync rolls. Other endpoints keep their current pair: the first date pair in the payload. When a preset is picked:
   - only that pair is filled and locked
   - ERDAT and other date pairs stay editable and optional (empty means not filtered)
4. **The payload box stays.** It is the raw request body and stays in sync with the fields, so the values also show there. That is expected, not a second copy.

## Technical notes
- `src/routes/_authenticated/admin/sap-api.tsx` → `PayloadRequestFields`:
  - new `dateLabel(key)` helper for the labels above
  - `windowKeys` = `fkdat_f`/`fkdat_t` when present, otherwise the first `_F`/`_T` date pair
  - the preset `onValueChange` writes only `windowKeys`
  - `disabled={rolling && windowKeys.includes(f.key)}`
- No change to the sync logic: `withSalesRegisterMode` already rolls only FKDAT_F/FKDAT_T.
- Add a test in `tests/sap-endpoint-dates.test.ts`: on a scheduled sync with "Last 7 days" on 23-10-2026, Sales Register sends `fkdat_f=20261016`, `fkdat_t=20261023` and `MODE=DAILY`, and leaves ERDAT unchanged.
