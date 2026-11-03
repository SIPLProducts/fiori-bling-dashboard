# Open Purchase Order: Document Date fields in SAP API Settings

## What changes
For the **Open_Purchase_Order** endpoint only (other APIs unchanged):
- "Posting date range" becomes **Document date range** (same presets: yesterday, today, last 7 days, custom, etc.).
- "Posting From Date" becomes **Document From Date**, written to `DOCUMENT_DATE.FROM_DATE`.
- "Posting To Date" becomes **Document To Date**, written to `DOCUMENT_DATE.TO_DATE`.
- Choosing a preset fills both document dates in the payload; editing a date switches to custom.
- BUDAT_F / BUDAT_T are no longer added to this payload.
- PLANT stays as you type it (for example `1100`) and is always sent. Empty keys such as VENDOR and DELIVERY_DATE are sent unchanged.

Sync already sends DOCUMENT_DATE from the selected range, so only the settings form changes.

## Technical details
- `sap-api.tsx`: detect `form.name === "Open_Purchase_Order"`, then switch labels/hints and read/write the nested `DOCUMENT_DATE` object in the payload JSON (small helper for nested get/set), not top-level BUDAT keys.
- Add a test so that sending keeps `PLANT: "1100"` and custom DOCUMENT_DATE values 20260401–20260415.
