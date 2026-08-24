-- Supabase self-hosting: give the internal service roles a password.
-- Mounted at /docker-entrypoint-initdb.d/init-scripts/99-roles.sql so it runs
-- AFTER the image has created its internal roles, on first initialisation of an
-- empty data volume only.
--
-- POSTGRES_PASSWORD only sets the superuser password; the roles used by
-- PostgREST, GoTrue, Storage and Realtime are created without one.
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator            WITH PASSWORD :'pgpass';
ALTER USER pgbouncer                WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin      WITH PASSWORD :'pgpass';
ALTER USER supabase_functions_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin   WITH PASSWORD :'pgpass';
