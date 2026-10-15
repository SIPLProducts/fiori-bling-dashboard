# Fix Cash Flow card and missing ZCASH_FLOW API on Quality

## Why it happens
Deploying code does not add data to the Quality database. The ZCASH_FLOW API and the Cash Flow data are database records, not code:
- **SAP API Settings** lists rows saved in the `sap_endpoints` table. The ZCASH_FLOW row was saved only in the Lovable environment, so Quality still has only Open Sales Orders and Sales_Reports_KPI.
- **Cash Flow card** shows bars only when `zcash_flow` has rows. If the table is missing or empty on Quality, the card falls back to the plain "Open" tile, as in your screenshot.

## Steps on Quality (no code changes needed)
1. In the Quality SQL editor, check the current state:
```text
SELECT to_regclass('public.zcash_flow');                 -- null = table missing
SELECT name FROM public.sap_endpoints WHERE name = 'ZCASH_FLOW';
```
2. Run `deploy/zcash-flow/install-zcash-flow.sql` (safe to re-run). It creates the table and its read permission, and registers the ZCASH_FLOW API using the same SAP system as Open Sales Orders, on the 5:30 am and 1:00 pm IST schedule. It ends with the schema reload.
3. Make sure the Quality middleware runs the latest `scheduler.mjs` and `sync-core.mjs`. Rebuild with `npm run build:sync-core`, then `pm2 restart mis-q-middleware --update-env`.
4. Reload SAP API Settings. ZCASH_FLOW now appears. Open it, check Company Code / Fiscal Year / Profit Centre / Plant, then click **Test** and run one sync.
5. Confirm the rows arrived with `SELECT count(*), sum(credit), sum(debit) FROM public.zcash_flow;`, then reload the launchpad. The Cash Flow card shows the Credit/Debit/Net bars and the last-synced time.

## If still blank after the steps
- Make sure the signed-in role has the `fi.cash-flow` screen permission, because the table's read rule requires it. Sharvi Admin always has it.
- Send me the outputs of the step 1 and step 5 queries.

## Optional follow-up
If you approve, I will add a short "ZCASH_FLOW" section to `deploy/README.md` that lists these steps, so the same procedure is used for Production.
