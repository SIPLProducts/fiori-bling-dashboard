#!/usr/bin/env bash
# Repair an existing self-hosted MIS user: reset the Auth password, confirm the
# email, activate/upsert the portal profile, and synchronize role assignments.
#
# Quality example:
#   ./fix-user.sh masteradmin@sharviinfotech.com 'NewStrongPassword' super_admin sharvi
#
# Production example:
#   DB_CONTAINER=mis_p_db \
#   SUPABASE_API=http://10.10.4.165:9000/supabase \
#   BACKEND_ENV=/opt/MIS_Projects/Production/backend/.env \
#   ./fix-user.sh masteradmin@sharviinfotech.com 'NewStrongPassword' super_admin sharvi
set -euo pipefail

EMAIL="${1:?Usage: $0 EMAIL PASSWORD [ROLE_KEY] [USERNAME]}"
NEW_PASSWORD="${2:?Usage: $0 EMAIL PASSWORD [ROLE_KEY] [USERNAME]}"
ROLE_KEY="${3:-super_admin}"
USERNAME="${4:-${EMAIL%%@*}}"

BACKEND_ENV="${BACKEND_ENV:-/opt/MIS_Projects/Quality/backend/.env}"
DB_CONTAINER="${DB_CONTAINER:-mis_q_db}"
SUPABASE_API="${SUPABASE_API:-http://10.10.4.165:8081/supabase}"

if [[ ! -f "$BACKEND_ENV" ]]; then
  echo "ERROR: backend environment file not found: $BACKEND_ENV" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$BACKEND_ENV"
set +a

: "${SERVICE_ROLE_KEY:?SERVICE_ROLE_KEY missing in $BACKEND_ENV}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD missing in $BACKEND_ENV}"

if (( ${#NEW_PASSWORD} < 8 )); then
  echo "ERROR: password must contain at least 8 characters" >&2
  exit 1
fi

if [[ ! "$ROLE_KEY" =~ ^[a-z0-9_]+$ ]]; then
  echo "ERROR: role key may contain only lowercase letters, numbers and underscores" >&2
  exit 1
fi

if [[ ! "$USERNAME" =~ ^[A-Za-z0-9._-]+$ ]]; then
  echo "ERROR: username may contain only letters, numbers, dots, underscores and hyphens" >&2
  exit 1
fi

psql_exec() {
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i "$DB_CONTAINER" \
    psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"
}

USER_ID="$(psql_exec -At -v user_email="$EMAIL" \
  -c "SELECT id FROM auth.users WHERE lower(email) = lower(:'user_email') LIMIT 1;")"

if [[ -z "$USER_ID" ]]; then
  echo "ERROR: no Auth account exists for $EMAIL" >&2
  echo "Create the account first, then run this repair script again." >&2
  exit 1
fi

if ! psql_exec -At -v role_key="$ROLE_KEY" \
  -c "SELECT 1 FROM public.roles WHERE key = :'role_key';" | grep -qx '1'; then
  echo "ERROR: role '$ROLE_KEY' does not exist in public.roles" >&2
  exit 1
fi

PAYLOAD="$(PASSWORD="$NEW_PASSWORD" python3 - <<'PY'
import json
import os

print(json.dumps({"password": os.environ["PASSWORD"], "email_confirm": True}))
PY
)"
RESPONSE_FILE="$(mktemp)"
trap 'rm -f "$RESPONSE_FILE"' EXIT

echo "Resetting password and confirming email for $EMAIL ..."
HTTP_STATUS="$(curl -sS -o "$RESPONSE_FILE" -w '%{http_code}' \
  -X PUT "$SUPABASE_API/auth/v1/admin/users/$USER_ID" \
  -H "apikey: $SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  --data "$PAYLOAD")"

if [[ ! "$HTTP_STATUS" =~ ^2 ]]; then
  echo "ERROR: Auth password update failed (HTTP $HTTP_STATUS)" >&2
  cat "$RESPONSE_FILE" >&2
  echo >&2
  exit 1
fi

echo "Repairing profile and role assignments ..."
psql_exec \
  -v user_id="$USER_ID" \
  -v user_email="$EMAIL" \
  -v username="$USERNAME" \
  -v role_key="$ROLE_KEY" <<'SQL'
INSERT INTO public.profiles (
  id, email, username, first_name, last_name, display_name, status
)
VALUES (
  :'user_id'::uuid,
  :'user_email',
  :'username',
  initcap(replace(:'username', '.', ' ')),
  NULL,
  initcap(replace(:'username', '.', ' ')),
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
  display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
  status = 'active',
  updated_at = now();

DELETE FROM public.user_role_assignments WHERE user_id = :'user_id'::uuid;
INSERT INTO public.user_role_assignments (user_id, role_key)
VALUES (:'user_id'::uuid, :'role_key');

DELETE FROM public.user_roles WHERE user_id = :'user_id'::uuid;
INSERT INTO public.user_roles (user_id, role)
VALUES (
  :'user_id'::uuid,
  CASE
    WHEN :'role_key' IN ('super_admin', 'admin') THEN 'admin'::public.app_role
    WHEN :'role_key' = 'buyer' THEN 'buyer'::public.app_role
    WHEN :'role_key' = 'approver' THEN 'approver'::public.app_role
    ELSE 'viewer'::public.app_role
  END
);
SQL

echo
echo "Repair complete:"
psql_exec -v user_id="$USER_ID" -c "
SELECT p.email, p.username, p.display_name, p.status, ura.role_key
FROM public.profiles p
LEFT JOIN public.user_role_assignments ura ON ura.user_id = p.id
WHERE p.id = :'user_id'::uuid;"
echo "You can now sign in with $EMAIL (or $USERNAME) and the password supplied to this script."