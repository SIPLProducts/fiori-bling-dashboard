# Sales Dashboard: hide Management link and add BSARK analysis

## 1. Hide the right-side Management Sales Dashboard action
- Remove the **Management Sales Dashboard** button shown at the upper-right of the Sales Dashboard.
- Keep the portal top bar, Sales Dashboard heading, filters, permissions, existing report routes, and all current charts unchanged.

## 2. Map BSARK into the existing `new_repl` field
- Reuse the existing `zfisales_detail.new_repl` column; do not add another database column.
- Extend every ingestion path so `new_repl` reads the existing NEW/REPL aliases first and falls back to SAP `BSARK` / `bsark`: scheduled middleware sync, manual SAP sync, and direct SAP push.
- Continue preserving the complete original SAP object in `raw`.
- Backfill only rows whose `new_repl` is blank from `raw ->> 'BSARK'`, without overwriting values already stored in `new_repl`. This unifies the currently split data into one reporting field.
- Add the equivalent self-hosted upgrade SQL for Quality and Production.

## 3. Add a dynamic BSARK chart
- Add a **Sales by BSARK** graphical card to the Sales Dashboard, positioned in the analysis area near Sales Mix and Management Alerts.
- Build categories from the data instead of hardcoding NEW and REPL, so future BSARK values appear automatically.
- Show sales amount as the primary bars and include the row count for each BSARK value in the chart details/tooltip.
- Build the chart from `new_repl`, which will contain both the existing NEW/REPL values and newly mapped BSARK values. Exclude genuinely blank values from the category bars and show their count as an **Unassigned** note.
- Apply all existing dashboard filters to the BSARK chart and refresh it through the current live-data update flow.

## 4. Preserve current save/update identity
- Keep `XBLNR` stored as **Reference / Invoice Number** and `BSCHL` stored as **Posting Key**.
- Do not change the current safe snapshot replacement logic or use XBLNR + BSCHL as a unique update key in this change.
- Continue preserving repeated SAP rows through the existing scope, snapshot, full-row hash, and occurrence-number identity.

## 5. Verification
- Add mapping tests proving BSARK fills `new_repl` as a fallback without overriding the existing NEW_REPL aliases or changing XBLNR and BSCHL mappings.
- Confirm existing rows are backfilled and NEW/REPL totals match the stored active data.
- Verify the Management Sales Dashboard action is absent and the BSARK chart responds to filters on desktop and mobile.
- Run the focused tests, type validation, and browser checks with no errors or horizontal overflow.
