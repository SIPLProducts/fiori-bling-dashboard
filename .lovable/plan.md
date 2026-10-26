## SIT launchpad card: SIT wording for document types

On the launchpad, the Sales In Transit (SIT) card will show document types the same way the SIT screen does: "Domestic Sales" becomes **Domestic SIT**, "Export Sales" becomes **Export SIT**, and the same for any other type with "Sales" in its name.

Other launchpad cards (Open Sales Orders, Order Book, Sales Register) stay as they are.

### Technical details
- `src/components/open-sales-orders-launch-card.tsx` (`SitLaunchCard`): pass `sales_type: sitDocTypeLabel(r.vtext_dc ?? "")` (falling back to the code when blank), importing `sitDocTypeLabel` from `@/lib/sit-data`.
- Bump the query key so the old labels aren't served from cache.
