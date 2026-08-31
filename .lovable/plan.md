# Fix token verification failing with "fetch failed"

## What the two errors mean

1. Earlier `503 / PORTAL_BACKEND_URL not configured` — the middleware reads the variable name `PORTAL_BACKEND_URL`. Your `.env` calls it `SUPABASE_URL`, so it was unset.
2. Now `401 / "stage": "token-rejected", "message": "fetch failed"` — the middleware tried to download the portal's public signing keys (JWKS) over HTTPS and the network call itself failed. I verified from here that the keys endpoint is live and returns a valid ES256 key, so the endpoint is fine: the machine running the middleware cannot make that outbound HTTPS call (proxy, firewall or DNS on the SAP network).

In both cases SAP was never contacted, which is why Postman still works — Postman talks to SAP directly and never passes through this check.

## Changes

### 1. Accept the variable name you already used
`SUPABASE_URL` (and `PORTAL_URL`) will be accepted as aliases for `PORTAL_BACKEND_URL`, so a naming mismatch can never silently disable verification again.

### 2. Fetch the signing keys once at startup, then cache
- Download and cache the keys when the service boots, with retry and a long cache lifetime, instead of depending on a live fetch during every test click.
- Startup log prints `portal token verify : keys loaded (n)` or a loud `UNREACHABLE — <reason>` line.
- Support optional `HTTPS_PROXY` / `HTTP_PROXY` env values for corporate proxies.

### 3. Distinguish "cannot reach key server" from "bad token"
A network failure will no longer be reported as `Invalid or expired token`. New stage `token-verify-unreachable` with a message naming the URL it tried and the network error code, plus HTTP 503.

### 4. New diagnostic: `GET /diag/portal`
Reports, from the middleware machine: DNS resolution, TLS connect time, HTTP status and number of keys retrieved from the portal key endpoint. Exposed in the portal as a **Check token verification** button next to Ping SAP host, so this class of failure is one click to identify.

### 5. Offline fallback for isolated servers
If the middleware host genuinely cannot reach the internet, add an optional `PORTAL_JWKS_JSON` setting: paste the public key document into `.env` and verification runs fully offline. The portal's Middleware Configuration tab will show the exact value to paste, with a copy button. Public keys only — no secret is involved.

### 6. Env checklist in the portal
Middleware Configuration gains a card that prints the exact `.env` values this portal needs (`PORTAL_BACKEND_URL`, `ALLOWED_ORIGINS`, `APP_BASE_URL`) with copy buttons, plus a pre-flight banner driven by `/health` that says which of them the running middleware is missing.

## How you will confirm SAP was really called

1. Startup shows `portal token verify : keys loaded`.
2. Click **Test connection**; the middleware log must contain a line starting `-> SAP POST http://10.10.4.18:8000/fisales_detail/report...` — only that line proves SAP was contacted.
3. `<- 200 in NNNms` plus the sample body in the Response tab confirms the round trip.
4. Stage meanings: `origin-blocked`, `token-rejected`, `token-verify-unreachable` = SAP not contacted; `sap-unreachable` = network to SAP; `sap-http-error` = SAP answered an error; `ok` = success.

## Technical notes

- `middleware/server.mjs`: env aliases, startup JWKS load with retry + cache, proxy support, `PORTAL_JWKS_JSON` fallback, new stage, `/diag/portal`, `/health` config summary.
- `src/routes/_authenticated/admin/sap-api.tsx`: env checklist card, config banner, Check token verification button, stage-aware toasts.
- `middleware/README.md` and `.env.example`: document the aliases, the offline fallback and the proxy variables.

## Security note

The SAP password and the service token in your message are now exposed in chat — rotate both and keep the replacements only in the middleware server's uncommitted `.env`.
