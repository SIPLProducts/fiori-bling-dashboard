# Fix: SAP API works in Lovable but fails on mis.siplproducts.com

## What is actually happening

The two sites are **not** the same. Lovable preview runs the full app (browser + server side). The published site at mis.siplproducts.com is currently serving a **frontend-only** deployment: every server-side call returns `404 Not Found`.

Verified against the live site:

```text
POST https://mis.siplproducts.com/_serverFn/<any>          -> 404 Not Found
POST https://mis.siplproducts.com/api/public/sap/pull/...  -> 404 Not Found
GET  https://mis.siplproducts.com/                         -> 200 (static page loads)
```

The SAP "Test" button runs on the server (that is where the middleware shared secret lives). On the published site that server call 404s, and the portal reports exactly what you saw:

> SAP was NOT contacted — Not Found — the portal server could not reach the middleware.

So SAP and the middleware are innocent here. The ngrok middleware itself is up and answering correctly from the public internet (checked: it replies with a proper JSON `secret-rejected` response), and its URL in Middleware Configuration is correct.

## Root cause

The project's build command is:

```text
vite build && node scripts/flatten-dist.mjs
```

`scripts/flatten-dist.mjs` was added for the on-premise Nginx static deployment. It flattens `dist/client` into `dist/` and **deletes `dist/server`**. That server bundle is exactly what serves `/_serverFn/*` and `/api/public/*`. Because the platform publish runs the same `build` script, the published deployment ships without a server — hence 404 on every server call, including the 10-minute sync endpoint `/api/public/sap/pull/zfisales`.

## Changes

1. Restore `build` to a plain `vite build` so published deployments keep the server bundle.
2. Move the static flattening into a separate script (for example `build:static`) that is used only when producing the on-prem Nginx `dist/` bundle, and note this in `deploy/README.md` and the runbook so the two build targets are not confused.
3. Re-publish, then verify on the live domain:
   - `/api/public/sap/pull/zfisales` no longer returns 404 (it should return 401 without the sync token).
   - The SAP API **Test** button returns a real stage (`ok`, `sap-http-error`, or `sap-unreachable`) instead of "Not Found".
   - The 10-minute scheduler run history starts showing real results again.

## Note on the on-prem static build

The static Nginx build cannot run server functions at all. If mis.siplproducts.com is ever switched back to the on-prem static `dist/`, SAP testing and the scheduled sync will stop working there again by design — those paths need the server-side deployment (the current Lovable-hosted one).
