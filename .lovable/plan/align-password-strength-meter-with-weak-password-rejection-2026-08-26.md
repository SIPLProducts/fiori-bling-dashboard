# Align password strength meter with weak-password rejection

## What changes

1. **Meter no longer says "Strong" for common/guessable passwords**
   - Add a small common-password / predictable-pattern check (`Password@123`, `Admin@123`, `Welcome@123`, `Qwerty...`, etc.) in `src/components/password-strength.tsx`.
   - When matched, the meter caps at **Weak** (red) with the hint "This password is too common", so it matches the backend rejection the admin already sees.

2. **Everything else stays as-is**
   - No blocking of Create/Save — the existing backend "password is weak" toast remains the final validation.
   - No changes to role, status, or any other dialog field.
   - No database changes.

## Technical notes

- Only `src/components/password-strength.tsx` changes: add the common-password check into the score computation; no changes to `admin.functions.ts` or the users route.
