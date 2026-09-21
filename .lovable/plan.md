# Resolve Production SAP self-signed certificate failure

## Confirmed issue

Production reaches the middleware, but the middleware stops before contacting SAP because the SAP HTTPS certificate is self-signed. The current Production settings have certificate verification enabled:

```text
SAP_PROD_CA_CERT_PATH=
SAP_PROD_TLS_INSECURE=false
```

The SAP URL and client are being supplied by the saved SAP Systems configuration, which is why the error correctly targets the Production SAP address with client 234.

## Production recovery

1. Keep the Production SAP URL, client, and username in **SAP Systems**.
2. In the Production middleware `.env`, keep exactly one Production TLS line and change it to:

```text
SAP_PROD_TLS_INSECURE=true
```

3. Leave `SAP_PROD_CA_CERT_PATH` blank until the SAP team supplies a trusted CA certificate.
4. Recreate the `mis-p-middleware` PM2 process with stale inherited SAP variables removed, rather than performing an ordinary restart that may preserve the old `false` value.
5. Confirm startup identifies Production insecure TLS as enabled.
6. Run, in order:
   - Middleware health
   - Ping SAP host
   - Test connection
   - One manual Sales KPI sync
   - Confirm the scheduled sync completes
7. Verify the new snapshot counts reconcile, for example `4,180 received → 4,180 stored`, including repeated SAP rows.

## Safety and follow-up

- This bypass applies only to the Production SAP connection; it will not disable certificate checking globally.
- It is temporary and permits interception of SAP credentials and traffic. Replace it with the SAP CA certificate and return `SAP_PROD_TLS_INSECURE=false` when the certificate is available.
- The middleware shared secret, SAP password, and database service credential were exposed in chat. Rotate all three after restoring service, then update the Production middleware configuration and recreate the PM2 process again.
