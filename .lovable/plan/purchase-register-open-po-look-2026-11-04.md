# Purchase Register: Open PO look

## Cards
- Every chart card below the tiles (Purchase Trend, Purchase by Type, Top Materials, Top Vendors, Material Group, Material Group Summary, Monthly Expenditure, Quarterly Comparison, Plant Analytics) gets its own soft colored background, the same colors used on Open Purchase Orders.
- Each card title gets the same short colored underline, only as wide as the words.
- The tiles stay as they are.

## Filters
- The Filters bar gets the same soft blue colored background as on Open Purchase Orders.

## Unchanged
- Material Price Movers, ZRMMAT comparison and the detail table keep their current look.
- PDF and Excel contents stay the same.

## Technical
- Move the `tintBg`/`TINTS` helper from `open-po-dashboard.tsx` into a shared `src/lib/card-tints.ts` and import it in both screens.
- `purchase-register-dashboard.tsx`: `Card` takes a `tint` prop (style from TINTS, underline on `<h2>`); assign a tint to each card; apply `TINTS.neutral` to the Filters bar.

## PDF header (Purchase Register and Open Purchase Orders)
- Each PDF starts with the HBL logo, "HBL Engineering Limited" and the screen name, in the same header layout as the Sales screen PDFs.
- Pages get the same "HBL Confidential — Internal Use Only" numbered footer as those PDFs.
- The header shows only in the PDF, not on screen.

### Technical
- In both route files, render a `data-pdf-header` block (hblLogo + company + screen title) inside the export ref while `busy`, and pass `headerSelector: "[data-pdf-header]"`, `footerText` and `preserveComputedChartColors: true` to `exportDashboardPdf`, matching open-sales-orders-dashboard.
