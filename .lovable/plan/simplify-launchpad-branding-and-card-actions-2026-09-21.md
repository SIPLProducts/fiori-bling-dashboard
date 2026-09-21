# Simplify launchpad branding and card actions

## Changes

- Remove the repeated “HBL” text from the launchpad header so the existing HBL logo is followed only by “MIS PORTAL”.
- Make report cards passive surfaces instead of full-card links.
- Allow navigation only through each card’s bottom action control, such as **Open Details**, **View details**, **Open overview**, or **Open table**.
- Apply the same button-only interaction to the live Total Sales card and every active FI, PP, Sales, and table card.
- For under-development cards, open the existing slide-over only from the bottom **Under development** action; clicking the rest of the card does nothing.
- Keep keyboard focus and accessible labels on every bottom action.
- Preserve all destinations, permissions, live values, layout, and visual styling.

## Validation

- Confirm the header reads “MIS PORTAL” beside the HBL logo.
- Confirm clicking card content does nothing, while its bottom action opens the correct report or slide-over.
- Check desktop and mobile layouts for overflow and browser errors.
- Run the project type check and formatting-diff validation.
