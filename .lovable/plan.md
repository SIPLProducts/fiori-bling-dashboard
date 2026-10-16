# Make Main Group / Sub Group charts reconcile with Production data

## What the Excel shows
- Production file: 5,326 lines, 2,371 orders, total Open Value **4,500.91 Cr**.
- Main Group chart in Production adds up to only **868.48 Cr** (811.62 + 44.80 + 7.17 + 4.89). The same gap is in the Sub Group chart.
- So about **3,632 Cr (~81%)** of open value has an empty Main Group / Sub Group in Production and is silently left out of the charts. The bars that are shown are already in highest-value-first order.
- The Excel export has no Main Group / Sub Group columns, so this cannot be confirmed line by line from the file yet.

## Changes
1. **Show unassigned value instead of dropping it**: lines with an empty Main Group (or Sub Group) are counted in an "Unassigned" bar, so the bars always add up to the filtered total. Bars stay in highest-to-lowest value order; Unassigned is placed last.
2. **Top values**: the screen shows the top 10 groups by value (unchanged); the PDF keeps all groups.
3. **Add Main Group, Sub Group and Profit Centre Name columns** to the detailed table's Excel export, so you can check which lines are empty.
4. **Production check script** `deploy/open-orders-groups/check-groups.sql`: shows how many active lines have an empty `MNGRP1` / `PCGRP1` in the stored SAP row versus the stored columns.
   - If the SAP row has values but the columns are empty, the script's update section fills them in (same backfill as before). That means a Production sync issue on our side.
   - If the SAP row itself is empty, SAP is not sending the group for those lines (a response issue for the SAP team).

## Technical details
- `src/lib/open-orders-groups.ts`: optional `includeUnassigned` path mapping blank keys to "Unassigned", sorted last; test in `tests/open-orders-groups.test.ts` asserting group totals equal row totals.
- `src/lib/open-sales-orders-export.ts`: add three columns.
- New deploy SQL with diagnostic SELECTs plus an optional backfill + `NOTIFY pgrst, 'reload schema'`.
