# Fix Quality SAP password loading and HTTPS trust

## Confirmed behavior

- The Test button and scheduler both resolve the saved SAP system key first, then read the matching middleware password:
  - key `dev` → `SAP_DEV_PASSWORD`
  - key `quality` → `SAP_QUALITY_PASSWORD`
  - key `prod` → `SAP_PROD_PASSWORD`
- The password currently shown in `.env` is valid syntax; `$` is preserved by the middleware’s file loader.
- The middleware currently lets an existing PM2 environment variable win over `.env`, even when the PM2 value is blank. That can produce “password is not configured” although `.env` contains it.
- A private/self-signed HTTPS SAP address additionally requires a PEM certificate file. The password and certificate solve different checks.

## Changes

1. **Make `.env` loading reliable**
   - Treat a missing or blank inherited PM2 value as unset, allowing the non-empty value in `middleware/.env` to load.
   - Preserve deliberate non-empty process-level overrides for Docker and managed deployments.
   - Add safe startup diagnostics for every known system key, even when its fallback Base URL is blank, showing only password/CA configured status.

2. **Make system-key errors explicit**
   - When SAP Systems selects `quality` but only `SAP_DEV_PASSWORD` exists, report the exact required variable, such as `SAP_QUALITY_PASSWORD`.
   - Apply this consistently to Test connection, manual sync, and scheduled sync.

3. **Document the exact Quality HTTPS setup**
   - Keep the SAP HTTPS URL, client, and username in the SAP Systems screen.
   - Keep the password in the matching `.env` variable.
   - Obtain the SAP root/intermediate PEM certificate from SAP/Basis; the application cannot generate a trusted SAP certificate.
   - Install it at `/opt/MIS_Projects/Quality/middleware/certs/sap-quality-ca.pem`.
   - If the saved system key is `dev`, add:

```text
SAP_DEV_CA_CERT_PATH=/opt/MIS_Projects/Quality/middleware/certs/sap-quality-ca.pem
```

   - If the saved key is `quality`, use `SAP_QUALITY_PASSWORD` and `SAP_QUALITY_CA_CERT_PATH` instead. The variable prefix follows the saved key, not the server name “Quality.”

4. **Deploy and verify without exposing secrets**
   - Copy the updated middleware files and dependency locks, run `npm install`, then recreate/restart `mis-q-middleware` with the stale PM2 SAP variables removed.
   - Verify startup reports middleware `v1.5.x`, the selected system password as configured, and its CA as configured.
   - Run Middleware health, Ping SAP host, Test connection, and one manual scheduler run before waiting for the next cron interval.
   - If HTTPS then reports a hostname mismatch, replace the IP in SAP Systems with the DNS hostname printed on the SAP certificate, or obtain a certificate covering that IP.

## Security requirement

The middleware shared secret, SAP password, and database service credential were pasted into chat. Rotate all three after recovery and update their matching server configuration; no secret values will be added to project files or logs.
