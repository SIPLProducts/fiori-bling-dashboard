# Sales Register: fix missing bars/colours and match other screens

## Problem
On the Sales Register screen, Sales by Plant, Top 10 Customers, Distribution Channel, Daily, Tax Breakdown and Product Category draw no bars or donut colours. Only the labels show, and they pile up on each other. The Main Group and Sub Group cards look fine.

## What changes
1. **Sales by Plant (Top 10)**: upright coloured columns like "Plant-wise SIT" (screenshot 2). Each column has its own radiant colour, the value in ₹ Cr above it, and the plant short name below. The full plant code and name show on hover.
2. **Top 10 Customers**: a list like screenshot 3. Customer name on the left, a teal bar in the middle, and the amount in ₹ Cr on the right. Long names are shortened with "…" and the full name shows on hover.
3. **Sales by Product Category (Top 10)**: the same list style as Top 10 Customers.
4. **Distribution Channel**: donut slices in visible radiant colours, with the total in the centre.
5. **Daily** and **Tax Breakdown**: the Invoice Value bars and the CGST/SGST/IGST/TCS stacks become visible in colour.
6. **Launchpad Sales Register card**: shows the total value and one bar per sales document type, labelled "code — description" (AUART + VTEXT_DC, for example "ZDOR — Domestic Sales"), with the line count and value. It matches the SIT and Open Orders cards, including the last-synced time and Open Details.
7. **Details table**: a new **Distribution Channel** column ("ZDOR — Domestic Sales"). The table gets the same coloured header, row striping, coloured status badges and bottom pagination as the Order Book and SIT tables.
8. **Excel button** in the table header downloads every Sales Register column the screen holds, plus Distribution Channel, for the current filters. The file is named "Sales Register_DD-MM-YYYY.xlsx".
9. Totals, filters and the PDF stay as they are.

## Technical
- Root cause: the gradient stops use `color-mix(... var(--chart-n) ...)` inside SVG `stopColor`. SVG presentation attributes do not resolve CSS variables or `color-mix`, so these fills come out empty. The Main Group and Sub Group charts use a different component, so they are not affected.
- Fix: build the gradients with `style={{ stopColor: c, stopOpacity }}`. The `style` property does resolve CSS variables. Drop `color-mix` from the gradient stops.
- Plant: a vertical `BarChart` with a gradient `Cell` per column and a top `LabelList`, styled like the Plant-wise SIT chart.
- Customers and Category: a small `RankList` component made of HTML rows with a width-percentage bar (`bg-primary` gradient), so it needs no SVG.
- Launchpad: the Sales Register tile reuses `open-sales-orders-launch-card` grouping, reads `sales_register` (auart, vtext_dc, netwr_t) and shares the screen's refresh-only query.
- Table: add a `channelLabel` column. Excel goes through the existing xlsx helper with `datedFileName("Sales Register","xlsx")`.
- Add `roadmap.md` entries for these tasks, and a test for the channel label and the export column list.
- Verify with Playwright on `/reports/sd/dispatches` and on the launchpad after the change.
