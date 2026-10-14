# Cash Flow Dashboard from ZCASH_FLOW data

Replace the sample figures with the live ZCASH_FLOW table: currently 1,536 rows, 37 plants, 136 GL codes, 21 PC groups and 19 natures.

## Screen
- **Header:** the "Sample Data" badge becomes **Last synced: dd.MM.yyyy, hh:mm IST**, taken from the latest sync. It is shown on screen only.
- **Filters:** Plant, Profit Centre, GL Code, PC Group, Classification and Nature, filled from the real values. Profit Centres and GLs show code and name. **Year and Quarter are hidden** because SAP sends no dates.
- **Tiles:**
  - Net Cash Flow is the sum of NET.
  - Total Credits is the sum of CREDIT.
  - Total Debits is the sum of DEBIT.
  - Active Plants & GLs counts the distinct values.
  - Amounts are in ₹ Cr. The sparklines and View History are hidden, since they need dates.
- **Credit vs Debit Trend:** the card stays in place with the message "Trend needs dated SAP data — not provided by ZCASH_FLOW yet". It is ready to fill in once dates arrive.
- **Cash Flow by Plant & Profit Centre** and **Nature & PC Group** use the real filtered rows.
- **Ledger:** shows real rows with names (Profit Centre name, GL name), plus search and pagination. Download Report exports all filtered rows, including Collection/Disbursement.
- **Refresh button:** data is read once and stays stable while you move between screens. Click Refresh to reload it.
- The footer reads "Data source: SAP ZCASH_FLOW".

## Technical notes
- `src/lib/cash-flow.ts`: add `mapZcashRow` to convert DB rows to `CashTransaction`, with `year`/`quarter` left empty. Keep the pure helpers. Make `cashTrend` return `[]` when rows have no date. Keep the sample generator for tests only.
- New `src/lib/cash-flow-data.ts`: query options that read every `zcash_flow` row in pages of 1,000 through the browser client. The existing read policy applies.
- `cash-flow-dashboard.tsx`: use `useQuery` with the explicit Refresh, a loading state and an empty state. Options are derived from the rows. Hide the date filters and history when no date exists.
- Update the tests for the mapper and totals. Update the AGENTS.md rule that currently says Cash Flow uses sample data.
