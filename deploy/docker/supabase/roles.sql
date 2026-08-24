-- Supabase self-hosting: give the internal service roles a password.
-- POSTGRES_PASSWORD only sets the password for the `postgres` superuser; the
-- roles used by PostgREST, GoTrue, Storage and Realtime are created without one.
-- Runs once, on first initialisation of an empty data volume.
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator            WITH PASSWORD :'pgpass';
ALTER USER pgbouncer                WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin      WITH PASSWORD :'pgpass';
ALTER USER supabase_functions_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin   WITH PASSWORD :'pgpass';
ALTER USER supabase_admin           WITH PASSWORD :'pgpass';
