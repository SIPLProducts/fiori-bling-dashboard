# Restore Quality SAP configuration after deployment overwrite

## Confirmed issue

- The middleware `.env` is loaded correctly. Because the saved SAP System Environment is `QUALITY`, the request uses `SAP_QUALITY_PASSWORD` from that file.
- The username, Base URL, and client do **not** come from the blank `SAP_QUALITY_USER`, `SAP_QUALITY_BASE_URL`, and `SAP_QUALITY_CLIENT` fallback fields when values are saved in SAP Systems. The portal’s saved values take priority.
- The latest Quality deployment ran `deploy/quality-setup-all.sh`. Its SAP-settings step executes `deploy/quality-sap-seed.sql`, which deletes all `sap_endpoints` and `sap_systems` rows, then recreates the old DEV system:
  - key `dev`
  - environment `DEV`
  - Base URL `http://10.10.4.18:8000`
  - user `SIPL_MOUNIKA`
- That explains why the log targets `10.10.4.18:8000` even though the screenshot previously showed Quality at `https://10.10.47.144:44300`.
- The current request logs `system=dev environment=quality` because the system was later partly changed to Quality, while retaining the seeded key/connection values. SAP rejects that mixed credential pair with HTTP 401.

## Changes

1. **Make deployment non-destructive**
   - Stop the normal Quality setup/deployment from deleting and reseeding existing SAP Systems and APIs.
   - Make SAP seed execution explicit and first-install-only.
   - Replace destructive deletes with safe insert-if-missing behavior where initial seeding is still required.

2. **Restore the intended Quality connection**
   - Restore the Quality SAP System values in the portal: Environment `QUALITY`, Base URL `https://10.10.47.144:44300`, client `234`, and the correct SAP username.
   - Keep `SAP_QUALITY_PASSWORD` as the matching password source.
   - Keep temporary insecure TLS only if the Quality SAP certificate still cannot be verified.
   - Ensure `Sales_Reports_KPI` remains attached to that restored system and resolves to `/fisales_detail/report?sap-client=234`.

3. **Prevent mixed system/environment records**
   - Add deployment verification that prints the saved system key, environment, URL, client, username, and endpoint association without printing secrets.
   - Fail or warn when a system such as key `dev` is assigned Environment `QUALITY`, because that makes troubleshooting and credential selection ambiguous.

4. **Restart and verify**
   - Recreate/restart `mis-q-middleware` with refreshed environment values.
   - Confirm logs target the restored HTTPS Quality URL and show `environment=quality`.
   - Run Test Connection, then one manual `Sales_Reports_KPI` sync; verify SAP returns JSON rather than the login-failed HTML page.

## Security requirement

The middleware shared secret, SAP password, and database service credential were exposed in chat. Rotate all three after recovery, update their matching Quality configuration, and do not paste the replacement values into chat or logs.
