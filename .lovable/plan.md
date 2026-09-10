# Fix the two remaining Quality problems

## Cause 1 — the database key line is broken

Your `middleware/.env` contains the key twice:

```text
 SUPABASE_SERVICE_ROLE_KEY==eyJhbGciOi...     <- extra leading space AND an extra "="
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...       <- correct line
```

The service reads the file top to bottom and keeps the **first** value it finds, so it is using the broken one whose value begins with `=`. The database rejects it, which is exactly the `Invalid authentication credentials` message. The good line below is never used.

## Cause 2 — why it says port 3000

Your file does say `PORT=3002`. But the file only fills in values that are not already present in the running environment. Earlier the terminal ran `source backend/.env`, which put that file's `PORT` into the shell, and `pm2 restart --update-env` copied the whole shell into the service — so the shell value beat the file. Starting the process from a clean terminal without `--update-env` fixes it.

## Step 1 — Remove the broken duplicate line

In a **fresh terminal** (do not `source` anything):

```bash
cd /opt/MIS_Projects/Quality/middleware
cp .env .env.backup
sed -i '/^[[:space:]]\+SUPABASE_SERVICE_ROLE_KEY=/d' .env
grep -c 'SUPABASE_SERVICE_ROLE_KEY' .env    # must print 1
```

Then open the file and check the remaining key line is complete on a single line with no space before the name and exactly one `=`:

```bash
nano .env
```

## Step 2 — Restart cleanly so the file's port is used

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

Then wait one minute and confirm no new `Invalid authentication credentials` line.

## Step 3 — Force one sync to confirm

```bash
curl -X POST http://127.0.0.1:3002/sync/run \
  -H 'content-type: application/json' \
  -H 'x-shared-secret: bf4a75740a9b2655be4bd2bc08745c4a' \
  -d '{"endpoint":"Sales_Reports_KPI"}'
```

The earlier `secret-rejected` reply was only because the placeholder text `<your shared secret>` was sent literally.

## Step 4 — Only if the key is still rejected

Check the key the database itself accepts, without printing it:

```bash
cd /opt/MIS_Projects/Quality
A=$(grep -m1 '^SERVICE_ROLE_KEY=' backend/.env | cut -d= -f2-)
curl -s -o /dev/null -w '%{http_code}\n' \
  -H "apikey: $A" -H "Authorization: Bearer $A" \
  'http://127.0.0.1:8000/rest/v1/sap_endpoints?select=id&limit=1'
unset A
```

- `200` — the backend key is good; copy exactly that value into `middleware/.env` and repeat Step 2.
- `401` — the backend's own key no longer matches the running database, and the backend stack must be brought back in sync before the scheduler can write.

## Security note

The SAP password and middleware secret were pasted into chat. Once the scheduler is running, both should be changed to new values (update `middleware/.env` and the portal's stored secret together).

## After it works

The five-minute schedule saved in SAP API Settings runs on its own, and the Scheduler tab shows real last-run times, record counts, and history.
