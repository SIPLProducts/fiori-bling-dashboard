# Support SAP over HTTP and trusted HTTPS

## Goal

Allow every SAP test, manual fetch, host check, and scheduled sync to work with either `http://` or `https://`. For HTTPS systems using a private or self-signed certificate, trust the supplied SAP CA certificate without disabling certificate validation.

## Configuration behavior

```text
HTTP SAP URL  -> connect normally; no certificate setting required
HTTPS public certificate -> use the normal trusted certificate store
HTTPS private/self-signed certificate -> use the matching SAP CA certificate file
Invalid/untrusted HTTPS certificate -> stop before credentials/data are sent and show the exact TLS error
```

The SAP URL remains in **SAP Systems**. The SAP password remains only in the middleware `.env`.

## Changes

1. **Secure HTTPS certificate support**
   - Add optional per-system middleware settings such as `SAP_DEV_CA_CERT_PATH`, `SAP_QUALITY_CA_CERT_PATH`, and `SAP_PROD_CA_CERT_PATH`.
   - Load the PEM CA certificate only on the middleware server and attach it only to HTTPS calls for that matching SAP system.
   - Keep normal certificate validation enabled. Do not use `NODE_TLS_REJECT_UNAUTHORIZED=0` or accept arbitrary certificates.
   - Leave HTTP behavior unchanged.

   **Files:**
   - `middleware/server.mjs` — select normal HTTP handling or a verified HTTPS connection with the matching CA certificate.
   - `middleware/package.json`, `middleware/package-lock.json`, and `middleware/bun.lock` — add and lock the HTTP client support needed for a per-request certificate setting.

2. **Use one connection path everywhere**
   - Apply the same HTTP/HTTPS handling to Test connection, Ping SAP host, manual API fetches, and scheduled syncs.
   - Preserve the existing UI-first Base URL/client/username fallback and middleware-only password rule.

3. **Clear errors and safe status**
   - Report missing CA files, unreadable PEM files, untrusted issuers, expired certificates, and hostname mismatches as connection errors.
   - Return only a safe CA configured/not-configured status; never return certificate contents, SAP passwords, or service secrets.
   - Keep the current trace ID and confirm that SAP was not contacted when TLS setup fails.

4. **Server setup documentation**
   - Document how to obtain the root/intermediate CA certificate from the SAP/Basis team, copy it to a protected middleware certificate folder, set the matching `SAP_<SYSTEM>_CA_CERT_PATH`, and restart PM2.
   - Note that the HTTPS URL hostname/IP must match the certificate. If the certificate was issued to a DNS name, use that DNS name instead of the IP address.
   - Include Quality-first verification, then the same Production rollout.

   **Files:**
   - `middleware/.env.example` — document the optional DEV, QUALITY, and PROD CA certificate paths.
   - `deploy/middleware.production.env.example` — show the Production certificate-path setting without including a certificate or secret.
   - `middleware/README.md` — explain certificate installation and verification.
   - `deploy/README.md` — add the Quality and Production restart/test steps.

## How both protocols work

1. The portal or scheduler reads the selected SAP system URL.
2. If it starts with `http://`, the middleware uses the existing connection flow. No certificate is needed.
3. If it starts with `https://` and SAP uses a publicly trusted certificate, the middleware uses normal HTTPS verification.
4. If it starts with `https://` and SAP uses a private/self-signed certificate, the middleware reads only that system's CA file from the server and verifies SAP against it.
5. If the CA file is missing, invalid, expired, or does not match the SAP hostname/IP, the request stops and the existing API/scheduler result shows the TLS error.

Example server settings:

```text
# HTTP system: no CA line required
SAP_DEV_BASE_URL=http://10.10.4.18:8000

# Private-certificate HTTPS system
SAP_PROD_BASE_URL=https://sap.internal.example:44300
SAP_PROD_CA_CERT_PATH=/opt/MIS_Projects/Production/middleware/certs/sap-prod-ca.pem
```

The real SAP URL can continue to be maintained in **SAP Systems**. The CA path and SAP password are server-only middleware settings.

## Validation

- Verify an existing HTTP SAP URL still connects.
- Verify HTTPS with a public CA connects without a custom file.
- Verify HTTPS with the configured private CA connects for Test, Ping, manual sync, and scheduler.
- Verify a wrong/missing CA fails safely with a useful message.
- Verify no setting disables TLS checks globally and no certificate or password reaches the browser or logs.
