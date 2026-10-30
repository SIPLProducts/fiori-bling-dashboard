# SAP MASTER table: distinct header, smaller text

## What changes
- Header row gets a solid brand-coloured background with light, uppercase, small letters so it clearly stands apart from the data rows; it stays fixed at the top while scrolling.
- Data rows use a smaller font (12px) with alternating light row shading and a soft highlight on hover.
- Works in Light, Dark and Glassy themes. Nothing else on the screen changes.

## Technical details
- `src/routes/_authenticated/reports/tables/sap-master.tsx` lines 106-109: table `text-xs`; `thead` `sticky top-0 bg-primary text-primary-foreground`, `th` `text-[11px] uppercase tracking-wide px-2.5 py-2`; rows `odd:bg-muted/40 hover:bg-accent/50`, `td` `px-2.5 py-1`.
