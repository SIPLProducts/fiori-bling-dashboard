# Launchpad Purchase Orders: show document type group names

SAP sends only document type codes (ZPDM, ZPPM, ...), no names. The Purchase Orders launchpad card will show the group names instead, the same as Open Purchase Orders.

## Change
- Card list shows DOMESTIC, PROJECT, CAPITAL, SERVICE, IMPORTED, OTHERS, each with lines and ₹ Cr, sorted by value.
- Mapping: ZPDM/ZPNI/ZBBK/ZPCT = DOMESTIC, ZPPM = PROJECT, ZPCP/ZPIT = CAPITAL, ZPSR/ZPIS = SERVICE, ZPIM = IMPORTED, unknown = OTHERS.
- Heading stays "PO Value by Doc Type"; total ₹ Cr, POs and lines unchanged.

## Technical
- purchase-orders-launch-card.tsx: group INR rows by `poTypeGroup(r.poType)` from open-po-data.ts instead of the raw code.
