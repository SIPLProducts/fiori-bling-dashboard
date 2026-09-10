# Fix the "URI too long" sync failure

## What is happening

The on-prem scheduler is now working end to end:

- It reads the saved 5-minute schedule from the portal.
- It calls SAP and receives 405 records successfully.

It then fails at the last step. Before saving, it asks the database which of those 405 records already exist, and it asks about 500 records in one request. Each record key is long, so the request web address exceeds the size the local gateway accepts and it answers "URI too long". Nothing is saved, and the run is recorded as an error.

This is the same limit that was fixed earlier for syncs started from the browser, but the new background scheduler still uses the large group size.

## Change to make

In `middleware/scheduler.mjs`:

- Add a separate, much smaller group size for the existence check (40 records per request) while keeping 500 for the save step, which does not use the web address for data.
- Apply the smaller size in the loop that reads `record_key` from `zfisales_detail`.
- Leave the save/upsert loop and all counting logic unchanged, so new/updated numbers stay accurate.

No portal, database, or configuration change is required.

## What you do on the server after approval

```bash
cd /opt/MIS_Projects/Quality
git pull
cd middleware
pm2 restart mis-q-middleware
pm2 logs mis-q-middleware --lines 30 --nostream
```

Within five minutes the log should show a completed run, and the SAP API Settings screen should show a successful run with the received/new/updated counts instead of "URI too long".

Apply the same steps on Production (`/opt/MIS_Projects/Production/middleware`, process `mis-p-middleware`) once Quality is confirmed.

## Still outstanding

The middleware listens on port 3000 because PM2 kept an older saved value. That does not affect the scheduler, which calls SAP directly, but the portal's manual Test button goes through port 3002. Recreate the process cleanly when convenient:

```bash
cd /opt/MIS_Projects/Quality/middleware
pm2 delete mis-q-middleware
env -u PORT pm2 start server.mjs --name mis-q-middleware
pm2 save
```

## Security follow-up

The SAP password and middleware secret were pasted into chat; rotate both once syncing is stable.
