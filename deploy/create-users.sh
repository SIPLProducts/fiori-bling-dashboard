#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Recreate all portal users on a self-hosted MIS environment (Quality / Prod).
#
# Run this ONLY AFTER every migration in supabase/migrations/ has been applied
# successfully, otherwise public.profiles / public.user_role_assignments do not
# exist yet.
#
# Usage (Quality):
#   cd /opt/MIS_Projects/Quality/backend
#   set -a; source .env; set +a
#   bash create-users.sh
#
# For Production, change SUPABASE_API and DB_CONTAINER below (port 9000 /
# mis_p_db) before running.
# ---------------------------------------------------------------------------
set -euo pipefail

SUPABASE_API="${SUPABASE_API:-http://10.10.4.165:8081/supabase}"
DB_CONTAINER="${DB_CONTAINER:-mis_q_db}"
TEMP_PASSWORD="${TEMP_PASSWORD:-Welcome@2026}"

: "${SERVICE_ROLE_KEY:?SERVICE_ROLE_KEY must be set (source the backend .env first)}"
: "${POSTGRES_PASSWORD:?POSTGRES_PASSWORD must be set (source the backend .env first)}"

# email|username|first|last|contact|plant|department|role_key
USERS=(
  "masteradmin@sharviinfotech.com|sharvi|sharvi|admin|9090909090|||super_admin"
  "abshankar@hbl.in|44195|Bhavani Shankar|Anupindi|9393012944||IT Application|admin"
  "koti@hbl.in|51270|Ram|Koti|9898989898|1600|Sales|user"
  "sunilkumar@sharviinfotech.com|0056|Sunil Kumar|Akula|7989328372|1600|Devloper|user"
  "demo@nexus-portal.app|demo|Demo|User||||super_admin"
)


psql_exec() {
  docker exec -e PGPASSWORD="$POSTGRES_PASSWORD" -i "$DB_CONTAINER" \
    psql -U supabase_admin -d postgres -v ON_ERROR_STOP=1 "$@"
}

echo "Creating Auth accounts (temporary password: $TEMP_PASSWORD)"
for row in "${USERS[@]}"; do
  IFS='|' read -r email username first last contact plant department role <<<"$row"
  echo "  -> $email"
  curl -sS -X POST "$SUPABASE_API/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -d "$(cat <<JSON
{"email":"$email","password":"$TEMP_PASSWORD","email_confirm":true,
 "user_metadata":{"username":"$username","first_name":"$first","last_name":"$last"}}
JSON
)" >/dev/null || echo "     (already exists — continuing)"
done

echo "Filling in profiles and role assignments"
for row in "${USERS[@]}"; do
  IFS='|' read -r email username first last contact plant department role <<<"$row"
  psql_exec <<SQL
UPDATE public.profiles SET
  username      = NULLIF('$username',''),
  first_name    = NULLIF('$first',''),
  last_name     = NULLIF('$last',''),
  display_name  = NULLIF(trim('$first $last'),''),
  contact       = NULLIF('$contact',''),
  plant         = NULLIF('$plant',''),
  department    = NULLIF('$department',''),
  email         = '$email',
  status        = 'active'
WHERE id = (SELECT id FROM auth.users WHERE email = '$email');

DELETE FROM public.user_role_assignments
WHERE user_id = (SELECT id FROM auth.users WHERE email = '$email');

INSERT INTO public.user_role_assignments (user_id, role_key)
SELECT id, '$role' FROM auth.users WHERE email = '$email';

INSERT INTO public.user_roles (user_id, role)
SELECT id, CASE WHEN '$role' IN ('super_admin','admin') THEN 'admin'::public.app_role
                ELSE 'viewer'::public.app_role END
FROM auth.users WHERE email = '$email'
ON CONFLICT (user_id, role) DO NOTHING;
SQL
done

echo
echo "Done. Users on this environment:"
psql_exec -c "select p.email, p.username, p.status, ura.role_key
              from public.profiles p
              left join public.user_role_assignments ura on ura.user_id = p.id
              order by p.email;"
echo
echo "Everyone signs in with the temporary password '$TEMP_PASSWORD' and should change it."
