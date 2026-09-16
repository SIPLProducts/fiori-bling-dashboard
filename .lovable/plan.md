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

## Validation

- Verify an existing HTTP SAP URL still connects.
- Verify HTTPS with a public CA connects without a custom file.
- Verify HTTPS with the configured private CA connects for Test, Ping, manual sync, and scheduler.
- Verify a wrong/missing CA fails safely with a useful message.
- Verify no setting disables TLS checks globally and no certificate or password reaches the browser or logs.
