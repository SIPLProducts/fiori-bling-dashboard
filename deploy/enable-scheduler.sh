#!/usr/bin/env bash
# Enable the on-prem SAP sync scheduler on an existing Quality or Production server.
# The middleware service already runs 24/7 under PM2, so it is the right place for
# the scheduler. This script installs the new dependencies, builds the shared sync
# bundle, and restarts the middleware.
#
# Usage:
#   ssh admin@app-dev
#   cd /opt/MIS_Projects/Quality/deploy
#   chmod +x enable-scheduler.sh
#   ./enable-scheduler.sh
#
# The script will fail loudly if SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY are
# missing from middleware/.env — add those first (see deploy/README.md).

set -euo pipefail

ENV=${ENV:-quality}
MIDDLEWARE_DIR=${MIDDLEWARE_DIR:-/opt/MIS_Projects/Quality/middleware}
PM2_NAME=${PM2_NAME:-mis-q-middleware}
PORT=${PORT:-3002}

if [[ "$ENV" == "production" ]]; then
  MIDDLEWARE_DIR=${MIDDLEWARE_DIR:-/opt/MIS_Projects/Production/middleware}
  PM2_NAME=${PM2_NAME:-mis-p-middleware}
  PORT=${PORT:-3010}
fi

echo "=== Enabling on-prem scheduler for $ENV ==="
echo "Middleware dir: $MIDDLEWARE_DIR"
echo "PM2 process:    $PM2_NAME"
echo ""

if [[ ! -d "$MIDDLEWARE_DIR" ]]; then
  echo "ERROR: middleware directory not found: $MIDDLEWARE_DIR"
  exit 1
fi

ENV_FILE="$MIDDLEWARE_DIR/.env"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "ERROR: middleware .env not found: $ENV_FILE"
  exit 1
fi

# Check the two new required variables are present and non-empty.
missing=0
for key in SUPABASE_URL SUPABASE_SERVICE_ROLE_KEY; do
  value=$(grep -E "^${key}=" "$ENV_FILE" | cut -d= -f2- | sed 's/^[[:space:]]*//;s/[[:space:]]*$//' || true)
  if [[ -z "$value" ]]; then
    echo "ERROR: $key is missing or empty in $ENV_FILE"
    missing=1
  fi
done

if [[ "$missing" -eq 1 ]]; then
  echo ""
  echo "Add these lines to $ENV_FILE (values are server-side only):"
  echo "  SUPABASE_URL=http://127.0.0.1:8000"
  echo "  SUPABASE_SERVICE_ROLE_KEY=<your service role key>"
  echo ""
  echo "Then run this script again."
  exit 1
fi

cd "$MIDDLEWARE_DIR"

echo "[1/4] Installing middleware dependencies..."
npm install

echo ""
echo "[2/4] Building shared sync bundle..."
npm run build:sync-core

echo ""
echo "[3/4] Restarting $PM2_NAME..."
pm2 restart "$PM2_NAME"

echo ""
echo "[4/4] Waiting for scheduler startup log..."
sleep 3
pm2 logs "$PM2_NAME" --lines 30 | grep -E "scheduler started|scheduler DISABLED|middleware listening" || true

echo ""
echo "=== Scheduler enabled ==="
echo ""
echo "Force a test run with:"
echo "  curl -X POST http://127.0.0.1:$PORT/sync/run \\"
echo "    -H 'content-type: application/json' \\"
echo "    -H \"x-shared-secret: \$(grep '^MIDDLEWARE_SHARED_SECRET=' $ENV_FILE | cut -d= -f2-)\" \\"
echo "    -d '{\"endpoint\":\"Sales_Reports_KPI\"}'"
echo ""
echo "Watch live logs with:"
echo "  pm2 logs $PM2_NAME"
