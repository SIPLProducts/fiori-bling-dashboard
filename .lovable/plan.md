# Update the Sales Dashboard title, layout, Profit Centre mapping, and period filters

## Title and layout

- Rename the **Management Sales Dashboard** heading on **Sales & Distribution → Total Sales** to **Sales Dashboard**.
- Keep the existing **Executive Overview** subtitle.
- Arrange one three-card row in this order:
  1. **Sales by Segment (Amount)**
  2. **Customer Contribution (Pareto)**
  3. **Sales Mix by Type**
- Remove the old Sales Mix placement from the lower analysis row so the card appears once.
- Keep each card’s current chart, data, and full-screen action unchanged; stack the cards in the same order on smaller screens.

## Profit Centre dropdown

- Map SAP field **ABTEI** into the existing Profit Centre display field during every SAP sales sync.
- Backfill existing sales rows from their preserved SAP data so the new dropdown works without waiting for a full resync.
- Populate and filter the Profit Centre dropdown by the mapped ABTEI value.
- Keep the Profit Centre code and long description available for charts, tables, drill-downs, and internal grouping where they are already used.
- Add the matching database upgrade script for Quality and Production, and rebuild the shared middleware sync bundle so future manual and scheduled syncs use the same mapping.

## Year and Quarter filters

- Add **Year** and **Quarter** dropdowns to the expanded Smart Filters area.
- Populate Year from all distinct SAP fiscal-year values available in the loaded sales data.
- Provide **All quarters**, **Q1**, **Q2**, **Q3**, and **Q4**; keep Quarter disabled until a Year is selected.
- Derive quarters from the posting month while restricting rows to the selected SAP fiscal year:
  - Q1: January–March
  - Q2: April–June
  - Q3: July–September
  - Q4: October–December
- Apply Year and Quarter to the complete dashboard dataset before calculating KPIs, charts, alerts, and the detailed table.
- Combine these selections with the existing date, sales-type, Profit Centre, segment, customer, plant, and search filters.
- Show active Year and Quarter chips, include them in Reset, and clear Quarter automatically when Year is cleared or changed.
- Pass the effective Year/Quarter restriction into customer and month drill-downs so their detail rows match the dashboard selection.

## Verification

- Confirm the heading reads **Sales Dashboard** and the subtitle remains unchanged.
- Confirm Sales Mix is immediately right of Customer Contribution on desktop and appears once.
- Confirm the Profit Centre dropdown displays ABTEI values from both existing and newly synchronized rows.
- Confirm every available SAP fiscal year appears, each quarter filters the whole dashboard correctly, and all filters compose correctly.
- Check desktop and mobile layouts, Reset behavior, drill-down totals, and a middleware mapping test for ABTEI.
