# Fix SAP API Settings empty-system crash

## Confirmed cause

The SAP API Settings page builds each endpoint’s resolved address with `new URL(...)`. When the selected or active SAP system exists but its Base URL is empty, that browser call receives an invalid address and crashes the entire screen with **Failed to construct 'URL': Invalid URL**.

## Changes

### 1. Keep the screen usable with incomplete settings

- Make endpoint address resolution safe when there is no SAP system, no active system, an empty Base URL, or a malformed Base URL.
- Show a clear status such as **SAP Base URL not configured** on the affected endpoint instead of throwing an exception.
- Apply the same protection in the endpoint Connectivity preview so opening or editing an endpoint cannot crash the page.
- Keep the middleware-side validation that refuses an SAP call when neither a valid system Base URL nor a full endpoint URL is available.

### 2. Prevent invalid SAP system values from being saved

- Require a non-empty SAP Base URL for a saved SAP system.
- Accept only complete `http://` or `https://` addresses and show a readable validation message without leaving the page.
- Disable or reject connection tests for incomplete SAP systems with a specific configuration message.
- Preserve a usable empty state when all SAP systems have been removed.

### 3. Clarify the two configuration locations

Use one clear ownership model:

- **SAP API Settings → SAP Systems:** system label, environment, Base URL, SAP client, username, and active system selection.
- **Middleware `.env`:** SAP password, middleware shared secret, database service credentials, middleware port, and public middleware address.

The middleware may retain Base URL/client/username environment values only as backward-compatible fallbacks, but values saved in SAP API Settings remain the active source for requests. Passwords stay only on the middleware server and are never exposed to the browser.

### 4. Validate

- Open SAP API Settings with no SAP systems and confirm the page loads.
- Save attempts with a blank or malformed Base URL show validation instead of a crash.
- Open the APIs and Connectivity views when a referenced system is missing or incomplete and confirm a configuration label appears.
- Save a valid system, select it for an endpoint, and confirm the resolved address includes the Base URL and SAP client.
- Test through the middleware and confirm the password is read from its `.env` while the non-secret connection details come from SAP API Settings.
