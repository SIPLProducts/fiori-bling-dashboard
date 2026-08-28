# SAP API endpoint: posting-date pickers + payload auto-fill

Changes to the endpoint detail view in **Administration → SAP API Settings**.

## 1. Remove the Credentials tab

SAP username and password are already maintained per system in the **SAP Systems** tab
(stored encrypted, used by the middleware when the API is called). The endpoint's
Credentials tab is redundant and is removed. The system's technical user stays visible
in the Connectivity tab so it is clear which credentials an endpoint will use.

## 2. Request tab: posting date range

New **Posting date** row with two date pickers:

- **Posting From Date** maps to `BUDAT_F`
- **Posting To Date** maps to `BUDAT_T`

Defaults on a new endpoint: To Date = today, From Date = today minus 7 days
(e.g. today 28-08-2026 gives `BUDAT_F = 20250821`-style value `20260821`,
`BUDAT_T = 20260828`). Dates are displayed as DD-MM-YYYY and always sent as
`YYYYMMDD` strings, matching the payload sample.

## 3. Request payload box with auto-fill

A **Payload** editor (paste JSON, or pick a `.json` file) sits above the fields:

```text
{
  "BUKRS": "1000",
  "BUDAT_F": "20250831",
  "BUDAT_T": "20250831",
  "PRCTR": "PGNLB12001",
  "WERKS": "1200"
}
```

On load:

- Every key/value in the payload is written into the endpoint's **Headers** rows,
  replacing an existing row with the same key and adding the rest — so nothing has to
  be typed by hand when the payload already carries the value.
- `BUDAT_F` / `BUDAT_T` also drive the two date pickers.
- Invalid JSON shows an inline error and changes nothing.

Editing the date pickers afterwards keeps the payload and the `BUDAT_F` / `BUDAT_T`
header rows in sync, so the values actually sent match what is on screen. The payload
is saved with the endpoint and sent as the request body on Test connection and on
scheduled/real calls.

## Technical notes

- `src/routes/_authenticated/admin/sap-api.tsx`: drop the `credentials` tab, add a
  `PayloadLoader` (textarea + file input) and two `<input type="date">` fields in the
  Request tab; helpers `toSapDate`/`fromSapDate` convert between `YYYY-MM-DD` and
  `YYYYMMDD`.
- Storage reuses existing columns — the payload lives in `sap_endpoints.body_template`,
  the derived keys in `sap_endpoints.headers`. No migration needed.
- `src/lib/sap-api.functions.ts`: `testSapEndpoint` already forwards `body_template`
  and headers to the middleware; defaults for `BUDAT_F`/`BUDAT_T` are applied when the
  endpoint form is initialised so new endpoints start with the last 7 days.
