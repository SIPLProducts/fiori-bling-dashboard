# Deploy SAP HTTP and HTTPS support to Quality

## What was changed

The HTTP/HTTPS implementation is already in these project files:

- `middleware/server.mjs`
  - Uses normal requests for `http://` SAP addresses.
  - Uses the normal trusted certificate store for public `https://` addresses.
  - Loads a system-specific PEM CA certificate for private/self-signed HTTPS.
  - Keeps certificate validation enabled.
  - Applies the CA to Ping, Test connection, manual sync, and scheduled sync.
  - Reports safe CA configured/not-configured status without exposing the certificate.
- `middleware/package.json`, `middleware/package-lock.json`, `middleware/bun.lock`
  - Add `undici` version 6, which supports the server’s Node.js 20 runtime and allows a CA per SAP request.
- `middleware/.env.example`
  - Documents `SAP_DEV_CA_CERT_PATH`, `SAP_QUALITY_CA_CERT_PATH`, and `SAP_PROD_CA_CERT_PATH`.
- `middleware/README.md` and `deploy/README.md`
  - Document certificate installation, restart, and testing.

No database migration is needed for HTTP/HTTPS support.

## How selection works

The certificate variable follows the saved SAP **system key**, not its display label:

```text
System key dev     -> SAP_DEV_PASSWORD and SAP_DEV_CA_CERT_PATH
System key quality -> SAP_QUALITY_PASSWORD and SAP_QUALITY_CA_CERT_PATH
System key prod    -> SAP_PROD_PASSWORD and SAP_PROD_CA_CERT_PATH
```

The SAP Systems screen supplies Base URL, SAP client, and username. The middleware `.env` supplies the password and optional CA path.

```text
HTTP                              -> no CA path
HTTPS with public certificate     -> no CA path
HTTPS with private/self-signed CA -> matching SAP_<KEY>_CA_CERT_PATH required
```

## Quality server deployment

1. Copy these updated files into `/opt/MIS_Projects/Quality/middleware/`:

```text
server.mjs
package.json
package-lock.json
bun.lock
```

Do not overwrite the real `.env` with `.env.example`.

2. Obtain the PEM root/intermediate CA bundle from the SAP/Basis team and install it:

```bash
sudo install -d -m 750 /opt/MIS_Projects/Quality/middleware/certs
sudo install -m 640 sap-quality-ca.pem /opt/MIS_Projects/Quality/middleware/certs/sap-quality-ca.pem
```

3. The current selected key appears to be `dev`, so add this line to the existing Quality `.env`:

```text
SAP_DEV_CA_CERT_PATH=/opt/MIS_Projects/Quality/middleware/certs/sap-quality-ca.pem
```

Keep `SAP_DEV_BASE_URL`, `SAP_DEV_CLIENT`, and `SAP_DEV_USER` blank if those values are maintained in the SAP Systems screen. Keep `SAP_DEV_PASSWORD` in `.env`.

4. Install the updated dependency and restart Quality middleware:

```bash
cd /opt/MIS_Projects/Quality/middleware
npm install
pm2 restart mis-q-middleware --update-env
pm2 logs mis-q-middleware --lines 50
```

The startup log should show middleware version `1.5.0`, port `3002`, and SAP `dev` CA configured.

## Validation

1. In SAP Systems, save the complete HTTPS SAP Base URL, client, and username.
2. Click **Ping SAP host**.
3. Click **Test connection**.
4. Run one manual sync.
5. Confirm one scheduled run completes.
6. If the error is `ERR_TLS_CERT_ALTNAME_INVALID`, use the DNS hostname printed on the SAP certificate instead of its IP address, or ask SAP/Basis for a certificate matching the IP.

## Security action required

Credentials were pasted into chat. Rotate the Quality middleware shared secret, SAP password, and database service credential. Update the matching Nginx shared-secret header when rotating the middleware secret.
