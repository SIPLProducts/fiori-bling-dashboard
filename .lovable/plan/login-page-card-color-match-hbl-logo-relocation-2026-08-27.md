# Login page: card color match + HBL logo relocation

Three visual changes to `/auth` (`src/routes/auth.tsx`, tokens in `src/styles.css`). No sign-in logic, labels, or demo behavior changes.

## 1. Card color matches the reference
- The reference card is not pure white — it is a very soft pale blue-grey (slightly lighter than the page background), giving the raised "soft" look.
- Update the `--card-raised` token to a pale blue-grey (light blue tint, close to `--surface` but lighter) so the card matches the reference while still floating via the layered shadow.

## 2. HBL logo moves to top-right of the right panel
- Remove the centered HBL logo badge from the left panel.
- Add the HBL logo as a compact mark at the top-right corner of the right sign-in panel (white/inverted rendering, positioned above the card area).

## 3. Left panel: centered HBL watermark behind the description
- Replace the current bottom-right "HBL" text watermark with the HBL logo image itself, centered in the left panel behind the headline/description copy at very low opacity (background watermark effect).
- Headline, eyebrow with gold lines, description, and footer copy stay centered as today.

## Verification
- `bunx tsgo --noEmit` passes.
- Playwright screenshot of `/auth` confirming the card tint matches the reference, logo sits top-right of the right panel, and the centered watermark logo shows behind the left description.
