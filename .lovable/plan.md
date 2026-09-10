# Fix both User Management save errors

## What you are seeing

1. Local: saving a user shows "new row violates row-level security policy for
   table user_role_assignments".
2. Server: saving a password shows "Only a Sharvi Admin can change a Sharvi
   Admin password".

## Why

- The role change is done as two separate writes from the browser (remove the
  old role row, then add the new one). Each write is re-checked against the
  signed-in person's own role row. Because the old row is deleted first, editing
  yourself wipes the very row that proves your permission, and the follow-up
  insert is refused. A refused delete also fails silently, so the insert error is
  the first thing you see.
- The password and delete rules still carry an extra "Sharvi Admin only" gate on
  Sharvi Admin accounts, which contradicts the agreed rule that screen access
  means full control on that screen.

## The fix

1. **One safe database action for role changes.**
   Add `public.admin_set_user_role(_user_id, _role_key)` (`SECURITY DEFINER`)
   that captures the caller's `admin.users` permission before touching any rows,
   rejects an unknown role with a readable message, and replaces the assignment
   (delete + insert) atomically, keeping `public.user_roles` in step. Granted to
   authenticated users only. `setRoleAssignment` in `src/lib/admin.functions.ts`
   calls this instead of the direct delete/insert.

2. **Screen access means full control.**
   Remove the Sharvi-Admin-only gates from `admin_set_user_password` and
   `admin_delete_user`, and drop the equivalent checks in
   `src/lib/admin.functions.ts` (`setRoleAssignment` role-grant guard). Anyone
   granted User Management can create, edit, reset passwords, change roles and
   delete — for any account.

3. **Safety rules that remain.**
   You still cannot delete your own account, and you cannot remove your own
   Sharvi Admin role (that would lock you out mid-edit).

4. **Clearer messages.** The toast shows the database's plain-English reason
   rather than raw row-level-security wording.

## Verification

- As an Admin (User Management granted): change another user's role, reset a
  Sharvi Admin's password, delete a test user — all succeed.
- Attempt self-delete and self-demotion — refused with a clear message.
- Typecheck with `bunx tsgo --noEmit`.
- Note: the same migration must be applied on the Quality/Production server for
  the server-side error to clear.
