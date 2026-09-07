# Net Sales screen: title and date-picker spacing

## 1. Rename page title from "SD — Net Sales" to "Net Sales"

In `src/routes/_authenticated/reports/module.$module.tsx` the live SD report title is built as `${def.code} — ${def.title}` ("SD — Net Sales"). Change it so the SD live report simply shows **"Net Sales"**, matching the module title.

## 2. Reduce space after the calendar icon in Posting from / Posting to inputs

In `src/components/sd-live-dashboard.tsx`, the Smart Filter card has two `Input type="date"` fields (Posting from / Posting to). The browser’s built-in calendar icon leaves extra trailing space inside the input. Tighten the right padding on both date inputs so the icon sits closer to the right edge.

## Implementation
- `module.$module.tsx`: for the live SD branch, pass `title="Net Sales"` directly instead of the `${code} — ${title}` helper.
- `sd-live-dashboard.tsx`: add a small right-padding override (e.g. `pr-1`) to both posting-date `Input` fields.

## Verification
- Navigate to **Net Sales** (`/reports/module/sd`).
- Confirm the page title reads **"Net Sales"** (no "SD —" prefix) in the shell header and browser tab.
- Confirm the calendar icon in the **Posting from** and **Posting to** inputs no longer has excess space after it.