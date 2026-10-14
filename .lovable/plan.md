# ZCASH_FLOW request fields in SAP API Settings

## Who added ZCASH_FLOW
The ZCASH_FLOW endpoint row was saved from the SAP API Settings screen today (14-10-2026, 23:09 IST), so you added it. I added only the database table and the code that saves the response.

## Why the posting-date fields appear
Right now every new endpoint gets the Sales posting-date fields (Posting date range, BUDAT_F/BUDAT_T) by default. Open Sales Orders is the only exception.

## Changes
1. **New endpoint defaults:** a new API starts with only the **Request payload** box and an empty `{}`. There is no posting-date range and no BUDAT dates. Sales_Reports_KPI keeps its current fields.
2. **ZCASH_FLOW Request tab** (shown when the endpoint name or path is ZCASH_FLOW / zcashflown):
   - **Company Code** (required, default 1000)
   - **Fiscal Year** (required)
   - **Profit Centre**: optional. Type a code and press Enter to add it. You can add several codes and remove each one.
   - **Plant**: optional, with several values, works the same way.
   - **Posting From / Posting To**: optional date pickers. There is no range dropdown.
   - Each field stays in sync with the Request payload in both directions, using SAP's format:
```text
{ "company_code": "1000", "fiscal_year": "2026",
  "profit_center": [{ "profit_center": "COFF100001" }],
  "plant": [{ "plant": "1000" }],
  "posting_date": { "from_date": "20250101", "to_date": "20261008" } }
```
   - Empty optional fields are sent as `[]` / `{}`.
   - You can't Save or Test until Company Code and Fiscal Year are filled in.
3. **Sync behaviour:** scheduled and manual runs send the saved payload exactly as it is. ZCASH_FLOW payloads never get BUDAT_F/BUDAT_T added or rolled forward.
4. **Fix the existing ZCASH_FLOW row:** set its posting range to custom and replace its payload with the default above, with the fiscal year set to 2026.

## Technical notes
- `sap-api.tsx`: in `emptyEndpoint()`, use `body_template "{}"` and `posting_range "custom"`. Add `isZcashFlowEndpoint` checks that hide the posting-range and BUDAT fields and add a new `ZcashFlowRequestFields` component (chip input for multiple values).
- `sap-pull-shared.ts` `withEndpointDates`: return the ZCASH_FLOW payload unchanged. Add the same check to the scheduler, then rebuild sync-core. Add tests that payload values are not changed.
- No migration is needed.
