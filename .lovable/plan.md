# Move Inventory right after Financial Accounting

New module order on the launchpad (tabs and sections), the side menu and the User Management permission list:

1. Sales & Distribution
2. Purchase
3. Financial Accounting
4. **Inventory**
5. Production Planning
6. Tables Master

## Technical details
- `src/lib/nav.ts`: swap "inventory" before "production-planning" in `ALL_GROUPS` (drives launchpad order for all roles).
- `src/lib/screens.ts`: move the `module.inv` block above `module.pp` so menu/permissions follow the same order.
- No data or database changes.
