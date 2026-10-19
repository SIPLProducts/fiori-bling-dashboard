# Order Book fetch failed: SAP error, not too much data

## What the log shows
- The request did reach SAP. SAP answered **HTTP 500, "Application Server Error"**, after **391 ms**, with a 9.7 KB HTML error page.
- A response that was too large would take many seconds or minutes, or end in a timeout. A 391 ms reply means SAP failed right away, inside its own program. Usually that is a short dump (ST22) caused by the request payload: a wrong date format, a missing or extra field, or a bad field name.
- The portal message is misleading. It says both "SAP was not contacted" and "SAP was reached". SAP was reached.

## Steps
1. **Find the real SAP error.** Ask the SAP team to check ST22 (short dumps) and SICF/SMICM logs at the time of the call. Compare the payload we send (shown in the Request tab) with the PDF: field names ERDAT_F/ERDAT_T as YYYYMMDD, VKORG, AUART_F/T, WERKS_F/T, SPART_F/T, VTWEG_F/T, VBELN_F/T. Then send the same payload from Postman.
2. **Fix the payload** to whatever SAP expects (for example, the date format or leaving out empty optional fields), if the dump points to one.
3. **Fix the message.** If SAP returns an HTTP error, show "SAP returned HTTP 500 (Application Server Error), not a size problem", without the "tunnel/not contacted" text. Also show the error title from SAP's HTML page.
4. **Size safeguard.** If the dump does turn out to be memory or time (TSV_TNEW_PAGE_ALLOC_FAILED / TIME_OUT), let a scheduled run split the Created From/To window into monthly pieces.

## Technical details
- `src/lib/sap-pull.server.ts` / `sap-api.functions.ts`: when `sapStatus` is present, classify the error as `sap-http-error` and stop using the tunnel 502 wording. Pull the `<title>`/`<h1>` from the HTML body.
- Optional: chunk the ERDAT window in `withEndpointDates` for Order Book endpoints.
