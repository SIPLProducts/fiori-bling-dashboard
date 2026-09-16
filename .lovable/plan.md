# Fix SAP payload persistence and complete HTTP/HTTPS setup

## Confirmed causes

- The payload shown contains `// LGVRD16001`. JSON does not allow comments, so the payload parser rejects the whole object.
- When that invalid saved payload is reopened, the current date-default logic starts from an empty object and rebuilds only `BUDAT_F` and `BUDAT_T`. This is why `BUKRS`, `PRCTR`, and `WERKS` disappear from the screen.
- The Quality middleware `.env` has no `SAP_*_CA_CERT_PATH`. HTTP needs no certificate setting, but the private/self-signed HTTPS SAP address needs its CA certificate path.
- Middleware HTTPS support is already implemented in `middleware/server.mjs` and depends on `undici` from `middleware/package.json`.

## Changes

1. **Never replace an invalid payload**
   - Keep the complete payload text unchanged when reopening an endpoint, even if it is temporarily invalid.
   - Do not let date-picker or posting-range changes replace an invalid payload with a dates-only object.

2. **Validate before saving or testing**
   - Show an inline error below Request payload when it is not a valid JSON object.
   - Block Save and Test connection until the JSON is valid.
   - State clearly that JSON comments such as `// ...` are not allowed.
   - Preserve all valid fields (`BUKRS`, `PRCTR`, `WERKS`, and any future keys) while updating only `BUDAT_F` and `BUDAT_T`.

3. **Cover the regression**
   - Add focused tests proving that valid payload fields survive reopen/date updates and invalid payloads are preserved rather than reduced to two fields.

4. **Clarify and verify HTTP/HTTPS configuration**
   - Keep SAP Base URL, client, and username in **SAP Systems**; blank values may use middleware fallbacks.
   - Keep the SAP password and optional private CA certificate path only in `middleware/.env`.
   - The CA variable follows the saved system key. If the endpoint selects key `dev`, use `SAP_DEV_CA_CERT_PATH` even when that row’s display environment is QUALITY.
   - HTTP and publicly trusted HTTPS require no CA path. Private/self-signed HTTPS requires the matching `SAP_<KEY>_CA_CERT_PATH`.
   - Surface the middleware’s safe “custom CA configured/not configured” status in SAP Systems without exposing certificate contents.

## Server files to deploy

Copy these updated middleware files to `/opt/MIS_Projects/Quality/middleware/`:

- `middleware/server.mjs` — per-system verified HTTPS CA handling; HTTP remains unchanged.
- `middleware/package.json`
- `middleware/package-lock.json`
- `middleware/bun.lock`
- `middleware/.env.example` — documentation only; do not overwrite the real `.env`.

Then run `npm install` in the Quality middleware folder and restart `mis-q-middleware` with updated environment values. For a self-signed HTTPS SAP endpoint whose selected key is `dev`, add:

```text
SAP_DEV_CA_CERT_PATH=/opt/MIS_Projects/Quality/middleware/certs/sap-quality-ca.pem
```

The PEM must be supplied by the SAP/Basis team, readable by the middleware process, and match the hostname used in the SAP URL. Never disable certificate verification globally.

## Security action required

The middleware shared secret, SAP password, and database service credential were pasted into chat. Rotate all three on the Quality server before further testing, and update the matching Nginx/shared-secret configuration together.

## Validation

- Save and reopen a valid five-field payload; all five fields remain.
- Enter a payload containing `//`; Save/Test are blocked with an inline error and no content is discarded.
- Change posting dates; only the two date fields change.
- Test one HTTP SAP address without a CA path.
- Test the private HTTPS SAP address with the matching CA path using Ping, Test connection, manual sync, and one scheduled run.
