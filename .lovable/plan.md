# Fix "503 Service Unavailable" on Test and make API testing verifiable end-to-end

## Confirmed cause

The middleware log states it plainly, on every attempt:

```text
token-rejected: PORTAL_BACKEND_URL not configured — SAP was NOT called
```

`middleware/server.mjs` refuses every `/sap/call` and `/sap/test` with HTTP 503 when `PORTAL_BACKEND_URL` is missing from its `.env`, because it cannot fetch the portal's public signing keys to verify the signed-in user's token. SAP is never contacted, so nothing reaches `10.10.4.18:8000`.

Postman works because Postman calls SAP directly with SAP basic auth — it never passes through the middleware's portal-token check. So Postman succeeding proves SAP is fine; the failure is purely middleware configuration.

## Changes

### 1. Show the exact `.env` values inside the portal

Administration → SAP API Settings → Middleware Configuration gets a **Middleware .env checklist** card that renders the exact values this specific portal needs, with a copy button:

- `PORTAL_BACKEND_URL` (the portal backend address used to verify sign-ins)
- `ALLOWED_ORIGINS` (this preview origin, the published site, the custom domain, localhost)
- `APP_BASE_URL` (the current ngrok URL)

No guessing and no values pasted in chat — the screen prints them.

### 2. Make the middleware say what is missing before a test runs

- `GET /health` returns a `config` block: whether the portal token verification, public base URL, allowed origins and each SAP system are configured (booleans only, never secrets).
- The portal reads it on the Middleware Configuration and Connectivity tabs and shows a red pre-flight banner such as "Middleware is running but token verification is not configured — SAP will not be called" instead of a bare 503.

### 3. Add a "Check middleware config" button

Next to **Test middleware** and **Test connection**: one click reports, in order — middleware reachable, origin allowed, token accepted, SAP host reachable — so the failing stage is named without reading server logs.

### 4. Make the 503 message actionable

The stage-aware toast for `token-rejected` will name the missing setting and point to the checklist card, rather than a generic service-unavailable error.

## How you will verify SAP was actually reached

After you set `PORTAL_BACKEND_URL` in `middleware/.env` and restart:

1. Middleware startup line reads `portal token verify : JWKS configured`.
2. Click **Test connection**; middleware log shows a line beginning `-> SAP POST http://10.10.4.18:8000/...` — only this proves SAP was called.
3. The response line `<- 200 in NNNms` and the sample response in the Response tab confirm data came back.
4. Stages: `origin-blocked` / `token-rejected` = SAP not contacted; `sap-unreachable` = network; `sap-http-error` = SAP answered with an error; `ok` = success.

## Technical notes

- `middleware/server.mjs`: extend `/health` with a non-secret `config` summary; refine the 503 body for the unset-verification case.
- `src/routes/_authenticated/admin/sap-api.tsx`: env checklist card, config pre-flight banner, "Check middleware config" action.
- `middleware/README.md` / `.env.example`: clarify that `PORTAL_BACKEND_URL` is the portal backend, not the portal website and not the ngrok URL.

## Security note

The SAP password and any tokens pasted into chat should be rotated and kept only in the middleware server's uncommitted `.env`.
