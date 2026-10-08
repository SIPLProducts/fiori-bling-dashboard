# Light and Dark Mode

## What will change
- Add a sun/moon appearance switch in the top bar, available on desktop, tablet, and phone. Its tooltip and accessible label will identify the mode it switches to.
- Offer Light and Dark modes, using the attached screenshots as color references only—not as a replacement layout.
- Keep Light as the initial default and remember the selected mode on this browser across refreshes and navigation.
- Apply the choice consistently across the portal, including report cards, filters, tables, menus, and chart labels.
- Refine contrast where needed: clean light surfaces in Light mode; dark surfaces with readable text and vivid chart colors in Dark mode.

## What stays unchanged
- Every existing card, chart, responsive arrangement, filter, calculation, and permission.
- Excel contents and existing PDF pagination, headers, and footers. Open Sales Orders PDF chart and tile colors will continue to match the selected screen mode, with white PDF page backgrounds.

## Technical details
- Reuse the existing light and `.dark` semantic color tokens in `src/styles.css`; complete theme overrides where needed rather than introducing a separate palette inside components.
- Add shared appearance state at the root and a design-system button in `ShellBar`. Restore the browser preference safely without a hydration mismatch and minimize a wrong-theme flash.
- Record the shared theme architecture and the user's appearance preference during implementation.

## Verification
- Test switching in both directions, persistence after refresh, and navigation between reports.
- Check desktop, tablet, and phone layouts for switch visibility, readable chart/table text, and unchanged card layout.
- Check Open Sales Orders PDF colors in both modes and confirm Excel and report totals remain unchanged.