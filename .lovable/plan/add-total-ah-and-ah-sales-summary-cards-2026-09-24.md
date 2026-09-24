# Add Total AH and AH Sales summary cards

## Result

Add two summary cards directly above the Net Sales List. Both cards will follow the dashboard’s active sales-type tab, dates, Year/Quarter, Profit Centre, Segment, Customer, and search filters.

- **Total AH**: keep only filtered rows where the stored `AH` value is greater than zero, sum `AH`, and always display the result in Lakhs (`L`).
- **AH Sales**: use that same `AH > 0` row set, sum Amount in Local Currency, and always display the result in Crores (`Cr`).
- Place the cards side by side on wider screens and stack them cleanly on smaller screens.
- Zero or negative `AH` rows will contribute to neither metric.

## Technical details

- Include the existing `ah` field when loading sales rows; the current dashboard currently loads `total_ah` but not the separate stored `ah` field.
- Extend the filtered sales analytics with `positiveAhTotal` and `positiveAhSales`, calculated from the already-filtered rows.
- Use fixed unit formatters so Total AH is divided by `100,000` and AH Sales by `10,000,000`, rather than switching units automatically.
- Render both cards immediately before the Net Sales List without changing the table rows or other charts.
- Add tests covering positive, zero, and negative AH rows and confirming that only positive-AH rows affect both totals.
