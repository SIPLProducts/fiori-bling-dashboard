# Purchase Orders screen updates

1. **Remove "POs / Lines" tile** from the summary row.
2. **Main Group / Sub Group 1 / Sub Group 2 bars in ₹ Cr** — these bars currently receive raw rupee values while labelled "₹ Cr" (Purchase Register passes values already in Cr). Divide by 1 Cr before charting so bars, tooltips and totals read in Cr.
3. **New tiles:** Total Val, **DOMESTIC Val** (INR lines in the DOMESTIC document type group: ZPDM/ZPNI/ZBBK/ZPCT), and **Remaining Val** (Total Val − DOMESTIC Val). All in ₹ Cr, three tiles in one row.
4. **ZKEYRM Comparison card** on Purchase Orders, reusing the Purchase Register card: same ZKEYRM material list, dropdown search, unit price = total value / total quantity, month-on-month variance, chart, item details and Excel. Fed by filtered PO lines (PO no., PO date, plant/short name, vendor, qty, UOM, NETWR value, net price). Placed above the detailed table, excluded from nothing extra (follows the screen's PDF rules).

## Technical details
- `purchase-orders-dashboard.tsx`: drop POs/Lines Tile; add Domestic/Remaining tiles via `poGroup(r) === "DOMESTIC"`; in `grp()` use `value: r.netValue / CR`.
- Add a small adapter mapping `PoRow` → `PurchaseRow` shape (date=poDate, value=netValue/CR, qty, unit=uom, rate=netPrice, docNo=poNo, plantSh=division, INR lines only) and render `<ZrmmatCompareCard rows={adapted} />`.
- Add a test for the Domestic/Remaining split.
