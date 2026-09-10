# Fix `fix-user.sh` psql variable error on Quality

## Root cause (confirmed)

The script passes values with `psql -v user_email=...` and references them as
`:'user_email'` in SQL. On the Quality server's database container, that
substitution does not happen, so PostgreSQL receives the literal text
`:'user_email'` and fails with `syntax error at or near ":"` at the very first
lookup. Everything after (password reset, profile/role repair) never runs.

## Change

Rewrite `deploy/fix-user.sh` so it never relies on psql `-v` / `:'var'`:

1. Validate inputs up front (already done): email, username, role key restricted
   to safe character sets; password length >= 8.
2. Build SQL with ordinary shell-escaped string literals instead of psql
   variables. Inputs are already regex-validated, and string literals are
   single-quote-escaped (`'` → `''`) before interpolation, so this is safe.
3. Keep the rest of the flow identical:
   - Look up the Auth user id by email (error if missing).
   - Verify the role exists in `public.roles`.
   - Reset password + confirm email via the Auth admin API (unchanged — uses
     curl, not psql).
   - Upsert the profile, rebuild `user_role_assignments` and `user_roles`.
   - Print a verification row.
4. `bash -n` syntax-check the updated script.

## After approval — what you run on Quality

Upload the new `deploy/fix-user.sh` to `/opt/MIS_Projects/Quality/deploy/`, then:

```bash
cd /opt/MIS_Projects/Quality/deploy
chmod +x fix-user.sh
./fix-user.sh masteradmin@sharviinfotech.com 'Admin@1919s' super_admin sharvi
```

Expected result: password reset confirmed, profile active, role `super_admin`
assigned, and sign-in works with `masteradmin@sharviinfotech.com` /
`Admin@1919s` (or username `sharvi`).
