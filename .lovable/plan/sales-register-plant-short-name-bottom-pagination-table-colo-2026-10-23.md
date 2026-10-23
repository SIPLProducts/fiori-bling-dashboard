# Sales Register: plant short name, bottom pagination, table colours

Yes, DIV_NAME is already saved from SAP for every line (and used today for Product Category).

## Sales by Plant (Top 10)
- Each bar is labelled with the plant's DIV_NAME short name instead of the shortened NAME1_P text.
- The tooltip shows the plant code, the short name and the value in ₹ Cr.
- Plants still group by plant code (WERKS). If DIV_NAME is blank, the label falls back to the plant name.

## Remove Sales by Product Category
- Product Category was built from DIV_NAME, so once plants carry the DIV_NAME label it repeats the plant card. The card is removed.
- The third card row then has three cards: Distribution Channel, Daily and Tax Breakdown, spread across the full width.

## Sales Register Details table
- Pagination moves under the table at the bottom left, as on Open Sales Orders: rows-per-page choice (10/25/50), "Showing X–Y of Z", and Previous/Next.
- Search and the Excel button stay in the header.
- The table uses the same styling as Open Sales Orders: light primary header with primary-coloured headings, a "#" row number, the billing document number in primary colour, a coloured dot beside each Distribution Channel, numbers right-aligned, Posted/Pending status badges, and a totals footer row (Billed Qty, Net Value, Invoice Value, CGST, SGST, IGST).
- The Plant column shows "code — short name".

## Technical details
- `sales-register-data.ts`: put `div_name` into `descs.plantShort`. Bump the query key.
- `sales-register.ts`: byPlant rollup key = `${plant} ${plantShort || plantName}`. Add a test.
- `sales-register-dashboard.tsx`: swap the table for the shadcn `Table` components with the same classes as `open-sales-orders-dashboard.tsx`, add a page-size state and a bottom pager, and add the footer totals.
