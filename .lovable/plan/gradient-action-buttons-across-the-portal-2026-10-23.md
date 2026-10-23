# Gradient action buttons across the portal

Give every action button (Refresh, Sync, PDF, Excel, Download, Reset, Clear, Open Details and similar) a polished gradient look, in light and dark mode.

## Look
- **Main actions** (Refresh, Sync, Save, Apply): a blue gradient background with white text, a soft shadow, and a slightly brighter gradient when the pointer is over them.
- **Export actions** (PDF, Excel, CSV, PNG, Download): a teal-to-green gradient so downloads stand out from data actions.
- **Reset / Clear**: a light outline button with gradient-coloured text and border, so it looks secondary next to the main action.
- **Delete / danger**: a red gradient.
- Icons inside buttons take the button text colour. Disabled buttons stay faded.
- Sizes, labels, positions and what each button does stay the same.

## Where
- Every screen: launchpad cards (Open Details), Net Sales, SIT, Sales Register, Order Book, Open Sales Orders, Cash Flow, TBN, User Management, SAP API Settings, plus filter panels and table toolbars.
- PDF downloads keep their current look (buttons are not part of PDFs).

## Technical details
- Add gradient and shadow tokens in `src/styles.css` (`--gradient-action`, `--gradient-export`, `--gradient-danger`, `--gradient-soft`, `--shadow-action`) with light and dark values, built from existing theme colours.
- Add `action`, `export` and `soft` variants to `src/components/ui/button.tsx`; restyle `default` and `destructive` to use the gradients, and `outline` to use gradient text/border, so most buttons update automatically.
- Find plain `<button>` actions (for example Sales Register Excel/pagination, `chart-export-buttons.tsx`, `sales-refresh-button.tsx`, report headers, launchpad Open Details pill) and switch them to the matching variant or shared classes.
- Verify on several screens in light and dark mode with screenshots.
