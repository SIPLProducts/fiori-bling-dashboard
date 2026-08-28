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
`Authorization: Bearer <token>`. The token is verified with
`SUPABASE_JWT_SECRET`; unverified requests get 401. CORS is restricted to
`ALLOWED_ORIGINS`.

## Configuration

| Variable | Meaning |
| -------- | ------- |
| `PORT` | Local listening port (default 3008). |
| `APP_BASE_URL` | Public URL the portal uses to reach this service (ngrok / LAN / nginx path). Must match the portal's **Node.js middleware URL**. |
| `SUPABASE_JWT_SECRET` | Portal JWT verification secret for the matching environment. A placeholder makes every call return 401. |
| `ALLOWED_ORIGINS` | Comma-separated portal origins allowed to call this service. **Empty = every browser call fails with "Failed to fetch".** |
| `SAP_*_BASE_URL` / `_CLIENT` / `_USER` / `_PASSWORD` | Per-environment SAP connection and technical user. |

`ALLOWED_ORIGINS` is the site the browser loads the portal from — never this
service's own URL.

## Run locally

```bash
cd middleware
cp .env.example .env      # fill in SAP passwords + JWT secret + APP_BASE_URL
npm install
npm start                 # listens on :3008
```

Windows PowerShell:

```powershell
cd middleware
node .\server.mjs
```

Both commands load `.env` from this folder. On startup the service prints
whether the `.env` was found, the public base URL, whether the JWT secret is
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
| `HTTP 401 Invalid or expired token` | `SUPABASE_JWT_SECRET` does not match this portal environment. |
| `HTTP 500 SUPABASE_JWT_SECRET not configured` | The secret is missing from `.env`. |
| `HTTP 502 No SAP base URL configured` | The selected SAP system has no base URL. |

## Security notes

- Never commit `.env`; keep it `chmod 600` and owned by the service user.
- Keep the service on the internal network where possible; expose it only
  through the portal's nginx with TLS.
- `SUPABASE_JWT_SECRET` must match the environment (quality vs production)
  whose portal calls this instance.
- Rotate any SAP password or JWT secret that has been shared outside the
  server.
