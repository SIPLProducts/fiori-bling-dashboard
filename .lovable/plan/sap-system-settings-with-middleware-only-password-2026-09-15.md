# SAP System settings with middleware-only password

## Goal

Keep the SAP password exclusively in the middleware `.env`. Show a masked, non-editable password field in **SAP Systems** so administrators can see whether the middleware password is configured without exposing it.

## Configuration priority

```text
1. SAP Systems saved value (first priority)
2. Middleware .env value (fallback)
3. Clear “not configured” error if neither exists
```

This applies to Base URL, SAP client, and username. The SAP password always comes from the middleware `.env`; it never comes from SAP Systems. The middleware port, public middleware address, shared secret, and database service credentials also remain middleware-only settings.

## Changes

1. **Masked password status in SAP Systems**
   - Replace the explanatory password panel with a password-style field.
   - Display `********` when the matching middleware `.env` password is configured.
   - Keep the field read-only; clicking or saving it cannot reveal, replace, or remove the password.
   - Show an empty masked field with a clear **Not configured in middleware** status when the password is absent.

2. **Secure password status**
   - Read only a configured/not-configured flag from the middleware health response; never return the real password to the browser.
   - Never store the SAP password in `sap_systems`, browser storage, logs, request history, or page responses.
   - Keep the existing encrypted credential store unused for SAP system passwords under this model.

3. **Consistent connection resolution**
   - Update manual tests, manual syncs, and scheduled syncs to use the same priority order.
   - Resolve saved UI Base URL/client/username first, falling back field-by-field to `SAP_<SYSTEM>_BASE_URL`, `SAP_<SYSTEM>_CLIENT`, and `SAP_<SYSTEM>_USER`.
   - Resolve the password only from `SAP_<SYSTEM>_PASSWORD` in middleware `.env`.
   - Never send the resolved password to the browser or include it in logs and sync snapshots.

4. **Blank and invalid settings**
   - Permit blank SAP Systems connection fields when middleware `.env` fallback values are available.
   - Prevent the SAP API Settings page from crashing when fields are blank or malformed.
   - Test connection through the middleware, which reports exactly which required value is missing after both sources are checked.
   - Keep malformed nonblank UI addresses rejected instead of silently bypassing them.

5. **Verification and deployment**
   - Verify UI-only address/client/username, `.env`-only settings, mixed field-by-field fallback, configured password masking, and missing-password status.
   - Verify passwords never appear in browser responses, logs, sync snapshots, or rendered page source.
   - Update and restart the Quality middleware first, verify Test connection and one scheduled sync, then deploy the same files to Production.

## Technical notes

- The middleware health/status response already reports only whether each system password is configured; use that boolean for masking.
- Existing `.env` SAP settings remain valid fallbacks for Base URL, client, and username.
- The required password variable is selected by system key, such as `SAP_DEV_PASSWORD`, `SAP_QUALITY_PASSWORD`, or `SAP_PROD_PASSWORD`.
