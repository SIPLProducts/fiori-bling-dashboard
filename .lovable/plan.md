# Restore the Quality scheduler settings

## What your latest screen shows

- The active `middleware/.env` has `PORT=3002`, which is correct.
- The active file currently ends at `SUPABASE_URL`; it has **no** `SUPABASE_SERVICE_ROLE_KEY`, so the scheduler cannot authenticate.
- `.env.backup` contains the malformed key with a leading space and two `=` characters. Do not copy that line.
- Port 3000 came from values previously saved in PM2's process environment. Recreating the PM2 process makes it read port 3002 from the active file.

## 1. Copy the valid key directly from the backend file

Close Nano, then run this in a fresh terminal without sourcing any file:

```bash
cd /opt/MIS_Projects/Quality

KEY=$(grep -m1 '^SERVICE_ROLE_KEY=' backend/.env | cut -d= -f2- | tr -d '\r')
[ -n "$KEY" ] || { echo "SERVICE_ROLE_KEY missing in backend/.env"; exit 1; }

sed -i '/^[[:space:]]*SUPABASE_SERVICE_ROLE_KEY=/d' middleware/.env
printf 'SUPABASE_SERVICE_ROLE_KEY=%s\n' "$KEY" >> middleware/.env
unset KEY

grep -c '^SUPABASE_SERVICE_ROLE_KEY=' middleware/.env
grep -m1 '^PORT=' middleware/.env
```

The last two commands must print:

```text
1
PORT=3002
```

Do not open or copy the key from `.env.backup`; that copy is malformed.

## 2. Recreate the PM2 process with a clean environment

```bash
cd /opt/MIS_Projects/Quality/middleware
pm2 delete mis-q-middleware
pm2 start server.mjs --name mis-q-middleware
pm2 save
pm2 flush mis-q-middleware
pm2 logs mis-q-middleware --lines 30
```

Expected fresh messages:

```text
v1.3.0 listening on :3002
service role key     : configured
scheduler started — schedules are read from the portal every minute
```

Wait one minute. There should be no new `Invalid authentication credentials` message.

## 3. Force one sync using the secret from the file

```bash
cd /opt/MIS_Projects/Quality/middleware
SECRET=$(grep -m1 '^MIDDLEWARE_SHARED_SECRET=' .env | cut -d= -f2-)

curl -X POST http://127.0.0.1:3002/sync/run \
  -H 'content-type: application/json' \
  -H "x-shared-secret: $SECRET" \
  -d '{"endpoint":"Sales_Reports_KPI"}'

unset SECRET
```

The earlier rejected request used the placeholder text instead of the actual secret.

## 4. If authentication is still rejected

Test the backend key itself without printing it:

```bash
cd /opt/MIS_Projects/Quality
KEY=$(grep -m1 '^SERVICE_ROLE_KEY=' backend/.env | cut -d= -f2- | tr -d '\r')
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "apikey: $KEY" -H "Authorization: Bearer $KEY" \
  'http://127.0.0.1:8000/rest/v1/sap_endpoints?select=id&limit=1'
unset KEY
```

- `200`: the key is valid; repeat steps 1 and 2.
- `401`: the key in `backend/.env` does not match the running Quality backend and that backend configuration must be corrected.

## Security follow-up

The SAP password and middleware secret were pasted into chat. After synchronization works, rotate both values and update the middleware file and portal setting together.
