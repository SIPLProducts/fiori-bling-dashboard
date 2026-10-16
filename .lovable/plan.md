# Main Group / Sub Group sums and complete Excel columns

## What the Production Excel shows
- 5,326 lines, 2,371 orders, total Open Value **4,500.91 Cr**.
- The Main Group chart in Production adds up to only **868.48 Cr** (811.62 + 44.80 + 7.17 + 4.89). The Sub Group chart has the same gap.
- About **3,632 Cr** has an empty Main Group / Sub Group in Production, so the charts leave it out.
- The Excel file has no Main Group, Sub Group or Profit Centre Name columns, so you can't check this line by line yet.

## Changes
1. **Each bar is the summed Open Value of every line in that group.** This applies to both the Main Group and the Sub Group chart. Lines with an empty group go into an "Unassigned" bar, so the bars add up to the filtered total. Bars are sorted from highest value to lowest, with Unassigned last. The screen shows the top 10 and the PDF shows all groups.
2. **Excel export includes every stored column.** New columns: **Profit Centre Name, Main Group, Sub Group**, placed next to Profit Centre. The detailed table search covers them too.
3. **Production check script** `deploy/open-orders-groups/check-groups.sql`:
   - It counts the active lines whose stored group is empty, and checks whether SAP's own row (MNGRP1 / PCGRP1) has a value for them.
   - If SAP sent a value, an update section fills in the stored columns. That would be a sync problem on our side.
   - If SAP's row is empty, SAP is not sending the group for those lines.

## Technical details
- `src/lib/open-orders-groups.ts`: blank keys map to "Unassigned", sorted last; the value is the sum per group. A test asserts that the group sums equal the row totals.
- `src/lib/open-sales-orders-export.ts` + table row mapping: add `profitCentreName`, `mainGroup`, `subGroup`.
- New deploy SQL with diagnostic SELECTs, an optional backfill from raw, and `NOTIFY pgrst, 'reload schema'`.
