# Simplify SAP API testing and fetch the response

## Confirmed issue

The current portal calls the middleware directly from the browser and sends the logged-in user's access token. The middleware then tries to validate that token through public signing keys. That verification is failing before SAP is called.

The other project's simpler pattern is suitable here, with one important security requirement: the shared secret must be sent by the portal server, not exposed in browser code.

## Simple request flow

```text
Browser (signed-in admin)
  -> Portal server function
  -> Middleware with x-shared-secret
  -> SAP with Basic authentication
  -> Middleware response
  -> Portal server function
  -> Response shown in SAP API Settings
```

No edge function is needed. The app will use its existing TanStack server-function backend.

## Changes

### 1. Replace portal-token/JWKS verification

- Remove `PORTAL_BACKEND_URL`, JWKS and bearer-token verification from the middleware.
- Require `MIDDLEWARE_SHARED_SECRET` on `/sap/test`, `/sap/call`, `/diag/sap` and `/logs/recent`.
- Compare `x-shared-secret` safely and return a clear 401 when it does not match.

### 2. Keep the shared secret off the browser

- Add the same `MIDDLEWARE_SHARED_SECRET` as a protected Lovable Cloud secret.
- Add authenticated, Sharvi-Admin-only server functions for middleware health, SAP test, SAP call, ping and logs.
- Those server functions call the ngrok middleware URL and attach `x-shared-secret` server-side.
- The browser will never receive or store the secret.

### 3. Make Test connection return the actual SAP result

- **Test connection** sends the configured HTTP method, SAP path, query parameters, headers and JSON body to `/sap/call`.
- Middleware adds SAP Basic authentication and `sap-client`, calls SAP, and returns status, duration and response body.
- Show the response in the existing Response tab and show a clear result:
  - `Middleware reached — SAP returned 200`
  - `Middleware reached — SAP returned HTTP ...`
  - `Middleware reached — SAP connection failed ...`
- Testing remains non-persistent; it proves connectivity and displays data but does not write report rows.

### 4. Keep decisive logs

Middleware console/file logs will show:

```text
[trace] browser/app -> middleware accepted
[trace] -> SAP POST http://10.10.4.18:8000/fisales_detail/report?sap-client=234
[trace] <- SAP 200, duration, response size and safe preview
```

The `-> SAP` line proves SAP was called. The `<- SAP 200` line proves SAP returned data.

### 5. Use a minimal middleware `.env`

```text
PORT=3008
APP_BASE_URL=https://donation-pantyhose-starter.ngrok-free.dev
MIDDLEWARE_SHARED_SECRET=<strong generated secret>
SAP_TIMEOUT_MS=30000
SAP_DEV_BASE_URL=http://10.10.4.18:8000
SAP_DEV_CLIENT=234
SAP_DEV_USER=<SAP user>
SAP_DEV_PASSWORD=<SAP password>
```

`PORTAL_BACKEND_URL`, `SUPABASE_URL`, `SERVICE_TOKEN` and browser CORS origins are not needed for this server-to-server test flow.

## Validation

1. Start middleware and confirm secret/SAP settings report as configured without printing their values.
2. Test middleware health from the portal.
3. Click **Test connection** for Sales Reports MIS.
4. Confirm middleware logs contain `-> SAP` followed by `<- SAP 200`.
5. Confirm the SAP JSON appears in the Response tab.
6. Confirm wrong/missing shared secret returns 401 and never calls SAP.

## Security action

Rotate the SAP password and service token pasted in chat. A new strong middleware shared secret will be stored only in Lovable Cloud and the middleware server's uncommitted `.env`—never use `123456`.
