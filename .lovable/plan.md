# Fix the Quality scheduler: wrong port and rejected database key

## What the latest logs confirm

- The Node 20 WebSocket problem is gone. Middleware `v1.3.0` starts and prints `scheduler started`.
- Two problems remain:
  1. It now says `listening on :3000` instead of `:3002`. Nginx forwards to `127.0.0.1:3002`, so the portal cannot reach it on 3000.
  2. `scheduler tick failed: Invalid authentication credentials` — the database key the scheduler is using is not accepted.

Both have the same root cause. `source backend/.env` in the terminal exported that file's variables (including `PORT`) into the shell, and `pm2 restart --update-env` copied the whole shell environment into the service. The service's own `.env` loader only fills in values that are **not** already set, so those shell values won over `middleware/.env`.

## Step 1 — Put the key in the file, not in the environment

Run this in a **fresh terminal** (do not source anything first):

```bash
cd /opt/MIS_Projects/Quality

KEY=$(grep -m1 '^SERVICE_ROLE_KEY=' backend/.env | cut -d= -f2- | tr -d '"'"'"' \r')
[ -n "$KEY" ] || echo "SERVICE_ROLE_KEY not found in backend/.env"

sed -i '/^SUPABASE_SERVICE_ROLE_KEY=/d' middleware/.env
printf 'SUPABASE_SERVICE_ROLE_KEY=%s\n' "$KEY" >> middleware/.env
unset KEY

grep -c '^SUPABASE_SERVICE_ROLE_KEY=' middleware/.env   # must print 1
grep -m1 '^PORT=' middleware/.env                        # must print PORT=3002
```

## Step 2 — Restart with a clean environment

`--update-env` is what pushed the wrong port in, so delete and start the process fresh:

```bash
cd /opt/MIS_Projects/Quality/middleware
pm2 delete mis-q-middleware
pm2 start server.mjs --name mis-q-middleware
pm2 save
pm2 flush mis-q-middleware
pm2 logs mis-q-middleware --lines 30
```

Expected:

```text
v1.3.0 listening on :3002
portal database      : http://127.0.0.1:8000
service role key     : configured
scheduler started — schedules are read from the portal every minute
```

Wait one minute and confirm no new `Invalid authentication credentials` line appears.

## Step 3 — Manual sync test with the real secret

```bash
cd /opt/MIS_Projects/Quality/middleware
SECRET=$(grep -m1 '^MIDDLEWARE_SHARED_SECRET=' .env | cut -d= -f2-)

curl -X POST http://127.0.0.1:3002/sync/run \
  -H 'content-type: application/json' \
  -H "x-shared-secret: $SECRET" \
  -d '{"endpoint":"Sales_Reports_KPI"}'

unset SECRET
```

The earlier `secret-rejected` reply happened only because the placeholder text `<your shared secret>` was sent literally.

## Step 4 — If the key is still rejected

Confirm the key the database actually expects, without printing any secret:

```bash
cd /opt/MIS_Projects/Quality
A=$(grep -m1 '^SERVICE_ROLE_KEY=' backend/.env | cut -d= -f2-)
B=$(grep -m1 '^SUPABASE_SERVICE_ROLE_KEY=' middleware/.env | cut -d= -f2-)
[ "$A" = "$B" ] && echo "keys match" || echo "keys differ"

curl -s -o /dev/null -w '%{http_code}\n' \
  -H "apikey: $A" -H "Authorization: Bearer $A" \
  'http://127.0.0.1:8000/rest/v1/sap_endpoints?select=id&limit=1'
unset A B
```

- `200` means the backend key is valid and only the middleware copy was wrong — repeat Step 1.
- `401` means the Quality backend's own service role key in `backend/.env` no longer matches the running database containers (usually after a JWT secret change), and the backend stack must be restarted with matching keys before the scheduler can write.

## After it works

The five-minute schedule saved in SAP API Settings runs automatically, the Scheduler tab shows real last-run times and record counts, and no further manual triggering is needed.
