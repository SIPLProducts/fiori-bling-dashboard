# Fix middleware HTTP 500 before SAP connection

## Confirmed issue

The screenshot message exactly matches the middleware branch that returns HTTP 500 when `SUPABASE_JWT_SECRET` is missing. This happens inside portal-token verification, before `/sap/call` invokes SAP. Therefore these requests did **not** reach SAP.

A placeholder such as `123456` is not a solution: it changes the result to an invalid-token 401. Lovable Cloud does not expose the legacy JWT verification secret, so the current shared-secret verification method is unsuitable.

## Changes

### 1. Replace legacy shared-secret verification

- Verify portal access tokens against the backend's public signing keys (JWKS) instead of `SUPABASE_JWT_SECRET`.
- Validate signature, issuer, audience, and expiry before allowing an SAP request.
- Keep every authentication failure stage-aware and explicitly report that SAP was not contacted.
- Add the Worker-compatible `jose` package to the standalone middleware.

### 2. Make configuration unambiguous

- Replace the obsolete secret setting in `middleware/.env.example` with the portal/backend URL required to locate its public signing keys.
- Validate this setting at startup and print only safe configured/not-configured diagnostics.
- Keep `APP_BASE_URL` as the ngrok/public middleware URL and `ALLOWED_ORIGINS` as the portal browser origins; neither is the backend URL.
- Update the middleware README with the exact three-URL distinction and Windows startup steps from the top-level `middleware` folder.

### 3. Improve failure reporting

- Prevent token-configuration failures from appearing as an unexplained generic 500.
- Preserve trace IDs and stages in the portal toast and recent-activity panel.
- Confirm the displayed endpoint URL does not duplicate `sap-client` when the saved path already contains it.

## Validation

1. Start the top-level middleware and confirm `.env: loaded`, public URL configured, portal origin allowed, and JWKS verification configured.
2. Test `/health` from the signed-in portal and confirm token verification succeeds.
3. Use **Ping SAP host** to confirm whether the middleware machine can reach the SAP host.
4. Click **Test** and confirm the logs contain a trace line beginning `-> SAP`; only this proves SAP was called.
5. Verify SAP HTTP errors are shown as `sap-http-error`, network failures as `sap-unreachable`, and successful responses as `ok`.

## Security action

Rotate the SAP password and any token-verification value previously pasted into chat. Keep replacement credentials only in the middleware server's uncommitted `.env`.
