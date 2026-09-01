# Restore the published MIS portal and SAP synchronization

## Confirmed cause

The custom domain is serving an older broken hosted bundle. Production logs show every page and the scheduled endpoint failing before application code starts with:

`No such module "assets/react"`

The 10-minute database scheduler is active and is calling `/api/public/sap/pull/zfisales`, but that request also receives HTTP 500 from the same broken server bundle. The hosted backend itself is healthy. The last successful SAP sync inserted/updated 17 rows at 10:53 AM IST; no later run reached the sync logic.

## Recovery steps

1. Keep the corrected build separation already present in the project:
   - Hosted publishing uses `vite build` and preserves the complete server bundle.
   - On-prem Nginx deployment uses `build:static` and flattens only that static output.
   - The SPA shell stays disabled for the hosted server build.
2. Run the platform security check required before publishing.
3. Publish the corrected project so `mis.siplproducts.com` receives a new server bundle.
4. Verify the custom domain loads the login page instead of the incident screen.
5. Call the scheduled SAP endpoint and confirm it reaches the middleware, receives SAP data, and upserts `zfisales_detail`.
6. Confirm a new `sap_sync_runs` entry and verify the next automatic 10-minute run completes.

## Data-safety checks

- Empty SAP responses will leave all existing rows unchanged.
- Existing records are updated by deterministic record key.
- New records are inserted.
- No sync path deletes existing sales data.

## Technical note

The scheduler currently calls the stable published project URL rather than the custom domain. That is correct: both route to the same hosted deployment, and the stable URL avoids future custom-domain or DNS changes disrupting the cron job.
