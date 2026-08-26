# Live password strength indicator in the user dialog

## What changes

1. **Strength meter under the Password field** (Create and Edit user dialogs)
   - As the admin types, a coloured progress bar + label updates live:
     - **Weak** — red
     - **Medium** — amber
     - **Strong** — green
   - The Confirm Password field shows a green "Passwords match" / red "Passwords do not match" hint while typing.

2. **Strength rules** (each rule met adds to the score):
   - At least 8 characters
   - At least 12 characters
   - Uppercase + lowercase letters
   - Contains a number
   - Contains a symbol
   - A short checklist of unmet rules can appear under the meter so the admin knows what to add.

3. **Weak-password warning stays useful**
   - The existing server-side "password is known to be weak" error still applies; the live meter helps avoid it by encouraging a strong password before saving.

## Technical notes

- New small component `src/components/password-strength.tsx`: pure function scoring the password (0–5 rules), renders the bar (semantic tokens: destructive / warning / success) and label; no external library needed.
- `src/routes/_authenticated/admin/users.tsx`: render the meter below the Password input and the match hint below Confirm Password, driven by the existing form state (no logic changes to validation — minimum 8 chars + match still enforced on save).
- Colours use existing semantic tokens so the Fiori theme is untouched.
