#!/usr/bin/env bash
# In-place MIS Production upgrade from the 24-Aug-2026 release.
# Run only on 10.10.4.165 after pulling the latest repository.
set -Eeuo pipefail
umask 077

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
QUALITY_ROOT="${QUALITY_ROOT:-/opt/MIS_Projects/Quality}"
PRODUCTION_ROOT="${PRODUCTION_ROOT:-/opt/MIS_Projects/Production}"
QUALITY_ENV="$QUALITY_ROOT/backend/.env"
PRODUCTION_ENV="$PRODUCTION_ROOT/backend/.env"
QUALITY_DB="${QUALITY_DB:-mis_q_db}"
PRODUCTION_DB="${PRODUCTION_DB:-mis_p_db}"
PM2_NAME="mis-p-middleware"
STAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$PRODUCTION_ROOT/backups/upgrade-$STAMP"
MIGRATION_CUTOFF="20260824"

die() { echo "ERROR: $*" >&2; exit 1; }
env_value() {
  local file="$1" key="$2"
  awk -F= -v key="$key" '$1 == key { sub(/^[^=]*=/, ""); print; exit }' "$file"
}
sql_q() { docker exec -i "$QUALITY_DB" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"; }
sql_p() { docker exec -i "$PRODUCTION_DB" psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"; }

if [[ "${1:-}" != "--confirm-copy-quality" ]]; then
  cat <<'EOF'
This upgrades the existing Production installation and REPLACES its portal
users, permissions, SAP settings, sync history, and sales rows with Quality.

Run again with the explicit confirmation flag:
  sudo ./production-upgrade-all.sh --confirm-copy-quality
EOF
  exit 2
fi

[[ "$(id -u)" -eq 0 ]] || die "Run with sudo so backups, Nginx, and PM2 can be updated."
for cmd in docker npm rsync curl gzip sed awk nginx pm2; do command -v "$cmd" >/dev/null || die "$cmd is required"; done
for file in "$QUALITY_ENV" "$PRODUCTION_ENV" "$SCRIPT_DIR/nginx/mis-production.conf" \
  "$SCRIPT_DIR/docker/docker-compose.production.yml" "$SCRIPT_DIR/middleware.production.env.example"; do
  [[ -f "$file" ]] || die "Required file not found: $file"
done
docker inspect "$QUALITY_DB" >/dev/null 2>&1 || die "$QUALITY_DB is not running"
docker inspect "$PRODUCTION_DB" >/dev/null 2>&1 || die "$PRODUCTION_DB is not running"

PROD_ANON="$(env_value "$PRODUCTION_ENV" ANON_KEY)"
PROD_SERVICE="$(env_value "$PRODUCTION_ENV" SERVICE_ROLE_KEY)"
QUALITY_MW_ENV="$QUALITY_ROOT/middleware/.env"
[[ -n "$PROD_ANON" && -n "$PROD_SERVICE" ]] || die "Production ANON_KEY or SERVICE_ROLE_KEY is missing"
[[ -f "$QUALITY_MW_ENV" ]] || die "Working Quality middleware .env is missing"
MW_SECRET="$(env_value "$QUALITY_MW_ENV" MIDDLEWARE_SHARED_SECRET)"
SAP_DEV_BASE="$(env_value "$QUALITY_MW_ENV" SAP_DEV_BASE_URL)"
SAP_DEV_CLIENT="$(env_value "$QUALITY_MW_ENV" SAP_DEV_CLIENT)"
SAP_DEV_USER="$(env_value "$QUALITY_MW_ENV" SAP_DEV_USER)"
SAP_DEV_PASSWORD="$(env_value "$QUALITY_MW_ENV" SAP_DEV_PASSWORD)"
[[ -n "$MW_SECRET" && -n "$SAP_DEV_PASSWORD" ]] || die "Quality middleware secret or SAP password is missing"

mkdir -p "$BACKUP_DIR"
echo "[1/10] Backing up existing Production into $BACKUP_DIR"
docker exec "$PRODUCTION_DB" pg_dump -U supabase_admin -d postgres | gzip > "$BACKUP_DIR/production-before.sql.gz"
[[ -d "$PRODUCTION_ROOT/frontend/dist" ]] && tar -C "$PRODUCTION_ROOT/frontend" -czf "$BACKUP_DIR/frontend.tgz" dist
[[ -d "$PRODUCTION_ROOT/middleware" ]] && tar -C "$PRODUCTION_ROOT" -czf "$BACKUP_DIR/middleware.tgz" middleware
[[ -f /etc/nginx/sites-available/mis-production.conf ]] && cp /etc/nginx/sites-available/mis-production.conf "$BACKUP_DIR/nginx.conf"
cp "$PRODUCTION_ENV" "$BACKUP_DIR/backend.env"

echo "[2/10] Updating Production deployment files without touching Docker volumes"
mkdir -p "$PRODUCTION_ROOT/backend" "$PRODUCTION_ROOT/supabase/migrations" "$PRODUCTION_ROOT/frontend/dist" "$PRODUCTION_ROOT/middleware"
cp "$SCRIPT_DIR/docker/docker-compose.production.yml" "$PRODUCTION_ROOT/backend/docker-compose.production.yml"
[[ -d "$SCRIPT_DIR/docker/supabase" ]] && rsync -a "$SCRIPT_DIR/docker/supabase/" "$PRODUCTION_ROOT/backend/supabase/"
rsync -a "$REPO_ROOT/supabase/migrations/" "$PRODUCTION_ROOT/supabase/migrations/"

echo "[3/10] Applying migrations after 24-Aug-2026 once each"
sql_p <<'SQL'
CREATE SCHEMA IF NOT EXISTS mis_deploy;
CREATE TABLE IF NOT EXISTS mis_deploy.applied_migrations (
  filename text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);
SQL
shopt -s nullglob
for migration in "$REPO_ROOT"/supabase/migrations/*.sql; do
  name="$(basename "$migration")"
  [[ "$name" > "$MIGRATION_CUTOFF" ]] || continue
  applied="$(sql_p -Atqc "select 1 from mis_deploy.applied_migrations where filename = '$name'")"
  if [[ "$applied" == "1" ]]; then echo "  skip $name"; continue; fi
  echo "  apply $name"
  sql_p < "$migration"
  sql_p -c "insert into mis_deploy.applied_migrations(filename) values ('$name')"
done

echo "[4/10] Exporting the current Quality users, permissions, SAP settings, and sales data"
COPY_SQL="$BACKUP_DIR/quality-application-data.sql"
docker exec "$QUALITY_DB" pg_dump -U supabase_admin -d postgres --data-only --disable-triggers --column-inserts \
  -t auth.users -t auth.identities \
  -t public.profiles -t public.user_roles -t public.roles -t public.role_screens -t public.user_role_assignments \
  -t public.sap_systems -t public.sap_endpoints -t public.sap_middleware_config \
  -t public.sap_table_mappings -t public.sap_table_fields -t public.sap_sync_runs \
  -t public.zfisales_detail > "$COPY_SQL"

echo "[5/10] Replacing Production application data with the Quality snapshot"
pm2 stop "$PM2_NAME" >/dev/null 2>&1 || true
sql_p <<'SQL'
BEGIN;
SET LOCAL session_replication_role = replica;
TRUNCATE auth.identities, auth.users,
  public.user_role_assignments, public.user_roles, public.role_screens, public.roles, public.profiles,
  public.sap_sync_runs, public.sap_table_fields, public.sap_table_mappings,
  public.sap_endpoints, public.sap_systems, public.sap_middleware_config,
  public.zfisales_detail CASCADE;
COMMIT;
SQL
sql_p < "$COPY_SQL"
# Keep schedules paused until the Production bridge and one manual sync pass.
sql_p -c "update public.sap_endpoints set scheduler_enabled = false"
sql_p -c "update public.sap_middleware_config set middleware_port=3010, middleware_url='http://10.10.4.165:9000/middleware'"

echo "[6/10] Building and installing the Production frontend"
cd "$REPO_ROOT"
VITE_SUPABASE_URL="http://10.10.4.165:9000/supabase" \
VITE_SUPABASE_PUBLISHABLE_KEY="$PROD_ANON" \
VITE_SUPABASE_PROJECT_ID="mis-production" npm run build:static
rm -rf "$PRODUCTION_ROOT/frontend/dist.new"
mkdir -p "$PRODUCTION_ROOT/frontend/dist.new"
rsync -a --delete "$REPO_ROOT/dist/" "$PRODUCTION_ROOT/frontend/dist.new/"
mv "$PRODUCTION_ROOT/frontend/dist" "$PRODUCTION_ROOT/frontend/dist.old-$STAMP"
mv "$PRODUCTION_ROOT/frontend/dist.new" "$PRODUCTION_ROOT/frontend/dist"

echo "[7/10] Installing the missing Production middleware"
rsync -a --delete --exclude .env --exclude node_modules --exclude logs \
  "$REPO_ROOT/middleware/" "$PRODUCTION_ROOT/middleware/"
cat > "$PRODUCTION_ROOT/middleware/.env" <<EOF
PORT=3010
APP_BASE_URL=http://10.10.4.165:9000/middleware
MIDDLEWARE_SHARED_SECRET=$MW_SECRET
SAP_TIMEOUT_MS=600000
SAP_DEV_BASE_URL=$SAP_DEV_BASE
SAP_DEV_CLIENT=$SAP_DEV_CLIENT
SAP_DEV_USER=$SAP_DEV_USER
SAP_DEV_PASSWORD=$SAP_DEV_PASSWORD
SAP_QUALITY_BASE_URL=
SAP_QUALITY_CLIENT=
SAP_QUALITY_USER=
SAP_QUALITY_PASSWORD=
SAP_PROD_BASE_URL=
SAP_PROD_CLIENT=
SAP_PROD_USER=
SAP_PROD_PASSWORD=
SUPABASE_URL=http://127.0.0.1:9010
SUPABASE_SERVICE_ROLE_KEY=$PROD_SERVICE
EOF
chmod 600 "$PRODUCTION_ROOT/middleware/.env"
cd "$PRODUCTION_ROOT/middleware"
npm install
npm run build:sync-core
pm2 delete "$PM2_NAME" >/dev/null 2>&1 || true
env -u PORT -u SUPABASE_URL -u SUPABASE_SERVICE_ROLE_KEY pm2 start server.mjs --name "$PM2_NAME" --cwd "$PRODUCTION_ROOT/middleware"
pm2 save

echo "[8/10] Updating Nginx on port 9000"
NGINX_TMP="$BACKUP_DIR/mis-production.conf"
sed "s|<MIDDLEWARE_SHARED_SECRET>|$MW_SECRET|g" "$SCRIPT_DIR/nginx/mis-production.conf" > "$NGINX_TMP"
cp "$NGINX_TMP" /etc/nginx/sites-available/mis-production.conf
ln -sfn /etc/nginx/sites-available/mis-production.conf /etc/nginx/sites-enabled/mis-production.conf
nginx -t
systemctl reload nginx

echo "[9/10] Testing Production services and one manual SAP synchronization"
for i in $(seq 1 30); do curl -fsS http://127.0.0.1:9000/healthz >/dev/null && break; sleep 1; done
curl -fsS -H "x-shared-secret: $MW_SECRET" http://127.0.0.1:3010/health >/dev/null
curl -fsS -H "x-shared-secret: $MW_SECRET" http://127.0.0.1:9000/sap-mw/health >/dev/null
curl -fsS -X POST http://127.0.0.1:3010/sync/run \
  -H 'content-type: application/json' -H "x-shared-secret: $MW_SECRET" \
  -d '{"endpoint":"Sales_Reports_KPI"}' > "$BACKUP_DIR/manual-sync-result.json"
grep -q '"ok":true' "$BACKUP_DIR/manual-sync-result.json" || die "Manual SAP sync failed; scheduler remains disabled"

echo "[10/10] Restoring copied schedules and verifying counts"
sql_p <<SQL
UPDATE public.sap_endpoints p
SET scheduler_enabled = q.scheduler_enabled,
    schedule_expression = q.schedule_expression
FROM dblink('host=host.docker.internal port=5432 dbname=postgres', 'select name, scheduler_enabled, schedule_expression from public.sap_endpoints')
  AS q(name text, scheduler_enabled boolean, schedule_expression text)
WHERE p.name = q.name;
SQL
# dblink may not be available/reachable; restore enabled state directly from the dump when known.
if ! sql_p -Atqc "select bool_or(scheduler_enabled) from public.sap_endpoints" | grep -qx t; then
  sql_p -c "update public.sap_endpoints set scheduler_enabled = true where is_active and coalesce(schedule_expression,'') <> ''"
fi
sql_p -c "select count(*) as production_users from public.profiles"
sql_p -c "select count(*) as production_sales_rows, round(sum(amount)/10000000,2) as total_sales_cr from public.zfisales_detail"
pm2 restart "$PM2_NAME"
pm2 save

echo
echo "PRODUCTION UPGRADE COMPLETE"
echo "Portal:  http://10.10.4.165:9000"
echo "Backup:  $BACKUP_DIR"
echo "Logs:    pm2 logs $PM2_NAME --lines 50"