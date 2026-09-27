# Add source-backed filters to the TBN dashboard

## What will change

- Add a compact **Filters** area above the dashboard with:
  - multi-select Profit Centre
  - searchable GL Account / description
  - Balance Type: All, Debit-heavy, Credit-heavy, Zero balance
  - minimum and maximum absolute balance amount
  - Reset filters action and active-filter count
- Apply the selected filters consistently to every total, chart, alert, profit-centre table, leading GL list, and row detail.
- Keep chart clicks functional: selecting a profit centre from a chart updates the same shared filter.
- Show a clear empty state when no accounts match.

## Source-data limitation

ZTBN currently contains GL code, GL description, profit-centre debit/credit columns, and cumulative balance only. It has no posting date, month, quarter, company, or separate plant columns. Therefore:

- Date Range, Monthly, Quarterly, Company, and Plant filters will not be fabricated from labels or unrelated values.
- The filter area will state that these dimensions are unavailable in the current ZTBN source.
- They can be enabled later when those fields are added to the ZTBN import and populated by SAP.

## Technical details

- Extend the shared ZTBN aggregation filter model rather than filtering individual cards independently.
- Support multiple selected profit centres while preserving source-column debit/credit pairing.
- Parse amount inputs safely and compare against each GL account's absolute net balance.
- Keep real-time ZTBN refresh and its periodic fallback unchanged.
- Add calculation tests for combined profit-centre, balance-type, GL, and amount filters.
