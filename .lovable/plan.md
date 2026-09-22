# Resolve Quality SAP 401 authentication failure

## Confirmed diagnosis

- Quality successfully reaches SAP at `http://10.10.4.18:8000`; this is not a network, timeout, certificate, portal-to-middleware, or JSON-mapping failure.
- SAP returns HTTP `401` with `Anmeldung fehlgeschlagen` (login failed), then the middleware correctly reports that the HTML error page is not JSON.
- The request resolves as `system=dev environment=quality`. The saved SAP username is `SIPL_MOUNIKA`, while the password is selected from `SAP_QUALITY_PASSWORD` because the saved Environment is Quality.
- `password=set` confirms only that a non-empty value was loaded; it does not prove that the password matches `SIPL_MOUNIKA` or that SAP accepts the account.

## Resolution

1. **Confirm the intended credential pair**
   - Verify that `SIPL_MOUNIKA` is the correct SAP user for client `234` on `10.10.4.18:8000`.
   - Ensure `SAP_QUALITY_PASSWORD` contains that exact user’s current password—not the DEV user’s password and not an expired/locked credential.
   - Keep the SAP Systems Environment as Quality if `SAP_QUALITY_PASSWORD` is the intended source. Otherwise, correct the saved Environment rather than duplicating passwords under unrelated prefixes.

2. **Remove stale Quality process values**
   - Check the Quality middleware environment for duplicate `SAP_QUALITY_PASSWORD` entries or a stale PM2-level override.
   - Keep exactly one non-empty value in the middleware environment.
   - Recreate/restart only `mis-q-middleware` with refreshed environment values so PM2 cannot continue using an older password.

3. **Prove authentication independently**
   - From the Quality server, call the same SAP URL with Basic authentication and a minimal valid request, without printing the password.
   - If SAP still returns `401`, ask SAP/Basis to verify the `SIPL_MOUNIKA` account is unlocked, its password is current, Basic authentication is enabled, and it is authorized for client `234` and this service.
   - Do not troubleshoot payload dates or row mapping until the response is no longer `401`.

4. **Verify the portal flow**
   - Run Test Connection, then one manual `Sales_Reports_KPI` sync.
   - Confirm the response is JSON and the run reaches parsing/storage.
   - Leave Production unchanged.

## Expected result

The Quality request uses one verified pair—`SIPL_MOUNIKA` plus its matching Quality password—and SAP returns an application response instead of the German login-failed page.
