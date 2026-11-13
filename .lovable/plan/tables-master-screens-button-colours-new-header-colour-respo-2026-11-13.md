# Tables Master screens: button colours, new header colour, responsive filter bar

Applies to Month Wise Upload, SAP MASTER, ZKEYRM, ZPC GROUP and Valuation Class Wise Subgroup.

## Changes
1. **Upload Excel button** – green radiant pill (keeps icon circle, glow, hover lift, spinner).
2. **Excel download button** – green radiant (lighter outline-style green so it differs from Upload).
3. **Delete buttons** (Delete month / Delete sheet / row delete icon) – red radiant; row icon stays small, red.
4. **Table header** – switch from rose to a new radiant: deep teal → indigo blue, white text.
5. **Responsive filter bar** (Month, Year, Search, buttons):
   - Phone (<640px): Month and Year side by side, Search full width below, buttons in a full-width row that wraps evenly.
   - Tablet (640–1024px, e.g. your 949px screen): Month, Year, Search on one line; buttons on the next line, right-aligned.
   - Desktop: everything on one line, buttons pushed right.
   - Fields get fixed min widths so nothing squeezes or overflows.
6. Verify with screenshots at 390px, 949px and 1280px widths.

## Technical details
- New utilities in src/styles.css: `btn-success` (kpi-5 green gradient), `btn-danger` (destructive gradient), update `btn-upload` to kpi-5, `tm-thead` to teal→indigo gradient.
- Filter wrapper becomes a CSS grid (`grid-cols-2 sm:grid-cols-[auto_auto_1fr] lg:flex`) with buttons in their own `col-span-full lg:ml-auto` group, in month-wise-upload-screen.tsx, master-table-screen.tsx and sap-master.tsx.
