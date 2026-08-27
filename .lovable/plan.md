# Login page polish — centered HBL branding + reference-matched card

Two visual fixes to the login page (`src/routes/auth.tsx`). No logic, labels, or flow changes.

## 1. Left panel — center the HBL logo
- Restructure the left branding panel so the **HBL logo sits at the visual center** of the panel (horizontally and vertically centered) instead of top-left.
- Layout: centered logo (larger, on the frosted badge) with the "HBL MIS Portal" headline and description copy centered beneath it; small footer stays at the bottom.
- Keep the gold glow and faint HBL watermark.

## 2. Right panel — card elevation fix
The card is plain white on a pale blue-grey background, so it reads flat instead of the raised, soft "neumorphic" card in the reference. Fix:
- Give the card a slightly warm off-white surface (very subtle, still reads as white) so it separates from the pale background.
- Strengthen the soft layered shadow (`--shadow-soft-card`) and add a faint 1px ring so the card visibly "floats" — matching the reference's raised look.
- Keep: "Welcome back" heading, gold underline, icon inputs, Remember me / Forgot password, navy Sign In button, and the demo access box below (unchanged position/behavior).

## Verification
- `bunx tsgo --noEmit` passes.
- Playwright screenshot of `/auth` at desktop viewport to confirm centered logo and raised card; re-verify demo login lands on `/launchpad`.
