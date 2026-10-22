# SIT launchpad tile: show Sales Document Type, not invoice type

## Why "Domestic Invoice" shows
The SIT tile on the launchpad groups by VTEXT (SAP invoice type text, e.g. "Domestic Invoice"). The SIT screen groups by AUART + VTEXT_DC, so the two don't match.

## Change
- The SIT launchpad tile groups bars by AUART + VTEXT_DC, the same as the SIT screen, e.g. **Domestic Sales**, **Export Sales**, **SEZ Sales**. Each bar shows its line count and ₹ Cr.
- If VTEXT_DC is blank, the AUART code is shown.
- Total (₹26.54 Cr, 480 SIT lines) stays the same.
- Order Book and Open Sales Orders tiles are unchanged.

## Technical details
- `src/components/open-sales-orders-launch-card.tsx` (SIT card): select `auart` instead of `vtext`, map `order_type: r.auart`, `sales_type: r.vtext_dc`.
- Add a test that SIT rows with AUART ZDOR / VTEXT_DC "Domestic Sales" are labelled "Domestic Sales" in the launch summary.
