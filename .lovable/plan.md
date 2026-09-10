# Fix sign-in for masteradmin on the Quality server

## What the two responses mean

1. `resolve_login_email` returning `null` means there is no matching **active** profile row.
   The function checks `auth.users` joined to `profiles` and requires `profiles.status =
   'active'`. The blank display name in the user list is consistent with a pre-existing Auth
   account whose portal profile was never completed; the server query in the fix will confirm
   whether the profile is absent or inactive.
2. The `400 invalid_credentials` response now occurs with both `Admin@1919s` and
   `Welcome@2026`, confirming neither is the password stored for this Quality account.
   `create-users.sh` calls the Auth **create** endpoint; when an email already exists it ignores
   that failure and continues, so it does not reset that existing account's password.

So: the existing account kept its old/unknown password, and its active portal profile also
needs to be checked and repaired.

## Fix (run on the server)

Two steps, both against the Quality database container:

1. **Set a known password** for `masteradmin@sharviinfotech.com` through the Auth admin API
   update endpoint (using the service role key from the backend `.env`). A create call is not
   sufficient because the account already exists.
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
