# Fix SAP middleware connectivity and request defaults

## Confirmed causes

- The middleware currently converts an empty `ALLOWED_ORIGINS` value into `origin: false`, so browser calls from the MIS portal are blocked and surface as **Failed to fetch**.
- The current `node server.mjs` command does not explicitly load `deploy/middleware/.env`; the listening message only confirms that the default port was used, not that SAP or authentication settings were loaded.
- New endpoint defaults already generate `BUDAT_T = today` and `BUDAT_F = today - 7 days`, but an existing saved endpoint keeps its older payload dates.
- The payload loader already merges parsed JSON values into the Headers rows, but only after **Load payload** is clicked and the resulting rows are farther down the Request tab.

## Changes

### 1. Make middleware startup and diagnostics reliable

- Load the middleware `.env` explicitly when the service starts, including when launched with `node server.mjs`.
- Validate required startup settings and print safe configuration diagnostics (configured/not configured only; never print credentials).
- Return a clear configuration error if no allowed portal origin is configured instead of silently disabling browser access.
- Improve request logging and browser-facing error details so CORS, token verification, and SAP connection failures can be distinguished.
- Update the middleware example/docs with the exact Windows start command and valid comma-separated portal origins.

### 2. Correct middleware browser access

Configure `ALLOWED_ORIGINS` with the actual portal origins, including the active preview, published site, and custom domain as applicable. Keep the ngrok URL as the middleware URL, not as an allowed portal origin.

The token-verification value must be the real backend JWT verification secret for the matching environment; a placeholder such as `123456` cannot validate signed-in portal tokens. No credential will be committed or displayed by the app.

### 3. Enforce posting-date defaults

- For a new endpoint, keep **Posting To Date** as the user’s current local date and **Posting From Date** as exactly seven calendar days earlier.
- When an existing endpoint has missing or invalid `BUDAT_F` / `BUDAT_T`, initialize those fields with the same defaults without overwriting valid saved dates.
- Continue displaying dates as `DD-MM-YYYY` through the native date control and serialize both values as `YYYYMMDD` in the payload and matching Header rows.

### 4. Make payload-to-Headers behavior immediate and visible

- Parse pasted or uploaded JSON and create/update one Header row per top-level payload key (`BUKRS`, `BUDAT_F`, `BUDAT_T`, `PRCTR`, `WERKS`, etc.).
- Keep `BUDAT_F` and `BUDAT_T` synchronized across the date pickers, request body, and Header rows.
- Move the generated Headers section directly below the payload loader and show a clear loaded-field count so the result is visible without searching farther down the form.
- Keep invalid JSON non-destructive and show an inline validation message.

## Validation

- Start the middleware using its `.env` and verify `/health` through the configured public middleware URL from an allowed portal origin.
- Confirm the middleware test reports a specific HTTP/authentication result instead of generic **Failed to fetch**.
- Create a new endpoint and verify today / today-minus-seven-days defaults.
- Load the supplied sample payload and verify five Header rows are created and the date pickers show the payload dates.
- Change either date and verify the payload and matching Header row update to `YYYYMMDD`.
- Save, reopen, and test the endpoint to confirm values persist and are forwarded to middleware.

## Security action

The SAP password and token-verification value were pasted into chat. Rotate both before using this configuration in Quality or Production, and keep the replacements only in the middleware server’s uncommitted `.env`.

## Addendum: middleware public base URL

The middleware `.env` only defines `PORT`, which controls the local listening socket. It does not describe how the portal reaches the service. Add an explicit public base URL setting (`APP_BASE_URL`) to the middleware environment and startup output:

- `APP_BASE_URL` is the externally reachable address of this middleware — for example the ngrok HTTPS URL, `http://10.200.1.5:3008`, or `https://mis.siplproducts.com/sap-middleware`.
- It is used for startup diagnostics and for the health response, so the value configured in the portal's **Node.js middleware URL** field can be confirmed against what the service itself believes it is serving.
- `ALLOWED_ORIGINS` stays separate: it lists the portal origins allowed to call this service, not the middleware's own URL.
- Startup logs will print the listening port and the configured public base URL together, so a mismatch between them and the portal setting is immediately visible.

## Addendum: middleware moves to a top-level folder

The middleware currently sits under `deploy/middleware/`, which makes it easy to miss. Move it to a top-level `middleware/` folder at the project root, alongside `src/`, so it is visible as a first-class part of the project:

```text
middleware/
  server.mjs
  package.json
  .env.example
  Dockerfile
  README.md
```

- All files move as-is; only the location changes, plus the new startup/`APP_BASE_URL` improvements described above.
- References to the old path in the deployment docs, Docker Compose files, and Nginx notes are updated to `middleware/`.
- The real `.env` stays on the middleware server and is never committed.
- Run commands become `cd middleware`, `npm install`, `npm start`.
