# Open Sales Orders dashboard matching the reference

## Result

Clicking **Open Sales Orders** in the Sales & Distribution section opens a dedicated dashboard that closely matches the supplied reference image. The page uses sample data for now and is structured so the real SAP API can replace it later.

The existing Net Sales dashboard remains unchanged.

## Page design

- Add a dedicated **Open Sales Orders** page with the subtitle from the reference.
- Keep the existing portal header and navigation, but omit the reference image’s right-side search, notification, settings, and profile controls.
- Reproduce the compact Fiori-style layout, spacing, white panels, blue accents, and dense executive reporting presentation.
- Make the layout adapt cleanly from wide desktop grids to stacked tablet and mobile sections.

## Filters and summary cards

- Add working sample-data filters for date range, sales organization, distribution channel, sales office, customer, and sales group.
- Add the six reference summary cards:
  - Total Open Sales Orders
  - Open Order Value
  - Open Quantity
  - Avg. Order Value
  - Avg. Days in Open
  - OTD (On-Time Delivery)
- Include the matching coloured icons, month comparison indicators, and small trend lines.

## Charts and reports

Recreate the reference sections using sample order records:

- Open Sales Order Trend with **Value / Quantity / Both** control
- Open Orders by Sales Zone donut chart
- Open Orders by Sales Type donut chart
- Open Order Value by Profit Center horizontal bars
- Open Orders by Main Group vertical bars
- Open Orders by Customer (Top 5) table
- Open Orders by Product Category horizontal bars
- Open Sales Orders detailed table with pagination
- Key Insights, Alerts, and Recommendation panel

All totals, charts, tables, and insights respond to the selected filters so the sample page behaves like the eventual live dashboard.

## Launchpad behaviour

- Change only the **Open Sales Orders** tile destination to the new page.
- Keep the other Sales & Distribution tiles and their current destinations unchanged.
- Preserve the existing screen-permission check used for the Sales & Distribution module.

## Technical details

- Add a new authenticated route for the Open Sales Orders dashboard with its own page metadata.
- Build a focused dashboard component and a typed sample-data module rather than placing all UI in the route.
- Use the project’s existing semantic colours, buttons, panels, typography, icons, and chart library.
- Keep data access behind a replaceable data function so the future SAP API can be connected without redesigning the page.
- Verify the tile click, filters, chart mode, pagination, desktop layout, and mobile layout in the running preview.

## Not included yet

- No SAP API, database, sync, migration, or backend changes.
- The figures are representative sample values until the API details are provided.
