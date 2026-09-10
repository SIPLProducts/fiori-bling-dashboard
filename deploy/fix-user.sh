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

if [[ ! "$EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
  echo "ERROR: '$EMAIL' is not a valid email address" >&2
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

# Escape a value for safe use as a SQL single-quoted string literal.
sql_lit() {
  local v="$1"
  v="${v//\'/\'\'}"
  printf "'%s'" "$v"
}

EMAIL_SQL="$(sql_lit "$EMAIL")"
EMAIL_LOWER_SQL="$(sql_lit "${EMAIL,,}")"
USERNAME_SQL="$(sql_lit "$USERNAME")"
ROLE_KEY_SQL="$(sql_lit "$ROLE_KEY")"
DISPLAY_NAME="$(python3 -c "import sys; print(sys.argv[1].replace('.', ' ').title())" "$USERNAME")"
DISPLAY_NAME_SQL="$(sql_lit "$DISPLAY_NAME")"

psql_exec() {
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i "$DB_CONTAINER" \
    psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"
}

USER_ID="$(psql_exec -At \
  -c "SELECT id FROM auth.users WHERE lower(email) = $EMAIL_LOWER_SQL LIMIT 1;")"

if [[ -z "$USER_ID" ]]; then
  echo "ERROR: no Auth account exists for $EMAIL" >&2
  echo "Create the account first, then run this repair script again." >&2
  exit 1
fi

if ! psql_exec -At \
  -c "SELECT 1 FROM public.roles WHERE key = $ROLE_KEY_SQL;" | grep -qx '1'; then
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

USER_ID_SQL="$(sql_lit "$USER_ID")"

echo "Repairing profile and role assignments ..."
psql_exec <<SQL
INSERT INTO public.profiles (
  id, email, username, first_name, last_name, display_name, status
)
VALUES (
  $USER_ID_SQL::uuid,
  $EMAIL_SQL,
  $USERNAME_SQL,
  $DISPLAY_NAME_SQL,
  NULL,
  $DISPLAY_NAME_SQL,
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  username = EXCLUDED.username,
  first_name = COALESCE(public.profiles.first_name, EXCLUDED.first_name),
  display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name),
  status = 'active',
  updated_at = now();

DELETE FROM public.user_role_assignments WHERE user_id = $USER_ID_SQL::uuid;
INSERT INTO public.user_role_assignments (user_id, role_key)
VALUES ($USER_ID_SQL::uuid, $ROLE_KEY_SQL);

DELETE FROM public.user_roles WHERE user_id = $USER_ID_SQL::uuid;
INSERT INTO public.user_roles (user_id, role)
VALUES (
  $USER_ID_SQL::uuid,
  CASE
    WHEN $ROLE_KEY_SQL IN ('super_admin', 'admin') THEN 'admin'::public.app_role
    WHEN $ROLE_KEY_SQL = 'buyer' THEN 'buyer'::public.app_role
    WHEN $ROLE_KEY_SQL = 'approver' THEN 'approver'::public.app_role
    ELSE 'viewer'::public.app_role
  END
);
SQL

echo
echo "Repair complete:"
psql_exec -c "
SELECT p.email, p.username, p.display_name, p.status, ura.role_key
FROM public.profiles p
LEFT JOIN public.user_role_assignments ura ON ura.user_id = p.id
WHERE p.id = $USER_ID_SQL::uuid;"
echo "You can now sign in with $EMAIL (or $USERNAME) and the password supplied to this script."
