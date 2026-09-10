# Fix large syncs and clear the sales table on your server

## What is happening now

The background scheduler is working: it reads the saved 5-minute schedule and SAP returns records successfully. It then fails with "URI too long" because, before saving, it asks the database about 500 records in one web request. With long record keys the address exceeds the gateway limit, so nothing is saved.

At 30,000 records this would fail immediately every time.

## Change to make

In `middleware/scheduler.mjs`:

- Check which records already exist in small groups of 40 instead of 500, so the request address always stays short.
- Keep saving in groups of 500 (saving sends data in the body, not the address).
- Add a short progress line every few thousand records so large runs are visible in the log.
- Keep counting new versus updated records exactly as today.

This makes a 30,000-record sync work: roughly 750 short existence checks plus 60 save batches, all within the existing 10-minute timeout.

No portal or database change is needed.

## Deploy on the server

```bash
cd /opt/MIS_Projects/Quality
git pull
cd middleware
pm2 restart mis-q-middleware
pm2 logs mis-q-middleware --lines 40 --nostream
```

Within five minutes the SAP API Settings screen should show a successful run with received/new/updated counts.

## Clearing all sales records on your server

Run this on the self-hosted server only. It permanently removes every row in the sales table; the structure and all other data stay intact.

```bash
docker exec -i supabase-db psql -U postgres -d postgres \
  -c "TRUNCATE TABLE public.zfisales_detail;"
```

If your database container has a different name, list it with `docker ps` and substitute it.

Verify:

```bash
docker exec -i supabase-db psql -U postgres -d postgres \
  -c "SELECT count(*) FROM public.zfisales_detail;"
```

The count should be 0. The next scheduled sync then refills the table from SAP.

## Still outstanding

The middleware listens on port 3000 because PM2 saved an older value. The scheduler is unaffected, but the portal's Test button uses port 3002. Fix when convenient:

```bash
cd /opt/MIS_Projects/Quality/middleware
pm2 delete mis-q-middleware
env -u PORT pm2 start server.mjs --name mis-q-middleware
pm2 save
```

## Security follow-up

The SAP password and middleware secret were pasted into chat; rotate both once syncing is stable.
