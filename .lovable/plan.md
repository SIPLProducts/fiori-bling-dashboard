# Align SAP credentials with the selected environment

## Confirmed cause

The SAP Systems record has two separate values:

- a hidden system key, currently `dev`
- the visible Environment selection, currently `QUALITY`

Test connection and scheduled sync currently use the hidden key. Therefore, this record requests `SAP_DEV_PASSWORD` even though the screen shows **QUALITY** and `.env` contains `SAP_QUALITY_PASSWORD`.

## Changes

1. **Use the visible Environment for middleware credentials**
   - Map `DEV` to `SAP_DEV_*`, `QUALITY` to `SAP_QUALITY_*`, and `PRODUCTION` to `SAP_PROD_*`.
   - Send the selected environment with Test connection, Ping, manual sync, and scheduled sync.
   - Keep the existing system key only for linking an API endpoint to its SAP Systems record.

2. **Correct password status on the SAP Systems screen**
   - Show `********` by matching middleware status to the selected Environment, not the hidden key.
   - Refresh the status immediately after saving a changed Environment.

3. **Improve errors and compatibility**
   - Missing-password errors will name the exact expected variable, such as `SAP_QUALITY_PASSWORD`.
   - Continue accepting older requests that only provide a system key, so deployment does not interrupt existing calls.
   - Apply the same mapping to the private HTTPS certificate variable, such as `SAP_QUALITY_CA_CERT_PATH`.

4. **Verify all request paths**
   - Confirm a Quality record uses `SAP_QUALITY_PASSWORD` for Test connection and scheduled sync.
   - Confirm DEV and Production use their matching variables.
   - Confirm HTTP remains certificate-free and private HTTPS uses the matching environment CA file.

## Immediate workaround before deployment

Because the currently saved hidden key is `dev`, setting the same password temporarily in `SAP_DEV_PASSWORD` would make the current version work. After this fix is deployed, the Quality selection will correctly use `SAP_QUALITY_PASSWORD`, and the temporary DEV duplicate can be removed.

## Security

The middleware shared secret, SAP password, and database service credential were pasted into chat. Rotate all three after testing, and update the matching server configuration without committing them to project files.