# Make "Test connection" prove whether SAP was actually reached

Right now Test connection gives you one word ("Test failed: HTTP 403") and you cannot tell which of three very different things happened. Your current 403 comes from the middleware itself, before any SAP call — so no, SAP was never contacted on those attempts.

There are four possible stages, and today they all look the same:

```text
1. browser  -> middleware   blocked by CORS / bad token   -> SAP NOT called
2. middleware -> SAP        DNS / connect / timeout       -> SAP not reachable
3. middleware -> SAP        SAP answered 401/403/500      -> SAP WAS reached
4. middleware -> SAP        SAP answered 200              -> success
```

## What will be added

### 1. Stage-aware results
Every response from the middleware carries a `stage` field with one of: `origin-blocked`, `token-rejected`, `sap-unreachable`, `sap-http-error`, `ok`. The portal toast then reads, for example, "SAP was reached — it answered HTTP 401 in 340 ms" or "SAP was never contacted — connection refused to 10.10.4.18:8000".

### 2. A real request log in the middleware
Each `/sap/call` and `/sap/test` gets a short trace id and logs one line per stage to the console **and** to a rolling daily file (`middleware/logs/sap-YYYY-MM-DD.log`):

```text
[a1b2c3] -> SAP GET http://10.10.4.18:8000/fisales_detail/report?sap-client=234
[a1b2c3]    auth=basic user=SIPL_MOUNIKA password=set timeout=30000ms
[a1b2c3] <- 200 in 412ms, 18342 bytes, content-type application/json
[a1b2c3]    body[0..300]: {"d":{"results":[{...
```

Never logged: passwords, tokens, the JWT secret.

### 3. Logs visible in the portal
The endpoint's **Connectivity** tab gets a "Recent middleware activity" panel that reads a new token-protected `GET /logs/recent?limit=50` on the middleware, so you can see the SAP round trips without opening the server console. A copy button is included for sharing traces.

### 4. Diagnostics endpoint
`GET /diag/sap?system=dev` performs a bare TCP/HTTP reachability probe of the SAP base URL only (no report call) and reports resolved host, port, connect time, and error code. This answers "is the SAP host even reachable from the middleware machine" in one click, exposed as a "Ping SAP host" button next to Test connection.

### 5. Two bugs fixed on the way
- Duplicate query string: the saved path `/fisales_detail/report?sap-client=234` gets `sap-client` appended again, producing `...?sap-client=234?sap-client=234`, which is not a valid URL. The path will be parsed properly so its own query string is preserved and `sap-client` is never added twice.
- The current 403: your `.env` must list the browser origin `https://27aeaa58-eb6a-4965-897d-c1097d9ba383.lovableproject.com` in `ALLOWED_ORIGINS`, and `APP_BASE_URL` must be `https://donation-pantyhose-starter.ngrok-free.dev`. The blocked-origin response will now say exactly that in the toast instead of a bare 403.

## Technical notes

- `middleware/server.mjs`: add `withTrace()` wrapper, file logger with daily rotation and size cap, `stage` on every JSON response, `/logs/recent`, `/diag/sap`.
- `middleware/logs/` added to `.gitignore`.
- `src/lib/sap-api.functions.ts` / the SAP test caller: pass through `stage`, `sapStatus`, `durationMs`, `traceId`.
- `src/routes/_authenticated/admin/sap-api.tsx`: richer toast text, "Ping SAP host" button, "Recent middleware activity" panel in the Connectivity tab.
- `middleware/README.md`: how to read the logs and what each stage means.

Note: Test connection still only calls SAP and shows the response — it does not store anything. Persisting rows into a `sales_reports_kpi` table and the 10-minute scheduler remain separate work to do after we can see a successful SAP round trip.

Rotate the SAP password and any secret pasted into chat.
