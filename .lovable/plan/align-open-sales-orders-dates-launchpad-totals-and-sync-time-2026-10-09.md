# Align Open Sales Orders dates, launchpad totals, and sync times

## Dates and labels
- Rename **Order Date** to **Sales Order Creation Date** in the detailed table and Excel download. Continue using SAP **ERDAT**; no source mapping changes.
- On opening Open Sales Orders, preselect Date Range from **1 April of the current financial year through today**. On 9 October 2026, display **01.04.2026 – 09.10.2026**.
- Make Reset restore this current-FY range. Keep manual date selection and Clear available; Clear shows all dates. Do not reintroduce a Financial Year dropdown.
- Keep the existing ZDOR/ZEOR/ZSOR opening selection and other filters unchanged. Apply the selected range to all report metrics, charts, table, and downloads.

## Launchpad
- Keep Open Sales Orders launchpad totals scoped to the same current-FY creation-date window and default document types as the report opening view.
- Show **Current FY Orders**, the **open value in ₹ Cr**, the **order-line count**, and a compact **FY 2026–27 · 01.04.2026 – 09.10.2026** period caption, calculated dynamically.
- Preserve the card title, icon, and View details link. Custom report filters do not change the launchpad's current-FY summary.

## Last successful sync
- Display **Last synced: dd.MM.yyyy, hh:mm am/pm IST** on both Net Sales and Open Sales Orders report screens, and on their launchpad cards instead of relative-only update text.
- Use the actual latest successful SAP sync for each dataset, not the browser refresh time or a date-filtered row's timestamp. Confirm endpoint-to-dataset matching before implementation; show **Sync time unavailable** if no verified timestamp is accessible.
- Keep the timestamp independent of report date filters. Refresh it with the explicit report Refresh action while preserving the stable report data behavior.
- Exclude Last synced from every PDF capture; retain PDF branding, period labels, colors, and Plant-wise Pending.

## Technical details
- Reuse the shared April–March range logic for report defaults and launchpad queries, with India-local today for these views.
- Add a shared successful-sync timestamp reader/formatter for these two datasets, respecting existing access permissions. No SAP request, data mapping, or permission changes are planned.
- Keep creation-date storage and filtering on `order_date` / `ERDAT`; this is a display-label and default-period change.

## Verification
- Test 9 October 2026 → 1 April 2026–9 October 2026, January–March belonging to the previous FY, and the 1 April rollover.
- Check opening and Reset defaults, manual ranges, Clear, and unchanged document-type selection.
- Reconcile launchpad value and order-line count with the report's opening view using the same active snapshot.
- Verify successful-sync matching, explicit Refresh, unavailable-time fallback, and IST display.
- Check desktop and phone readability, Excel's renamed column, and fresh PDFs to confirm sync timestamps are absent and all existing cards remain.