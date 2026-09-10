# One-Shot Server Setup Script

## Goal
A single script the user uploads and runs once on the Quality server to finish everything that is still pending: create the five users, seed the SAP middleware settings, and import all 33,174 sales lines.

## What was already done on the server
- All migrations applied (zfisales_detail exists, 0 rows, roles present).

## Deliverable
A new script `deploy/quality-setup-all.sh` that runs, in order, with clear echo output per step and stop-on-error:

1. **Load config** — sources `/opt/MIS_Projects/Quality/backend/.env` (POSTGRES_PASSWORD, JWT_SECRET, SUPABASE_API or default http://10.10.4.165:9000/supabase).
2. **Create 5 users** — same logic as existing `deploy/create-users.sh`: Demo User, Sharvi Admin (super_admin), Bhavani Shankar Anupindi (admin), Ram Koti (user), Sunil Kumar Akula (user), all with temporary password `Welcome@2026`, profile fields (username, contact, plant, department) and role assignments. Idempotent-safe: skips auth users that already exist (case-insensitive email check), still fixes profile + role rows.
3. **Seed SAP settings** — runs `deploy/quality-sap-seed.sql` (SAP DEV system, Sales_Reports_KPI endpoint, request payload, crypto key, middleware config placeholder). Uses ON_ERROR_STOP so a partial failure is obvious. Re-runnable (UPSERT-style seed).
4. **Import sales data** — runs `deploy/import-zfisales.sql` (33,174 rows from the CSV you already have).
5. **Verify** — prints at the end:
   - user list (username, email, role)
   - `select count(*) from zfisales_detail;` (expect 33174)
   - SAP systems/endpoints list
6. **Middleware .env reminder** — prints the exact three lines to change in `/opt/MIS_Projects/Quality/middleware/.env` (PORT=3002, APP_BASE_URL=http://10.10.4.165:8081/middleware, strong MIDDLEWARE_SHARED_SECRET) and the `pm2 restart mis-q-middleware` command, since editing the .env file itself needs the user's chosen secret.

## How the user runs it
```bash
# from the project folder on the PC, upload deploy/ to the server (or it is already there)
cd /opt/MIS_Projects/Quality/deploy   # or wherever deploy/ sits on the server
chmod +x quality-setup-all.sh
./quality-setup-all.sh
```

## Technical details
- Bash script, `set -euo pipefail`.
- Uses `docker exec -i mis_q_db psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1` for all DB work (psql client is not installed on the host — must go through the container, same as the successful migration run).
- Auth user creation via curl to `$SUPABASE_API/auth/v1/admin/users` with the service-role key derived from JWT_SECRET (same approach as create-users.sh).
- Also update `deploy/README.md` with the one-shot instructions.
