# Fix: SAP Test button fails on Quality server (405 Not Allowed)

## Why it fails — two separate problems, both on the server side

**1. The Test button needs a server the static build does not have (the 405).**

The Test button calls a server function (`POST /_serverFn/...`). Quality serves the static SPA build (`npm run build:static`) — plain files behind Nginx, no app server. Nginx cannot answer POST to a static path, so it returns **405 Not Allowed** and the portal reports "the portal server could not reach the middleware, so SAP was not contacted". This affects every server-side feature on the on-prem deployment: Test connection, middleware health/logs, and the manual/scheduled sync.

Verified: `src/lib/sap-api.functions.ts` routes Test through `callMiddlewareServer` / `runEndpointSyncServer` (`createServerFn`), which only exist in the hosted build.

**2. The middleware is listening on the wrong port.**

PM2 logs show:

```text
[mis-sap-middleware] v1.2.0 listening on :3000
```

but the Quality Nginx config proxies `/middleware/` to `127.0.0.1:3002` (approved port matrix). So even Nginx-proxied middleware calls would fail with 502 until `PORT=3002` is set in `/opt/MIS_Projects/Quality/middleware/.env` and PM2 is restarted.

## Changes

### 1. Give the static build a same-origin middleware bridge (secret stays on the server)

Add to both `deploy/nginx/mis-quality.conf` and `deploy/nginx/mis-production.conf`:

```text
location /sap-mw/ {
    proxy_pass http://mis_q_middleware/;        # mis_p_middleware in production
    proxy_set_header x-shared-secret "<quality-shared-secret>";
    proxy_read_timeout 600s;
    proxy_send_timeout 600s;
}
```

The browser calls `/sap-mw/...` on the same origin; Nginx injects the shared secret, so it is never shipped in browser code. The secret lives only in the Nginx config on the server (root-readable only).

### 2. Teach the app to use the bridge when running as a static build

- `vite.config.ts`: expose the existing `STATIC_BUILD` flag to client code via `define` (`import.meta.env.VITE_STATIC_BUILD`).
- `src/lib/sap-api.functions.ts`: in static builds, `callMiddleware` posts directly to `/sap-mw<path>` instead of the server function. Hosted (Lovable) behaviour is unchanged.
- Test connection, middleware health, ping and logs then work on Quality through the same screens.

### 3. Make endpoint Test / sync work in static builds

`runEndpointSyncServer` currently does pull → parse → batched upsert on the server. For static builds add a browser-side equivalent:

- Extract the pure endpoint/table-mapping logic out of `src/lib/sap-pull.server.ts` into a client-safe `src/lib/sap-pull-shared.ts` (both imports keep working).
- New client path: call `/sap-mw/sap/call`, parse JSON, batch-upsert into the mapped table with the browser Supabase client (admin RLS already allows it), and record the run in `sap_sync_runs` — same result shape, so the UI, Response tab and Scheduler history work unchanged.

### 4. Fix the middleware port on Quality (manual step on the server)

```bash
cd /opt/MIS_Projects/Quality/middleware
# set PORT=3002 in .env (matrix: Quality middleware = 3002, Production = 3010)
pm2 restart mis-q-middleware
pm2 logs mis-q-middleware   # should show "listening on :3002"
```

Also update the two Nginx configs on the server and `sudo nginx -t && sudo systemctl reload nginx`.

### 5. Docs

Update `deploy/README.md` and the deployment runbook: document the `/sap-mw/` bridge, the port matrix requirement, and that on-prem static deployments use it for all middleware calls.

## Validation

1. `bunx tsgo --noEmit` passes.
2. Hosted preview still passes Test via server functions (regression check).
3. `npm run build:static` output includes the static-mode code path.
4. On Quality after redeploy + Nginx reload + port fix: Test connection returns a real stage (`ok`, `sap-http-error`, or `sap-unreachable`), Recent middleware activity shows `-> SAP` / `<- SAP 200`, and the sync writes rows into `zfisales_detail`.

## Note

The 10-minute scheduler on the hosted site runs server-side; on the static Quality deployment it can only run while the SAP API screen is open (browser-driven), or via an external cron hitting the middleware directly. That limitation of the static build is unchanged by this fix.
