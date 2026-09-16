# Temporary self-signed HTTPS mode for SAP

## Goal
Allow the selected SAP environment to connect over HTTPS without a CA certificate, matching the behavior of `rejectUnauthorized: false`, while keeping this insecure behavior isolated and explicitly configurable.

## Changes

1. **Add a per-environment opt-in**
   - Add `SAP_DEV_TLS_INSECURE`, `SAP_QUALITY_TLS_INSECURE`, and `SAP_PROD_TLS_INSECURE` middleware settings.
   - Treat only an explicit `true` value as enabled; missing, blank, or any other value remains secure.
   - Quality and Production are supported independently: use `SAP_QUALITY_TLS_INSECURE=true` and/or `SAP_PROD_TLS_INSECURE=true` only where required.

2. **Apply the setting consistently**
   - Extend the shared SAP connection setup so Test, Ping, manual sync, and scheduled sync all use the same behavior.
   - HTTPS with a configured CA continues to verify the certificate normally.
   - HTTPS with no CA and the insecure switch enabled uses a dedicated connection agent with certificate verification disabled.
   - HTTP remains unchanged.
   - The setting follows the visible SAP Systems Environment, so QUALITY uses `SAP_QUALITY_*` even if the saved system key is `dev`.

3. **Make insecure operation visible but secret-safe**
   - Report an `insecureTls` status from middleware health without exposing credentials or certificates.
   - Log a clear startup warning and a request warning whenever certificate verification is disabled.
   - Update the SAP Systems status display to warn that HTTPS certificate verification is disabled for that environment.

4. **Document deployment and rollback**
   - Add the new settings to the example environment files and middleware deployment instructions.
   - Document the separate Quality and Production settings, PM2 restarts, and Ping/Test/manual/scheduled validation steps.
   - Document rollback: remove or set the relevant environment switch to `false`, then restart middleware after a proper certificate is available.

## Security boundary
This will not use a global `NODE_TLS_REJECT_UNAUTHORIZED=0`. Only requests for an explicitly enabled SAP environment will bypass certificate verification. SAP credentials and returned data could still be intercepted on that connection, so this mode is temporary and should be restricted to the trusted internal network.

## Validation
- Confirm startup reports the selected environment's password configured and insecure TLS enabled.
- Confirm Ping, Test connection, manual sync, and scheduled sync no longer fail with `DEPTH_ZERO_SELF_SIGNED_CERT` in each enabled environment.
- Confirm every environment remains certificate-verified unless its own switch is enabled.
- Confirm disabling the switch restores the current secure failure for an untrusted certificate.
