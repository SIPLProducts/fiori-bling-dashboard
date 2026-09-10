#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# One-shot Quality server setup for the MIS portal.
#
# Runs everything that is still pending after migrations were applied:
#   1. Create the 5 portal users (profiles + roles, temp password Welcome@2026)
#   2. Seed the SAP settings (systems, Sales_Reports_KPI endpoint, payload)
#   3. Import all 33,174 sales lines into zfisales_detail
#   4. Verify and print a summary
#
# Usage on the server:
#   cd /opt/MIS_Projects/Quality/deploy
#   chmod +x quality-setup-all.sh
#   ./quality-setup-all.sh
#
# For Production: set DB_CONTAINER=mis_p_db and BACKEND_ENV to the
# Production backend .env path before running.
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_ENV="${BACKEND_ENV:-/opt/MIS_Projects/Quality/backend/.env}"
DB_CONTAINER="${DB_CONTAINER:-mis_q_db}"
export SUPABASE_API="${SUPABASE_API:-http://10.10.4.165:8081/supabase}"

echo "============================================================"
echo " MIS one-shot setup"
echo "   env file      : $BACKEND_ENV"
echo "   db container  : $DB_CONTAINER"
echo "   supabase api  : $SUPABASE_API"
echo "============================================================"

# --- Step 0: load secrets ----------------------------------------------------
if [[ ! -f "$BACKEND_ENV" ]]; then
  echo "ERROR: backend .env not found at $BACKEND_ENV" >&2
  exit 1
fi
set -a; source "$BACKEND_ENV"; set +a
: "${SERVICE_ROLE_KEY:?SERVICE_ROLE_KEY missing in $BACKEND_ENV}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD missing in $BACKEND_ENV}"

psql_exec() {
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i "$DB_CONTAINER" \
    psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"
}

# --- Step 1: users -----------------------------------------------------------
echo
echo "[1/4] Creating the 5 portal users ..."
# Make sure the 'user' role key exists (some installs only have super_admin,
# admin, buyer, approver, viewer). Harmless if it is already there.
psql_exec <<'SQL'
INSERT INTO public.roles (key, name, description, is_system, sort_order)
VALUES ('user', 'User', 'Standard end user', false, 50)
ON CONFLICT (key) DO NOTHING;
SQL
DB_CONTAINER="$DB_CONTAINER" bash "$SCRIPT_DIR/create-users.sh"

# --- Step 2: SAP settings ----------------------------------------------------
echo
echo "[2/4] Seeding SAP settings (systems, endpoints, payload) ..."
psql_exec < "$SCRIPT_DIR/quality-sap-seed.sql"

# --- Step 3: sales data ------------------------------------------------------
echo
echo "[3/4] Importing sales lines into zfisales_detail ..."
psql_exec -c "TRUNCATE public.zfisales_detail;"
zcat "$SCRIPT_DIR/zfisales_detail.csv.gz" | psql_exec \
  -c "COPY public.zfisales_detail FROM STDIN WITH (FORMAT csv, HEADER true);"

# --- Step 4: verify ----------------------------------------------------------
echo
echo "[4/4] Verification"
echo "----- Users -----"
psql_exec -c "select p.username, p.email, p.status, ura.role_key
              from public.profiles p
              left join public.user_role_assignments ura on ura.user_id = p.id
              order by p.email;"
echo "----- Sales data (expect 33174) -----"
psql_exec -c "select count(*) as zfisales_rows, round(sum(amount)/10000000,2) as total_sales_cr from public.zfisales_detail;"
echo "----- SAP settings -----"
psql_exec -c "select key, label, base_url, sap_client, is_active from public.sap_systems order by sort_order;"
psql_exec -c "select name, endpoint_path, scheduler_enabled, schedule_expression from public.sap_endpoints;"

# --- Middleware reminder -----------------------------------------------------
cat <<'EOF'

============================================================
 DONE. Last manual step — middleware .env
============================================================
Edit /opt/MIS_Projects/Quality/middleware/.env and set ONLY these lines:

  PORT=3002
  APP_BASE_URL=http://10.10.4.165:8081/middleware
  MIDDLEWARE_SHARED_SECRET=<a new long random string>

Then restart the middleware:

  pm2 restart mis-q-middleware   (or: pm2 start server.mjs --name mis-q-middleware)

In the portal, sign in as sharvi / Welcome@2026, open
Administration -> SAP API Settings -> Middleware, and save the
same shared secret there so the scheduler can call the middleware.
Everyone signs in with temporary password: Welcome@2026
============================================================
EOF
