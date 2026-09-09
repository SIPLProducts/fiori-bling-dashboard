# AH Sales tile — show value in Cr / L

Right now the AH Sales tile prints the full number with separators. It will use the same short units as the other amount tiles.

## Change

- AH Sales shows values as crores ("50.67 Cr"), lakhs ("5.07 L"), thousands ("K"), or the plain number below that — exactly the same rule used by Total Sales.
- No currency symbol on this tile, since AH is a stored total, not money. Say the word if you want the ₹ sign in front too.
- The hover caption and the way the tile reacts to filters, search and the All / Domestic / Services / Exports tabs stay unchanged.

## Technical note

- `src/components/sd-live-dashboard.tsx`: the AH Sales `KpiCard` uses the shared `compact()` formatter instead of `NUM()`.
