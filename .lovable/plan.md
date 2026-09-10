# Clear the sales table and fix the server sync error

## 1. Delete all records from the sales table (query only, no migration)

Open the SQL Editor on your self-hosted backend (port 8000 Studio) and run:

```sql
DELETE FROM public.zfisales_detail;
```

This removes only the rows; the table structure, users and settings stay. It is permanent — the next successful sync refills the table from SAP. It will never run automatically on Production because it is not in any migration file.

Your table currently holds 27,074 records; deleting and re-syncing from SAP is fine.

## 2. Why the sync fails with "URI too long"

The scheduler correctly calls SAP and receives the records. Then, before saving, it checks which records already exist — but it asks about 500 records in a single request. Each record key is long, so the request address becomes too big for the gateway, which rejects it with "URI too long" and nothing is saved.

## 3. Code fix (after approval)

In `middleware/scheduler.mjs`:

- Check existing records in groups of 40 instead of 500, keeping every request address short.
- Keep saving in groups of 500 (saving uses the request body, which has no address limit).
- Process chunks in sequence so even 30,000+ records sync with flat memory.
- Log progress every few thousand records.

## 4. Deploy and verify on the server

```bash
cd /opt/MIS_Projects/Quality
git pull
cd middleware
pm2 restart mis-q-middleware
pm2 logs mis-q-middleware --lines 40 --nostream
```

Within five minutes the SAP API Settings screen should show a successful run with received/new/updated counts.

## 5. Port fix (Test button, when convenient)

The middleware listens on 3000 because PM2 saved an older value; the portal Test button uses 3002:

```bash
cd /opt/MIS_Projects/Quality/middleware
pm2 delete mis-q-middleware
env -u PORT pm2 start server.mjs --name mis-q-middleware
pm2 save
```

## Security follow-up

The SAP password and middleware secret were pasted into chat; rotate both once syncing is stable.
