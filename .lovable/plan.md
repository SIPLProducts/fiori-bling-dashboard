# Login page: HBL branding + reference-matched card

## Left panel (branding)
- Remove the "NEXUS" badge and all Nexus wording.
- Show the uploaded HBL logo (uploaded as a CDN asset) on the dark navy panel, with "HBL MIS Portal" as the brand title beneath it.
- Replace the paragraph copy with MIS-portal wording (SAP MIS reports, KPIs and analytics for your team).
- Footer line becomes "HBL MIS Portal".

## Right panel (card aesthetic — match the reference)
- Page area gets a soft pale-blue/grey background instead of flat white.
- Login card: wider, large radius (~1.5rem), thick soft outer shadow plus a subtle inner highlight so it appears raised off the background (soft neumorphic look in the screenshot).
- "Welcome back" heading with the short gold underline directly under it, then the muted subline "Please sign in to access your dashboard."
- Labels stay the same text as today, styled bold-small with a red required asterisk.
- Inputs: taller (h-11), rounded, light grey fill, leading user/lock icons, gold focus ring/border matching the reference.
- Row under the password: "Remember me" checkbox on the left, "Forgot password?" link on the right (checkbox persists the username locally; the link shows an "contact your administrator" toast — no new backend).
- Sign In button: full width, tall, dark navy, rounded, subtle shadow.

## Unchanged
- Email/username + password sign-in logic, RPC lookup, demo access block and its double-click login all stay exactly as they are.

## Technical notes
- Files: `src/routes/auth.tsx`, `src/styles.css` (add any needed soft-shadow / surface tokens), new `src/assets/hbl-logo.png.asset.json` pointer created with `lovable-assets` from the upload.
- All colors via existing semantic tokens (`ink`, `gold`, `shell`, `card`, `muted`) — no hardcoded hex in components.
- Update the route `head()` titles/descriptions from "Nexus Procurement Analytics" to "HBL MIS Portal".
