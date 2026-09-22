# Diagnose the Quality SAP HTTP 500

## Confirmed current state

- The earlier authentication problem is resolved: SAP no longer returns HTTP 401.
- Quality middleware starts as version `1.8.0`, loads its `.env`, sees the Quality password, and applies the Quality-only insecure TLS setting.
- The request now reaches the intended Quality HTTPS SAP service and SAP responds in about 65 ms with **HTTP 500 Application Server Error** and an HTML page instead of JSON.
- Because SAP produced this response, the portal, middleware password loading, database connection, and certificate bypass are not the current failure.
- The browser reports HTTP 502 because `POST /sync/run` deliberately converts every failed synchronization into a gateway error. Its JSON correctly preserves `httpStatus: 500`, which is SAP's actual response. The 502 is therefore a wrapper status, not a second failure.
- The direct `curl` test was cancelled with `Ctrl+C`, so it did not produce an independent result.

## Most likely failure area

SAP accepted the connection far enough to run the application endpoint, but the `/fisales_detail/report` handler failed while processing this request or payload. The exact SAP-side cause cannot be determined from the first 300 HTML characters currently logged.

The latest middleware payload includes:

```json
{"BUKRS":"1000","BUDAT_F":"20260101","BUDAT_T":"20260901","PRCTR":"PGNLB12001","WERKS":""}
```

This is different from the cancelled direct test, where both `PRCTR` and `WERKS` were blank. That difference should be tested before changing application code.

## Checks

1. **Capture SAP's full error reference safely**
   - Repeat the direct request without piping to `head` and save only the returned HTML to a temporary server file.
   - Extract the SAP error/trace/reference ID and timestamp; do not print credentials.
   - Give that reference to the SAP/Basis team so they can inspect the matching application-server log and ABAP exception.

2. **Isolate the payload field causing the failure**
   - Run the request once with `PRCTR` and `WERKS` blank.
   - If that succeeds, retry with only `PRCTR=PGNLB12001` added.
   - If it fails only after adding `PRCTR`, verify that this profit-centre value is valid for company `1000` and the selected date range.
   - If the blank request also returns 500, SAP must fix the endpoint independently of the portal payload.

3. **Check the requested date window**
   - Test a small known-good period first, then expand it.
   - The current request spans January through September 2026; a short successful request would distinguish SAP processing/data-volume failure from authentication or transport failure.

4. **Verify through the portal after SAP succeeds**
   - Run Test on `Sales_Reports_KPI`.
   - Confirm the response is JSON and rows are parsed.
   - Run one manual sync and verify received/stored counts before relying on the scheduler.

## No code/configuration change yet

Do not change the Quality password, TLS setting, middleware URL, or database settings now. They are working. Do not repeatedly restart both Quality and Production; restart only `mis-q-middleware` when its files or environment actually change.

The Node.js 20 deprecation warning is unrelated to this HTTP 500. Plan a Node.js 22 upgrade separately; it is not the immediate fix.

## Security requirement

Rotate the SAP password, middleware shared secret, and database service credential already exposed in chat. Update their matching Quality locations without posting the replacement values.
