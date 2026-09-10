# Fix sign-in for masteradmin on the Quality server

## What the two responses mean

1. `resolve_login_email` returning `null` is expected here only if there is no matching
   **active** profile row. In your users list, `masteradmin@sharviinfotech.com` and
   `admin@gmail.com` show a blank display name, while every user created through the setup
   script shows a name. That points to those accounts existing in Auth only, with no row in
   `profiles` (or `status` not `active`). Because the account row is missing, username login
   and role/screen access will not work for it either.
2. The `400 invalid_credentials` on the token call is separate and simpler: the password you
   typed (`Admin@1919s`) is not the password stored on that server. Accounts created by the
   server setup script use the temporary password `Welcome@2026`. Passwords are never copied
   from the cloud project to the self-hosted server.

So: wrong password, on an account that is also missing its portal profile.

## Fix (run on the server)

Two steps, both against the Quality database container:

1. **Set a known password** for `masteradmin@sharviinfotech.com` through the Auth admin API
   (using the service role key from the backend `.env`), or simply sign in with
   `Welcome@2026` if that account was created by the setup script.
2. **Repair the portal record**: insert/update the `profiles` row (username, first/last name,
   email, `status = 'active'`) and the `user_role_assignments` row (`super_admin`) for that
   user id, plus the matching `user_roles` entry. Do the same for `admin@gmail.com` if it is
   still needed, otherwise delete that account.

## Deliverable

A new script `deploy/fix-user.sh` that takes an email, an optional password and an optional
role key, and:

- looks up the user id in `auth.users`
- resets the password via the Auth admin API when a password is given
- confirms the email
- upserts the `profiles` row with `status = 'active'` and a username derived from the email
  (or passed in)
- replaces `user_role_assignments` with the requested role (default `super_admin`) and keeps
  `user_roles` in sync
- prints the resulting profile and role rows for verification

It reuses the same env loading (`backend/.env`), `DB_CONTAINER` and `SUPABASE_API` defaults as
`deploy/quality-setup-all.sh`, so Production works via the same variable overrides.

## After running

Sign in with `masteradmin@sharviinfotech.com` (or the username) and the password you set.
Username login will work once the profile row exists and is active.
