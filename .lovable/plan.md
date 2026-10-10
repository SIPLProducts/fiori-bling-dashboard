# Open Orders filter order, Distribution Channel, and date modes

## Changes
- Reorder Smart Filters as **Plant → Distribution Channel → Sales Document Type → Date Range → Customer → Sales Zone → Products → Division**. Keep readable wrapping on smaller screens.
- Add a searchable, multi-select **Distribution Channel** dropdown with Select All/Deselect All, initially unrestricted. Show code and description, for example **01 — Domestic Sales**. Apply it to every report total, chart, detailed row, and download.
- Add **Distribution Channel** to the detailed table beside Sales Document Type, showing code and description. Include both in table search and Excel; preserve newest-creation-date-first ordering and matching totals.
- Display table dates as **dd.MM.yyyy**, for example **10.10.2026**, including Sales Order Creation Date and Requested Date. Use the same visible date format in Excel while preserving correct date ordering and search.
- Add a **Single / From–To** toggle beside the Date Range label:
  - Default to **From–To**, with both dates empty as now.
  - **Single** selects exactly one Sales Order Creation Date.
  - **From–To** keeps optional inclusive boundaries: From only means on/after; To only means on/before; neither means all dates.
  - Keep each mode's selections separately, applying only the active mode. Clear removes its dates; Reset clears both modes and restores From–To.
- PDF charts and totals respect the new channel filter. Keep the detailed table excluded from the existing dashboard PDF; no new PDF table or card is added in this change.

## Verified storage and mapping
- Active records already store Distribution Channel codes in `distribution_channel`, and VTEXT_DC descriptions in `sales_type` and the saved raw SAP row.
- Verified stored combinations: **01 — Domestic Sales**, **02 — Export Sales**, **03 — Deemed Export Sales**, and **04 — SEZ Sales**.
- Current saved SAP rows contain **VTWEG**, not **S_VTWEG**. Support S_VTWEG when supplied in future responses, falling back to VTWEG for the existing response format.
- Preserve existing Sales Document Type descriptions and filtering; Distribution Channel is an additional independent dropdown and column.

## Technical details
- Reuse stored channel codes and VTEXT_DC descriptions without fetching large raw rows for display or duplicating existing stored descriptions.
- Extend the shared filter helper and table-search helper for channel selection; keep null as unrestricted and an empty selection as no results.
- Extend the SAP mapper to accept S_VTWEG and lowercase aliases while retaining VTWEG compatibility. Keep hosted and self-hosted mapping behavior aligned.
- Use existing Shadcn calendar/popover and segmented-toggle controls; keep calendar wrappers interactive.
- No database schema change is required for the new dropdown and table column because both source values are already stored.

## Verification
- Test channel code/description options, combined filters, empty selections, defaults/Reset, and compatibility with S_VTWEG and VTWEG responses.
- Test exact single-date selection, independent From/To boundaries, switching modes, Clear, and Reset.
- Verify dotted dates and channel search, pagination/count/Excel reconciliation, channel-filtered PDF totals, and readable desktop/phone layouts without removing any other cards.