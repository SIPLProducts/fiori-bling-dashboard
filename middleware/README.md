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

Every request must send `x-shared-secret`. The portal attaches it from its
server runtime, so the value is never exposed in browser code.

## Configuration

| Variable | Meaning |
| -------- | ------- |
| `PORT` | Local listening port (default 3008). |
| `APP_BASE_URL` | Public URL the portal uses to reach this service (ngrok / LAN / nginx path). Must match the portal's **Node.js middleware URL**. |
| `MIDDLEWARE_SHARED_SECRET` | Strong secret that exactly matches the protected Lovable Cloud secret. |
| `SAP_*_BASE_URL` / `_CLIENT` / `_USER` / `_PASSWORD` | Per-environment SAP connection and technical user. |

`APP_BASE_URL` is the public ngrok/server URL of this middleware. Browser CORS
and portal signing-key settings are not needed because calls are server-to-server.

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
whether the `.env` was found, the public base URL, whether shared-secret auth is
configured and which SAP systems have a password — values
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
| `HTTP 401 Invalid or missing x-shared-secret` | The Lovable Cloud and middleware secret values do not match. |
| Portal server could not reach middleware | The ngrok URL is wrong, offline or inaccessible. |
| `HTTP 502 No SAP base URL configured` | The selected SAP system has no base URL. |

## Security notes

- Never commit `.env`; keep it `chmod 600` and owned by the service user.
- Keep the service on the internal network where possible; expose it only
  through the portal's nginx with TLS.
- Use a long random shared secret and rotate it if it is ever disclosed.
- Rotate any SAP password or token-verification value that has been shared
  outside the server.

## Did the request actually reach SAP?

Every response carries a `stage` field, and the portal toast now names it:

| stage | meaning |
| --- | --- |
| `secret-rejected` | The shared secret is missing or does not match. **SAP was not contacted.** |
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

The last 400 lines are also served by `GET /logs/recent?limit=80` (shared secret
required) and are shown in the portal under **SAP API Settings → endpoint →
Connectivity → Recent middleware activity**.

### Is the SAP host reachable at all?

`GET /diag/sap?system=dev` performs a bare probe of the SAP base URL — no report
call — and reports host, port, status and connect time. The portal exposes it as
the **Ping SAP host** button next to Test connection.

## Automatic scheduled sync (self-hosted portal)

On Lovable-hosted deployments the schedule is fired by the cloud database. A
self-hosted portal is a static site behind Nginx, so there is no always-running
app server to receive that trigger. This service runs the scheduler instead.

Add these two settings to `middleware/.env` and restart the service:

```dotenv
SUPABASE_URL=http://127.0.0.1:8000          # local API gateway (Kong)
SUPABASE_SERVICE_ROLE_KEY=<service role key> # server-side only
```

Startup then logs `scheduler started`. If either value is missing it logs
`scheduler DISABLED` and the service behaves exactly as before.

Everything the scheduler does is read from the portal on every tick — nothing
is hard-coded:

| Read every minute from | Used for |
| --- | --- |
| `sap_endpoints.schedule_expression` | when to run (5-field cron) |
| `sap_endpoints.scheduler_enabled` / `is_active` | whether to run at all |
| `sap_endpoints.endpoint_path`, `http_method`, `query_params`, `headers`, `body_template` | the SAP request |
| `sap_systems.base_url`, `sap_client` | which SAP system and client |

SAP passwords still come only from this service's `.env`.

Each run writes a `sap_sync_runs` row (received / new / updated / skipped,
bytes, duration, HTTP status, error) and updates the endpoint's last run and
last synced stamps, so **SAP API Settings → Scheduler** shows real history. Only
the newest 6 runs per endpoint are kept. Rows are inserted or updated by
`record_key`; an empty SAP response never deletes anything.

Force one run from the server:

```bash
curl -X POST http://127.0.0.1:3002/sync/run \
  -H 'content-type: application/json' \
  -H "x-shared-secret: $MIDDLEWARE_SHARED_SECRET" \
  -d '{"endpoint":"Sales_Reports_KPI"}'
```

`GET /sync/status` reports whether the scheduler is enabled.

### Row mapping stays in one place

`sync-core.mjs` is generated from the portal's own mapping code. After changing
`src/lib/zfisales-map.ts` or `src/lib/sap-pull-shared.ts`, regenerate it:

```bash
cd middleware && npm run build:sync-core
```
