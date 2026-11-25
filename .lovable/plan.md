# Rename Sales Register to Dispatches, and new Net Sales card rows

## 1. Sales Register becomes "Dispatches"
Everywhere users see it:
- Menu, launchpad tile, screen title, browser tab title, "access denied" text, the Sync button label.
- Trend card ("Sales Register (Monthly)" becomes "Dispatches (Monthly)").
- PDF and Excel file names become "Dispatches_DD-MM-YYYY", and the Excel sheet name becomes "Dispatches".

Not changed: the SAP API name in SAP API Settings and the permission keys. Users' existing access stays the same.

## 2. Net Sales screen layout

```text
Row A: Top 10 Customers | QTR 1 | QTR 2 | QTR 3 | QTR 4
Row B: Segment | Customer Contribution | Sales Mix | Sales Trend
Row C: Top 10 Materials | Top 10 Sales Men | Top 10 Industry Name | Top 10 Profit Centres
```

- **Top 10 Profit Centres** moves to the Materials row, making 4 cards.
- **Sales Trend** moves to the Segment row, making 4 cards.
- **Quarter cards** sit beside Top 10 Customers. Each one lists the top 10 customers by Net Sales for that quarter of the April–March financial year (QTR 1 = Apr–Jun, QTR 2 = Jul–Sep, QTR 3 = Oct–Dec, QTR 4 = Jan–Mar).
  - They are dynamic: only quarters that have data under the current filters appear, so a selection covering Apr–Aug shows QTR 1 and QTR 2 only.
  - When the selection spans more than one financial year, cards are labelled with the year, for example "QTR 1 FY26".
  - They use the same bar style and ₹ Cr values as Top 10 Customers. Clicking a customer opens the same drill-down.
- The PDF keeps these rows, with cards paired as today so nothing is cut off.

## Technical details
- Rename: update user-facing strings in `screens.ts`, `sd-reports.ts`, `dispatches.tsx` (head, ReportShell, AccessDenied, SyncNowButton label, `datedFileName`), `sales-register-dashboard.tsx`, `sales-register-export.ts`, `open-sales-orders-launch-card.tsx` and the load-error message. Keep `sd.dispatches`, the `Sales _Register` endpoint name and table names.
- Net Sales (`sd-live-dashboard.tsx`): new pure helper `topCustomersByQuarter(rows)` in a small lib file, grouping by `fiscalQuarter`/`fiscalYearForDate` and returning ordered `{ label, items }` (top 10 by net value). Unit-test the grouping, ordering, labels and dynamic omission.
- Re-arrange the panels into the three rows above (Row A `lg:grid-cols-5`, Rows B/C `lg:grid-cols-4`), keeping existing `data-pdf-page-block` grouping.
