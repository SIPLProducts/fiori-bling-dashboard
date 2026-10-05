# Refine Open Sales Orders filters and Sales Zone chart

## Smart Filters

- Keep only these seven controls, in this order: **Date Range, Customer, Sales Zone, Sales Type, Products, Division, Document Type**.
- Remove Sales Organization, Distribution Channel, Sales Office, and Sales Group from the filter card.
- Populate every selector from the live Open Sales Orders rows.
- Display Products as **material code — product description** so similar products remain distinguishable.
- Apply every filter to all KPIs, charts, rankings, Quick View values, and detailed-table rows; preserve Reset and active-filter count.

## Clarify the Sales Zone card

- Rename the card to **Open Order Lines by Sales Zone** because each stored row is one SAP `VBELN + POSNR` order line; the current bars are line counts, not sales values.
- Add a visible horizontal-axis label **Open Order Lines**.
- Label each bar as, for example, **356 lines (29%)**, so Bangalore, Punjab, and every other zone are immediately understandable.
- Expand the tooltip to show **Sales Zone, Open Order Lines, Open Quantity, and Open Value (₹ Cr)**.
- Improve spacing and chart height for the live list of zones so labels and bars do not overlap.

## Validation

- Verify all seven filters individually and in combination against the live 1,240-row snapshot.
- Confirm Product filtering uses the selected material-code/description combination.
- Confirm zone bar labels, totals, percentages, quantities, values, Reset, empty states, and pagination all reconcile with the filtered rows.
- Check the desktop and mobile layouts, browser errors, and preview build.

## Technical details

- Extend the existing filter state with zone, sales type, product, and division values while removing the four retired filter fields.
- Aggregate zone rows once into count, quantity, and open-value measures; keep the count as the bar length and expose all measures through the tooltip.