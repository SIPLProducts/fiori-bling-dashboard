# Clear the sales table and make large syncs work

## 1. Delete all sales records on your server (plain query, no migration)

Run this on the self-hosted server. It empties the sales table only; structure, users and settings are untouched.

```bash
docker exec -i supabase-db psql -U postgres -d postgres \
  -c "DELETE FROM public.zfisales_detail;"
```

Check the result:

```bash
docker exec -i supabase-db psql -U postgres -d postgres \
  -c "SELECT count(*) FROM public.zfisales_detail;"
```

It should print 0. If the database container has a different name, find it with `docker ps` and replace `supabase-db`.

This is permanent and cannot be undone; the next sync refills the table from SAP.

## 2. Why the sync currently fails

The scheduler works and SAP returns records, but before saving it asks the database about 500 records in one web request. With long record keys the request address exceeds the gateway limit, giving "URI too long", so nothing is saved. At 30,000 records this fails every time.

## 3. Change to make in the scheduler

In `middleware/scheduler.mjs`:

- Ask about existing records in groups of 40 instead of 500, keeping every request address short.
- Keep saving in groups of 500, since saving sends data in the body and has no address limit.
- Process the run in sequential chunks so memory stays flat even with 30,000+ records.
- Log progress every few thousand records so long runs are visible.
- Keep the new/updated/skipped counting exactly as today.

A 30,000-record run becomes about 750 short lookups plus 60 save batches, comfortably inside the existing 10-minute timeout.

Nothing in the portal or database schema changes.

## 4. Deploy on the server

```bash
cd /opt/MIS_Projects/Quality
git pull
cd middleware
pm2 restart mis-q-middleware
pm2 logs mis-q-middleware --lines 40 --nostream
```

Within five minutes the SAP API Settings screen should show a successful run with received/new/updated counts instead of "URI too long".

## Still outstanding

The middleware listens on port 3000 because PM2 kept an older saved value. The scheduler is unaffected, but the Test button uses port 3002:

```bash
cd /opt/MIS_Projects/Quality/middleware
pm2 delete mis-q-middleware
env -u PORT pm2 start server.mjs --name mis-q-middleware
pm2 save
```

## Security follow-up

The SAP password and middleware secret were pasted into chat; rotate both once syncing is stable.
