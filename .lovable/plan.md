# Fix password strength validation mismatch

## What changes

1. **Do not show common passwords as Strong**
   - Add a local “known/common password” check to the password strength logic.
   - Passwords like `Password@123`, `Admin@123`, `Welcome@123`, `Qwerty@123`, company-name style defaults, and similar predictable patterns should show **Weak** in red even if they contain length, uppercase/lowercase, number, and symbol.

2. **Make the message match the save behaviour**
   - If the password looks strong by character rules but is commonly guessed, show a clear red hint before saving.
   - Example: “This password is too common. Please choose a different password.”

3. **Prevent create/save until password is acceptable**
   - Create user should remain disabled or block submission when the password is weak/common or passwords do not match.
   - Edit user password reset should apply the same rule when a new password is entered.

4. **Keep backend protection unchanged**
   - The backend weak-password rejection remains as the final safety check.
   - The UI will now warn earlier so the admin does not see “Strong” and then get rejected.

## Technical notes

- Update `src/components/password-strength.tsx` so the score includes a common-password/predictable-pattern check, not only character composition.
- Export a small reusable password validation helper from the same component module or a new shared utility.
- Update `src/routes/_authenticated/admin/users.tsx` to use that helper for the Create/Save button state and error messaging.
- Keep existing minimum length and confirm-password validation in `src/lib/admin.functions.ts` as server-side validation, with no database changes.
