# Correct the Quality middleware port without touching the code

## Confirmed status

The middleware is running correctly (`v1.3.0`) and the scheduler starts. The Node 20 message is only a future-support warning.

The remaining issue is that PM2 has `PORT=3000` saved in its environment. That value takes priority over `PORT=3002` in `.env`, so nothing listens on port 3002.

## Run these commands exactly

Do not source `backend/.env`, and do not run `pm2 flush`.

```bash
cd /opt/MIS_Projects/Quality/middleware

pm2 delete mis-q-middleware

env -u PORT -u SUPABASE_SERVICE_ROLE_KEY \
  pm2 start /opt/MIS_Projects/Quality/middleware/server.mjs \
  --name mis-q-middleware \
  --cwd /opt/MIS_Projects/Quality/middleware

pm2 save
pm2 logs mis-q-middleware --lines 20 --nostream
```

Expected line:

```text
[mis-sap-middleware] v1.3.0 listening on :3002
```

## Test the running middleware

Only after the log shows port 3002:

```bash
cd /opt/MIS_Projects/Quality/middleware
SECRET=$(grep -m1 '^MIDDLEWARE_SHARED_SECRET=' .env | cut -d= -f2-)

curl -X POST http://127.0.0.1:3002/sync/run \
  -H 'content-type: application/json' \
  -H "x-shared-secret: $SECRET" \
  -d '{"endpoint":"Sales_Reports_KPI"}'

unset SECRET
```

The first command is `cd`, not `d`.

## If it still prints port 3000

Run this diagnostic without exposing any secrets:

```bash
pm2 env 0 | grep '^PORT:'
```

If it prints `PORT: 3000`, start the process with the required value explicitly:

```bash
cd /opt/MIS_Projects/Quality/middleware
pm2 delete mis-q-middleware
PORT=3002 pm2 start server.mjs --name mis-q-middleware
pm2 save
```

## Security follow-up

The SAP password and middleware secret were pasted into chat. Rotate both after synchronization is confirmed.
