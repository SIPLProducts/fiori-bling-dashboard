# Open Purchase Orders table: remove Buyer, add row color highlights

## Changes
1. Remove the **Buyer** column from the detailed table and from the Excel download (search no longer matches buyer).
2. Add the same color highlighting used in the Open Sales Orders table body:
   - Alternating light row shading and a highlight on mouse-over.
   - A colored dot before each **PO Type**, with one fixed color per PO type (same color across rows).
   - PO No in the primary color (as today); Open Value bold.
   - Delivery status keeps its colored badge (Delivered / Pending / Overdue).
   - Works in Light, Dark and Glassy.

## Technical details
- File: `src/components/open-po-dashboard.tsx` only.
- Drop "Buyer" from `heads`, the Excel row and the body cell.
- Row classes: `odd:bg-muted/30 hover:bg-primary/10 transition-colors`; PO Type dot color from `COLORS` by the PO type's index in the filter options.
