# Fix: SAP Test button fails on the Quality server (405 Not Allowed)

## Why it fails

The Test button calls a server function (`POST /_serverFn/...`). The Quality site is the **static build** (`npm run build:static`) — plain files behind Nginx with no app server. Nginx cannot accept a POST to a static path, so it answers **405 Not Allowed**, and the portal reports "the portal server could not reach the middleware, so SAP was not contacted".

Confirmed in `src/lib/sap-api.functions.ts`: Test connection, middleware health/logs, ping and endpoint sync all route through `createServerFn` handlers (`callMiddlewareServer`, `runEndpointSyncServer`) that only exist in the hosted build.

## Already done on your server (no further action needed)

- Middleware now listens on `:3002`, matching the Nginx upstream.
- The `/sap-mw/` bridge is in place and injects `x-shared-secret` server-side, so the secret never reaches the browser.
- `/health` calls through the bridge are already reaching the middleware ("portal -> middleware accepted" in the PM2 log).

What is missing is the app-side change: the portal must call `/sap-mw/...` when it runs as a static build instead of calling a server function.

## Changes

### 1. Expose the static-build flag to browser code

`vite.config.ts` already computes `isStaticBuild` from `STATIC_BUILD=1`. Pass it through to the client as `import.meta.env.VITE_STATIC_BUILD` so the app can tell which deployment it is running in. The hosted Lovable build is unaffected.

### 2. Route middleware calls through the bridge in static builds

In `src/lib/sap-api.functions.ts`, `callMiddleware` gets a static-build branch: `fetch('/sap-mw' + path, ...)` on the same origin, with the same response parsing, stages and error messages as today. Hosted builds keep using the server function unchanged. This fixes:

- Middleware health test
- SAP system Test connection
- SAP host ping
- Recent middleware activity log

### 3. Make endpoint Test / sync work without a server

`runEndpointSyncServer` currently does call → parse → batched upsert on the server. For static builds add a browser-side equivalent:

- Move the pure endpoint/table-mapping and row-building logic out of `src/lib/sap-pull.server.ts` into a client-safe `src/lib/sap-pull-shared.ts`; the server file keeps working by importing it.
- Static path: `POST /sap-mw/sap/call` with the endpoint's method, path, query, headers and body, parse the JSON, batch-upsert into the mapped table with the browser client, and record the run in `sap_sync_runs`. Same result shape, so the Response tab, card badges and Scheduler history behave identically.

### 4. Docs

Note the `/sap-mw/` bridge and the port matrix in `deploy/README.md` and the deployment runbook so future rebuilds keep both in sync.

## After the change — what you do on the server

```bash
npm run build:static          # on the build machine
# copy dist/ to /opt/MIS_Projects/Quality/frontend/dist
```

No Nginx or middleware change needed; your current config already matches.

## Validation

1. `bunx tsgo --noEmit` passes.
2. Hosted preview still tests successfully through server functions (no regression).
3. On Quality: Test connection returns a real stage (`ok`, `sap-http-error`, or `sap-unreachable`), Recent middleware activity shows `-> SAP` then `<- SAP 200`, and the sync writes rows into `zfisales_detail`.

## One limitation to be aware of

The 10-minute automatic scheduler runs server-side on the hosted site. On the static Quality deployment it can only run while the SAP API screen is open, or via an external cron calling the middleware directly. That is a property of the static build and is unchanged by this fix.
