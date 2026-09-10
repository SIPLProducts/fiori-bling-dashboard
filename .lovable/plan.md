# Fix the remaining Quality scheduler authentication error

## Confirmed current state

- The Node.js 20 WebSocket problem is fixed. The newest log lines show middleware `v1.3.0`, `scheduler started`, and port `3002`.
- The earlier WebSocket stack traces are old PM2 log entries, not the current failure.
- The current failure is `scheduler tick failed: Invalid authentication credentials`. The value saved as `SUPABASE_SERVICE_ROLE_KEY` in the middleware `.env` does not match the Quality backend's real `SERVICE_ROLE_KEY`.
- The manual test returned `secret-rejected` because the command sent the literal placeholder `<your shared secret>`, not the configured middleware secret.

## Safe server correction

Run these commands on the Quality server. They copy the existing Quality backend key into middleware configuration without displaying it:

```bash
cd /opt/MIS_Projects/Quality

set -a
source backend/.env
set +a

test -n "$SERVICE_ROLE_KEY" || { echo "SERVICE_ROLE_KEY missing in backend/.env"; exit 1; }

sed -i '/^SUPABASE_SERVICE_ROLE_KEY=/d' middleware/.env
printf 'SUPABASE_SERVICE_ROLE_KEY=%s\n' "$SERVICE_ROLE_KEY" >> middleware/.env
unset SERVICE_ROLE_KEY

pm2 flush mis-q-middleware
pm2 restart mis-q-middleware --update-env
pm2 logs mis-q-middleware --lines 30
```

Expected fresh lines:

```text
v1.3.0 listening on :3002
scheduler started — schedules are read from the portal every minute
```

There should be no new `Invalid authentication credentials` message after the next scheduler tick.

## Correct manual sync test

Use the actual secret already stored in `middleware/.env`; do not type the placeholder:

```bash
cd /opt/MIS_Projects/Quality/middleware
set -a
source .env
set +a

curl -X POST http://127.0.0.1:3002/sync/run \
  -H 'content-type: application/json' \
  -H "x-shared-secret: $MIDDLEWARE_SHARED_SECRET" \
  -d '{"endpoint":"Sales_Reports_KPI"}'

unset MIDDLEWARE_SHARED_SECRET SAP_DEV_PASSWORD SAP_QUALITY_PASSWORD SAP_PROD_PASSWORD
```

A successful response will include the run status and record counts. The Scheduler screen should then show the last run and history, and the saved dynamic five-minute schedule will continue automatically.

## If authentication still fails

Check only whether the two keys match, without printing either secret:

```bash
cd /opt/MIS_Projects/Quality
BACKEND_KEY=$(grep '^SERVICE_ROLE_KEY=' backend/.env | cut -d= -f2-)
MIDDLEWARE_KEY=$(grep '^SUPABASE_SERVICE_ROLE_KEY=' middleware/.env | cut -d= -f2-)
[ "$BACKEND_KEY" = "$MIDDLEWARE_KEY" ] && echo "Keys match" || echo "Keys do not match"
unset BACKEND_KEY MIDDLEWARE_KEY
```

If they match but the database still rejects authentication, the Quality backend key itself was changed or is stale and must be regenerated from the self-hosted backend configuration before restarting middleware.
