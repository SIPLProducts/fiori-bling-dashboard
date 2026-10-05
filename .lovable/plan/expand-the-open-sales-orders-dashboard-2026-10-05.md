# Expand the Open Sales Orders dashboard

## Smart Filters

- Add **Sales Document Type** to Smart Filters with values **ZDOR**, **ZEOR**, and **ZSOR**.
- Apply this filter, together with the existing six filters, to every KPI, chart, Quick View item, ranking, and detailed-table row.
- Keep Reset, active-filter count, and responsive expand/collapse behavior working.

## New document-type card

- Add **Open Orders by Document Type** immediately to the left of **Open Orders by Aging Bucket**.
- Match the first reference with a donut showing the filtered total in its centre and an adjacent breakdown table.
- Show each document type’s order count, open value, and percentage; use the SAP codes ZDOR, ZEOR, and ZSOR rather than the reference’s example document codes.
- Reflow the existing aging, value, and sales-zone charts into a balanced responsive layout without removing them.

## New analysis cards

- Add separate **Top 10 Open Orders by Customer** and **Top 10 Open Orders by Product** cards.
- Add **Open Orders by Model Wise** as another ranked card.
- Use compact horizontal bar charts, ranked by total open value, with labels and tooltips for open value, open quantity, and order count.
- Make all three cards respond to the complete Smart Filters selection and handle empty results cleanly.

## Detailed view

- Add **Open Sales Orders – Detailed View (Aging Bucket)** below the cards, matching the second reference’s dense Fiori-style table.
- Include: row number, Order No., Customer, Document Type, Sales Zone, Division, Product, Order Date, Requested Date, Days Open, Open Qty, Delivered Qty, Open Value, and Status.
- Derive status consistently as **Open** or **Partially Delivered**, render compact status badges, and add pagination so the full filtered result remains usable.
- Keep the table horizontally scrollable on narrow screens and preserve complete values rather than truncating important identifiers.

## Data and validation

- Extend the current replaceable sample records with document type, model, and division values; continue using delivery date as the requested date until the dedicated live SAP table is connected.
- Preserve the current route, permissions, summary cards, delivery-status cards, and Quick View.
- Verify document-type filtering, combined filters, Top 10 ranking, table pagination, Reset, empty results, desktop/mobile overflow, browser errors, focused tests, and a clean preview build.
