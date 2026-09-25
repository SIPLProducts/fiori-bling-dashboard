# Compact Management Alerts layout

## Goal
Reduce the Management Alerts card height so it aligns with the adjacent Sales by New_Repl card, without changing alert calculations or other dashboard sections.

## Changes
- Keep the existing Management Alerts heading, live-filter indicator, dynamic alert text, and calculation basis.
- Arrange the five alert items within this card only:
  - Row 1: Sales momentum | Customer concentration
  - Row 2: Leading segment | Top profit centre
  - Row 3: Revenue per AH
- Use a compact two-column layout on desktop and a single-column stack on narrow screens.
- Tighten internal spacing and typography as needed so the card matches the height of Sales by New_Repl while keeping every value readable.
- Keep alerts informational; no new click action or navigation will be added because the requested refinement is limited to this card’s layout.

## Verification
- Confirm the 2–2–1 order and equal neighboring-card height on desktop.
- Confirm the items stack cleanly without clipped or overlapping text on mobile.
- Confirm filters still recalculate all five alert values and calculation-basis labels.
