# SAP API settings fixes + login panel color

## 1. SAP password can be entered and saved (SAP Systems tab)

Today the "SAP password" box is intentionally disabled — the password only lives in the middleware server's environment file, so nothing you type is kept. Change it to a real, saveable field:

- The field becomes editable (write-only): you can type a new password and save it; it is never sent back to the browser afterwards. Saved systems show "Password saved — leave blank to keep" as the placeholder, so leaving it empty keeps the existing one.
- The password is encrypted before being stored (AES-GCM with a server-only key), never stored in plain text and never readable from the client.
- The server-side SAP call path decrypts the stored password at call time and uses it for Basic auth. If a system has no stored password, it falls back to the middleware environment value exactly as it does today — existing setups keep working.
- Same treatment for "Proxy secret / SAP password" on the Middleware Configuration tab: editable, encrypted, write-only.

This needs one new app secret (an encryption key) which I will generate — no action from you.

## 2. Endpoint form: SAP system stays, Module dropdown is removed

- **SAP system** — keep. It is functional: it decides which Base URL / client / credentials the endpoint runs against, and "Use active system" is used by the Test connection call.
- **Module** — remove. It only prints a badge on the endpoint card and drives nothing; that is also why the new Sales Distribution Reports screens never appeared in it. Removing it from the form and from the endpoint card/list. The database column stays (defaulted) so nothing breaks.

## 3. Login left panel background color

Change the left branding panel from the current dark slate to the deep SAP blue in your screenshot (a rich blue with a subtle radial depth), keeping the gold accent lines, centered headline/description, and the centered HBL watermark exactly as they are.

## Technical notes

- `src/routes/_authenticated/admin/sap-api.tsx` — editable password inputs, remove Module select and badge.
- `src/lib/sap-api.functions.ts` — accept an optional password on save, encrypt it server-side, never return it; decrypt when building the SAP request.
- Migration: add `password_encrypted` columns to `sap_systems` and `sap_middleware_config`.
- `src/styles.css` — retune the `--shell` token to the SAP blue (semantic token, no hardcoded colors in components).
