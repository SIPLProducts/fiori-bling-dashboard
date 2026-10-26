# SIT: "Current date" sync option + SIT wording

## 1. SAP API Settings — "Current date" in the date window dropdown
- Add a **Current date** option to the Date window (daily sync) dropdown, shown for the Sales In Transit (SIT) API.
- When picked, the Request payload preview immediately shows `FKDAT_F` = today (YYYYMMDD); `FKDAT_T` is removed (not sent).
- Every morning's scheduled run recalculates it, so `FKDAT_F` is always that day's date.
- Make **Current date** the saved choice for the SIT API (existing SIT setting is switched to it).
- Other options (Last 7 days, 1 month, etc., Custom) keep working as today.

## 2. SIT screen wording (SIT only — Open Orders / Order Book unchanged)
- "Order Value" (cards, charts, tooltips, table, Excel) -> **SIT Value**
- "SIT Orders" tile -> **SIT Invoices**
- Tooltips: "orders" -> **SIT Invoices**; "order" wording referring to a sales invoice -> **Sales Invoice**
- "SIT Count" / "Count" -> **SIT Invoice**
- Table and Excel column "Order No." -> **SIT Invoice No.**
- Chart titles like "Orders by ..." -> "SIT Invoices by ..." where they appear on SIT

## 3. Sales Document Type descriptions on SIT
- Wherever SIT shows the document type description (dropdown, card, table, Excel), replace the word **Sales** with **SIT**: "Domestic Sales" -> **Domestic SIT**, "Export Sales" -> **Export SIT**, "Deemed Export Sales" -> **Deemed Export SIT**, etc. Codes (ZDOR...) unchanged. Descriptions without "Sales" shown as-is.

## Technical details
- `src/lib/sap-pull-shared.ts`: add `{ value: "today", label: "Current date" }` to `POSTING_RANGES`; `postingWindow("today")` returns from = to = today; `withSitDates` with `today` sets FKDAT_F = today and deletes FKDAT_T.
- `src/routes/_authenticated/admin/sap-api.tsx`: payload preview recomputes via the same helper on dropdown change.
- Data update: set SIT endpoint `posting_range = 'today'` (also appended to deploy SQL).
- `open-sales-orders-dashboard.tsx` + chart/tooltip/table/export helpers: `isSit` label branches; pure `sitDocTypeLabel(desc)` (regex `\bSales\b` -> `SIT`) used by dropdown, card, table and Excel.
- Tests: `postingWindow("today")`, `withSitDates` today payload, `sitDocTypeLabel("Export Sales") === "Export SIT"`.
- Files to deploy: `sap-pull-shared.ts`, `sap-api.tsx`, `open-sales-orders-dashboard.tsx` and related SIT chart/export files, middleware sync bundle (rebuilt for the new option).
