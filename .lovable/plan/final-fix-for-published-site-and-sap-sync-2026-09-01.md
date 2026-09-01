# Final fix for published site and SAP sync

## Confirmed issue

The published worker still fails before any page or API route starts because its custom server wrapper creates a runtime import for a React/server chunk that the host cannot resolve. This produces `No such module "assets/react"` for both the website and `/api/public/sap/pull/zfisales`.

The publish confirmation shown in the screenshot is a mandatory Lovable deployment approval. It cannot be bypassed; only one approval will be requested for the final corrected deployment.

## Fix and verify

1. Remove the custom server-entry override from the hosted build and let TanStack Start generate its standard self-contained server worker.
2. Preserve the existing split between hosted `build` and on-prem `build:static`.
3. Publish once after the corrected bundle is ready.
4. Verify `mis.siplproducts.com` loads successfully.
5. Verify the scheduled SAP endpoint reaches application code rather than returning the deployment error.
6. Confirm a new sync-run record and `zfisales_detail` update from the next 10-minute run.
7. If the deployment works but middleware/SAP then returns a separate error, report that exact downstream response rather than mixing it with this hosting failure.

## Data safety

The sync remains upsert-only: existing rows are updated, new rows are inserted, and an empty SAP response never deletes existing data.
