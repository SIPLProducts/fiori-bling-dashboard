# SAP System UI credentials with middleware fallback

## Goal

Allow authorized users to enter and save the SAP password in **SAP Systems**. For every connection value, use the saved SAP Systems value first and use the matching middleware `.env` value only when no UI value is configured.

## Configuration priority

```text
1. SAP Systems saved value (first priority)
2. Middleware .env value (fallback)
3. Clear “not configured” error if neither exists
```

This applies to Base URL, SAP client, username, and password. The middleware port, public middleware address, shared secret, and database service credentials remain middleware-only settings.

## Changes

1. **Password input in SAP Systems**
   - Replace the explanatory password panel with a password input.
   - Display `********` when an encrypted UI password is already configured, without returning the real password to the browser.
   - A newly entered password replaces the saved UI password when **Save SAP connection** is clicked.
   - Leaving the field untouched preserves an existing UI password. For a system with no saved UI password, an empty field uses the middleware `.env` password.
   - Provide an explicit **Use middleware password** action to remove the saved UI password and restore `.env` fallback without accidental deletion.

2. **Secure storage and permissions**
   - Store UI-entered passwords in the existing encrypted SAP credential store, never in `sap_systems`, browser storage, logs, request history, or page responses.
   - Keep password saving restricted to Sharvi Admin, with client and server validation.
   - Return only a configured/not-configured status to the screen.

3. **Consistent connection resolution**
   - Update manual tests, manual syncs, and scheduled syncs to use the same priority order.
   - Resolve saved UI Base URL/client/username first, falling back field-by-field to `SAP_<SYSTEM>_BASE_URL`, `SAP_<SYSTEM>_CLIENT`, and `SAP_<SYSTEM>_USER`.
   - Resolve the encrypted UI password first, falling back to `SAP_<SYSTEM>_PASSWORD`.
   - Never send the resolved password to the browser or include it in logs and sync snapshots.

4. **Blank and invalid settings**
   - Permit blank SAP Systems connection fields when middleware fallback values are available.
   - Prevent the SAP API Settings page from crashing when fields are blank or malformed.
   - Test connection through the middleware, which reports exactly which required value is missing after both sources are checked.
   - Keep malformed nonblank UI addresses rejected instead of silently bypassing them.

5. **Verification and deployment**
   - Verify UI-only credentials, `.env`-only credentials, mixed field-by-field fallback, password replacement, and explicit return to middleware fallback.
   - Verify passwords never appear in browser responses, logs, sync snapshots, or rendered page source.
   - Update and restart the Quality middleware first, verify Test connection and one scheduled sync, then deploy the same files to Production.

## Technical notes

- Reuse the existing encrypted `sap_credentials` functions and store one credential per SAP system key.
- Middleware database access decrypts the credential server-side; the browser can save a replacement but cannot read it back.
- Existing `.env` SAP settings remain valid fallbacks, so this change does not require immediately removing them.
