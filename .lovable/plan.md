# Purchase Orders (ZME2N) screen

Replace the "coming soon" Purchase Orders page with a working dashboard built from the ZME2N API, styled like Open Purchase Orders and Purchase Register (glassy colored cards, short title underlines, collapsible filters, HBL PDF header, "Val in Cr" under the screen name).

## Data
- New table `purchase_orders` (ZME2N): one row per PO + PO Item, every SAP response field stored as its own column (PO, dates, NO_OF_DAYS, doc type, vendor, plant/PLT_NAME/PLT_SHORT, material, quantities, NET_PRICE, currency, still-to-deliver/invoice qty & value, release group/strategy/status, NET_ORDER_VALUE, HSN, user, buyer...) plus the complete raw row.
- Sync updates existing lines and adds new ones (no deletion — ZME2N returns all POs, not only open ones).
- Load the 16 sample rows from your Excel into the preview only (no seed migration for Quality/Production).

## SAP API Settings
- New endpoint "Purchase Orders (ZME2N)" with your payload (lowercase keys, empty lists = all):
  `purchasing_document: [], plant: [], purchasing_group: [], document_type: [], material: [], vendor: [], document_date: { from_date: "", to_date: "YYYYMMDD" }, status: "R6", mail: ""`
- Works like Open Purchase Orders: Document date range selector, no Plant field; "Today" sends empty from_date and today's to_date (manual and scheduled sync).

## Screen layout
```text
[Filters (collapsible): Plant | PO Type group | Vendor | Purchasing Group | Material Group | Release status | Document date From–To]
[Total Val] [Pending Delivery Val] [Pending Invoice Val] [POs / Lines]
Row 1: PO Value by PO Type (donut+table) | Delivery Status (Delivered / Pending / Overdue donut) | Top 10 Vendors | Top 10 Materials
Row 2: Plant Analytics (PLT_SHORT) | Monthly PO Value Trend
Row 3: Purchasing Group / Buyer split | Release Status (Released / Pending approval)
Detail table: PO, Item, Date, Delivery, Days, Type, Vendor, Plant, Material, Qty, Unit, Net Price, Currency, Net Order Val, Pending Del Val, Pending Inv Val, Release status — search, pagination, totals row, Excel
```
- PO types grouped with the same mapping as Open PO (ZPDM/ZPNI/ZBBK/ZPCT=DOMESTIC, ZPIM=IMPORTED, etc.; ZINT excluded; unknown=OTHERS).
- All values in ₹ Cr. Foreign-currency lines (e.g. USD in the sample) are shown in their own currency in the table; totals add only INR values unless SAP provides an INR-converted value — to confirm.
- Launchpad card: Total PO value with PO-type bars, refreshes only on Refresh/Sync.
- Screen/PDF/Excel names follow the existing "<Screen>_DD-MM-YYYY" rule.

## Open points
- USD/foreign POs: exclude from Cr totals, or does SAP send an INR value field?
- Buyer is empty in the samples — keep Purchasing Group card instead if Buyer stays blank.

## Technical
- Migration in `supabase/migrations/<ts>_purchase_orders.sql` (table, unique PO+PO_ITEM, indexes on po_date/plant, RLS by screen permission, endpoint row).
- Mapper + sync-core/scheduler entry in middleware; data/helpers in `purchase-orders-data.ts` with tests for type grouping, delivery status and totals.
