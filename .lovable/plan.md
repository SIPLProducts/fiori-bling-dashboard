# Sales Dashboard: hide Management link and add BSARK analysis

## 1. Hide the right-side Management Sales Dashboard action
- Remove the **Management Sales Dashboard** button shown at the upper-right of the Sales Dashboard.
- Keep the portal top bar, Sales Dashboard heading, filters, permissions, existing report routes, and all current charts unchanged.

## 2. Store BSARK as its own sales field
- Add a dedicated `bsark` column to `zfisales_detail` rather than mixing it with the existing `new_repl` field.
- Map SAP `BSARK` / `bsark` into that column in every ingestion path: scheduled middleware sync, manual SAP sync, and direct SAP push.
- Continue preserving the complete original SAP object in `raw`.
- Backfill existing rows from `raw ->> 'BSARK'` so the chart works immediately after deployment. Current active data contains dynamic BSARK values including **NEW** and **REPL**, plus rows where BSARK is blank.
- Add the equivalent self-hosted upgrade SQL for Quality and Production.

## 3. Add a dynamic BSARK chart
- Add a **Sales by BSARK** graphical card to the Sales Dashboard, positioned in the analysis area near Sales Mix and Management Alerts.
- Build categories from the data instead of hardcoding NEW and REPL, so future BSARK values appear automatically.
- Show sales amount as the primary bars and include the row count for each BSARK value in the chart details/tooltip.
- Exclude blank BSARK values from the category bars and show their count as an **Unassigned** note, preventing blank data from overwhelming NEW/REPL.
- Apply all existing dashboard filters to the BSARK chart and refresh it through the current live-data update flow.

## 4. Preserve current save/update identity
- Keep `XBLNR` stored as **Reference / Invoice Number** and `BSCHL` stored as **Posting Key**.
- Do not change the current safe snapshot replacement logic or use XBLNR + BSCHL as a unique update key in this change.
- Continue preserving repeated SAP rows through the existing scope, snapshot, full-row hash, and occurrence-number identity.

## 5. Verification
- Add mapping tests proving BSARK is saved without changing `new_repl`, XBLNR, or BSCHL mappings.
- Confirm existing rows are backfilled and NEW/REPL totals match the stored active data.
- Verify the Management Sales Dashboard action is absent and the BSARK chart responds to filters on desktop and mobile.
- Run the focused tests, type validation, and browser checks with no errors or horizontal overflow.
