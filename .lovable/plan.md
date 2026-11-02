# ZRMMAT Material Price Comparison card (Purchase Register)

## What you get
A new card on the Purchase Register screen called **ZRMMAT Material Comparison**.

1. **Material dropdown** – lists every material uploaded on the ZRMMAT screen (235 rows today; Plant + Material). Searchable, shows material code + description from Purchase Register when available. Option "All ZRMMAT materials".
2. When a material is picked, it is matched against Purchase Register rows by Material Code (and Plant if the ZRMMAT row has one) for the selected financial year and filters.
3. **Tiles (radiant colours, one row)**
   - Total Procurement Value (NET_AMT, ₹ Cr)
   - Total Quantity (with unit)
   - PO / Document count
   - Unit Price = Total Value ÷ Total Quantity
   - Unit Price Variance – latest month vs previous month (₹ and %), red if up, green if down
4. **Month-on-month chart** – bar for monthly value, line for monthly unit price.
5. **Month-wise table** – Month | Quantity | PO Value (₹ Cr) | Unit Price (₹) | vs previous month (₹, %) | Diff from first month (₹). Excel download named "Purchase Register_DD-MM-YYYY".
6. With "All ZRMMAT materials" selected, the table lists each matched material: Material | Qty | Value | Unit Price | latest MoM variance; clicking a row selects it.

## Price logic
Monthly unit price = sum(NET_AMT) ÷ sum(quantity) for that month. Variance = this month price − previous month price (months with no purchase skipped).

## Technical details
- Read ZRMMAT rows via existing `masterRowsByNameQuery` / mastersQuery("zrmmat" category); detect Material and Plant columns by header name.
- Pure helper `zrmmatComparison(rows, materials)` in `src/lib/purchase-zrmmat-compare.ts` (monthly series, weighted price, MoM variance) with unit tests.
- New component `src/components/zrmmat-compare-card.tsx`, mounted in `purchase-register-dashboard.tsx` using the already-loaded purchase rows (no new DB changes).
