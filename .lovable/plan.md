# Redesign the right-side login card

## Goal

Update the styling of the right-side login panel on `/auth` to match the reference screenshot’s clean, elevated card aesthetic, without changing the existing form fields, labels, or demo-login functionality.

## What will change

- Wrap the existing form in an elevated white card with rounded corners and soft shadow on a pale/soft background.
- Add a "Welcome back" header with a small gold/amber accent underline.
- Add leading icons inside the email/username and password inputs.
- Style the primary "Sign in" button as a dark navy/ink filled button.
- Keep the existing labels, placeholders, validation, and Demo access section exactly as they are.

## What will not change

- Form fields: "Email or username" input and "Password" input stay the same.
- Submit handler, demo-login handler, and password-strength/toast behavior remain untouched.
- No new fields (e.g. "Remember me" or "Forgot password?") will be added unless you ask for them.

## Verification

- Load `/auth` and confirm the card visually matches the reference while all existing inputs and the demo section still work.
- Confirm the demo login still lands on `/launchpad`.

## Files affected

- `src/routes/auth.tsx` — Tailwind class updates only.
