# Simplify the SAP endpoint Request tab to a single payload box

## What the app does today (verified)

- The payload is **not hardcoded**. The scheduled 10‑minute pull and the Test connection both send the endpoint's saved **Request payload** (`sap_endpoints.body_template`) plus its header rows, exactly as stored.
- New endpoints are seeded with `BUDAT_F = today − 7 days` and `BUDAT_T = today`, and the two date pickers write straight into the payload, so whatever posting dates are on screen and saved are what get sent.
- There are currently two payload areas: **Load API payload** (paste/upload, which also copies every key into Headers rows) and **Request payload** (the actual body). This duplication is what causes confusion, and the stray `BUDAT_F` Headers row in your screenshot came from the auto‑copy.

## Changes

1. Remove the **Load API payload** box and its "That is not a valid JSON object" state.
2. Keep a single **Request payload** editor as the one source of truth for the body.
3. Move the file picker directly under the Request payload editor: choosing a `.json` file replaces the payload text with the uploaded content (pretty‑printed). Invalid JSON shows an inline message and changes nothing.
4. Stop auto‑creating Headers rows from payload keys. Headers stay a manual list, and the leftover auto‑generated `BUDAT_F` row is no longer produced. Headers you add yourself are untouched.
5. Keep the two posting‑date pickers wired to the payload only: editing a date rewrites `BUDAT_F` / `BUDAT_T` inside the Request payload (`YYYYMMDD`), and editing those keys in the payload updates the pickers. All other payload keys (`BUKRS`, `PRCTR`, `WERKS`, …) are left exactly as you type them.

## Technical notes

- File: `src/routes/_authenticated/admin/sap-api.tsx` — delete the `PayloadLoader` block, drop `mergeHeaders` from the payload/date sync path, add the file input beneath the `body_template` textarea.
- No database, sync, or middleware changes: `src/lib/sap-pull.server.ts` already forwards the saved `body_template` verbatim.

## Verification

- Open Sales_Reports_KPI → Request: one payload box, file picker under it, no Load API payload section, no auto `BUDAT_F` header row.
- Change Posting From/To → payload dates update; Save, reopen, values persist.
- Upload a JSON file → payload box shows it; Test connection sends that exact body.
