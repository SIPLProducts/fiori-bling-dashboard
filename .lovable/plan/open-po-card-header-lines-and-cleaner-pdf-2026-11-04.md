# Open PO card header lines and cleaner PDF

## Card headers
- Every chart card on Open Purchase Orders (PO Value by PO Type, Delivery Aging Status, Top 10 Vendors, Top 10 Materials, Plant Analytics, Main Group, Sub Group 1/2/3) gets a thin colored line under its title, separating the heading from the chart.
- The line matches each card's own color, so it works in Light, Dark and Glassy.

## PDF download
- The Filters box and the detail table are left out of the PDF; it shows only tiles and charts.
- They stay on screen as they are now.

## Technical
- `open-po-dashboard.tsx`: in `Card`, add `border-b pb-1 mb-2` to the header using a tint-based border color; add `data-pdf-exclude` to the Filters wrapper and to the DetailsTable root (existing chart-export excludes that selector).
