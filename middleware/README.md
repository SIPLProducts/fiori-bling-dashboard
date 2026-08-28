# MIS SAP Middleware

Small Node.js service that sits between the MIS portal (static SPA) and SAP.
It exists so SAP credentials never reach the browser: they live only in this
service's `.env`.

This folder lives at the project root (`middleware/`), next to `src/`.

## Endpoints

| Method | Path         | Purpose |
| ------ | ------------ | ------- |
| GET    | `/health`    | Version, uptime, public base URL, allowed origins and which SAP systems have credentials configured. |
| POST   | `/sap/test`  | Resolves a system + path and performs a GET against SAP; returns status and timing. |
| POST   | `/sap/call`  | Generic proxy — method, path, query, headers, body. Adds basic auth and `sap-client`. |

Every request must send the signed-in portal user's access token as
`Authorization: Bearer <token>`. The token is verified against the portal
backend's public signing keys (JWKS); unverified requests get 401. CORS is
restricted to `ALLOWED_ORIGINS`.

## Configuration

| Variable | Meaning |
| -------- | ------- |
| `PORT` | Local listening port (default 3008). |
| `APP_BASE_URL` | Public URL the portal uses to reach this service (ngrok / LAN / nginx path). Must match the portal's **Node.js middleware URL**. |
| `PORTAL_BACKEND_URL` | Portal backend URL used only to retrieve public token-signing keys (JWKS). No private JWT secret is required. |
| `ALLOWED_ORIGINS` | Comma-separated portal origins allowed to call this service. **Empty = every browser call fails with "Failed to fetch".** |
| `SAP_*_BASE_URL` / `_CLIENT` / `_USER` / `_PASSWORD` | Per-environment SAP connection and technical user. |

The three URL settings have different purposes:

- `APP_BASE_URL`: the public ngrok/server URL of this middleware.
- `ALLOWED_ORIGINS`: the browser origins where the portal is loaded.
- `PORTAL_BACKEND_URL`: the portal backend URL used to verify signed-in users.

## Run locally

```bash
cd middleware
cp .env.example .env      # fill in SAP passwords and all three URL settings
npm install
npm start                 # listens on :3008
```

Windows PowerShell:

```powershell
cd middleware
node .\server.mjs
```

Both commands load `.env` from this folder. On startup the service prints
whether the `.env` was found, the public base URL, whether JWKS verification is
configured, the allowed origins and which SAP systems have a password — values
themselves are never printed.

## Run with Docker

```bash
cd middleware
docker build -t mis-sap-middleware .
docker run -d --name mis-sap-middleware --env-file .env -p 3008:3008 --restart unless-stopped mis-sap-middleware
```

## Nginx (optional public path)

```nginx
location /sap-middleware/ {
    proxy_pass         http://127.0.0.1:3008/;
    proxy_set_header   Host $host;
    proxy_set_header   X-Real-IP $remote_addr;
    proxy_read_timeout 60s;
}
```

## Wiring it to the portal

1. Sign in as Sharvi Admin and open **Administration → SAP API Settings**.
2. **Middleware Configuration** — set the middleware URL to the same value as
   `APP_BASE_URL` and press **Test middleware**.
3. **SAP Systems** — set base URL, client and technical username per
   environment.
4. **APIs** — register endpoints with a relative path (they inherit the active
   system's base URL) and press **Test connection**.

## Troubleshooting

| Portal message | Cause |
| -------------- | ----- |
| `Failed to fetch` | The service is unreachable at the configured URL, or the portal origin is not in `ALLOWED_ORIGINS`. |
| `HTTP 403 Origin not allowed` | Add the portal origin to `ALLOWED_ORIGINS` and restart. |
| `HTTP 401 Invalid or expired token` | The bearer token is expired, malformed, or was issued by a different portal backend. |
| `HTTP 503 Portal token verification not configured` | Set `PORTAL_BACKEND_URL` in `.env` and restart. SAP was not contacted. |
| `HTTP 502 No SAP base URL configured` | The selected SAP system has no base URL. |

## Security notes

- Never commit `.env`; keep it `chmod 600` and owned by the service user.
- Keep the service on the internal network where possible; expose it only
  through the portal's nginx with TLS.
- `PORTAL_BACKEND_URL` must identify the backend for the portal environment
  whose users call this middleware.
- Rotate any SAP password or token-verification value that has been shared
  outside the server.

## Did the request actually reach SAP?

Every response carries a `stage` field, and the portal toast now names it:

| stage | meaning |
| --- | --- |
| `origin-blocked` | The browser origin is not in `ALLOWED_ORIGINS`. **SAP was not contacted.** |
| `token-rejected` | Missing/invalid portal token, or `PORTAL_BACKEND_URL` not set. **SAP was not contacted.** |
| `sap-unreachable` | DNS/connect/timeout to the SAP host. **SAP was not contacted.** |
| `sap-http-error` | SAP answered, with a non-2xx status. **SAP was reached.** |
| `ok` | SAP answered 2xx. |

### Logs

Each SAP round trip gets a short trace id and is written to the console *and* to
`middleware/logs/sap-YYYY-MM-DD.log` (rotated at 5 MB, git-ignored):

```text
[a1b2c3] -> SAP GET http://10.10.4.18:8000/fisales_detail/report?sap-client=234
[a1b2c3]    system=dev auth=basic user=SIPL_MOUNIKA password=set timeout=30000ms
[a1b2c3] <- 200 in 412ms, 18342 bytes, content-type application/json
[a1b2c3]    body[0..300]: {"d":{"results":[{...
```

`xx` instead of `<-` means the request never got an answer from SAP.
Passwords and tokens are never logged.

The last 400 lines are also served by `GET /logs/recent?limit=80` (bearer token
required) and are shown in the portal under **SAP API Settings → endpoint →
Connectivity → Recent middleware activity**.

### Is the SAP host reachable at all?

`GET /diag/sap?system=dev` performs a bare probe of the SAP base URL — no report
call — and reports host, port, status and connect time. The portal exposes it as
the **Ping SAP host** button next to Test connection.
