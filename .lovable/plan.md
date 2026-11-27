# Inventory Aging: key date picker, range dropdown and daily morning sync

## What changes (SAP API Settings, Inventory_Aging, Request tab)
- **Remove these text boxes:** P_BUDAT, P2_BKT1, P2_BKT2 and P2_BKT3. The buckets are still sent as fixed values: "0090", "0180" and "0365".
- **Add a "Key date" dropdown** with two options:
  - **Current date** (default): P_BUDAT is today's date on every sync.
  - **Custom date**: P_BUDAT is the date you pick.
- **Add a date picker** beside the dropdown. With Current date, it shows today and is greyed out. With Custom date, you can choose any date, and it's sent as YYYYMMDD.
- **Scheduled runs:** they always use today's date, whatever the dropdown says. The Sync button and Test connection follow the dropdown.
- **Daily morning sync:** Inventory_Aging syncs automatically every day at **07:00 IST**, set on the Scheduler tab. You can change the time there.

## Technical details
- `sap-api.tsx`:
  - When `isAgeing`, render a dedicated `AgeingRequestFields` (Select with today/custom, plus a date input) instead of `PayloadRequestFields`.
  - Store the mode in `posting_range` ("today" / "custom") and the custom date in the payload's `P_BUDAT`.
  - Write P2_BKT1-3 defaults into the payload.
- `withSoAgeingDate` (TS and `sync-core.mjs`):
  - Scheduled runs, or range ≠ custom, or an invalid date: P_BUDAT is today (IST).
  - Otherwise: P_BUDAT is the saved date.
  - Update the tests to match.
- Update the AGENTS.md rule to match.
- Set the endpoint's schedule to `IST:07:00` with an enabled flag on the sap_endpoints row, using the existing schedule fields.
- Self-hosted: copy `sync-core.mjs`, then `pm2 restart MIS_QTY`.
