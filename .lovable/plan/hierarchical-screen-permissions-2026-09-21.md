# Hierarchical Screen Permissions

## What will change

The Screen Permissions page will mirror the actual launchpad hierarchy:

- **Sales & Distribution**
  - Total Sales
  - Open Sales Orders
- **Financial Accounting**
  - Open Receivables
  - Open Payables
  - Days Sales Outstanding
  - Cash Flow Trend
- **Production Planning**
  - Open Production Orders
  - Schedule Adherence
  - Capacity Utilisation
  - Output Trend
- **Tables Master**
  - ZFISALES Detail

Home and Administration permissions will remain separate standalone screens.

## Permission behavior

- Each module appears as a parent row with one checkbox per role.
- Expanding a module shows its child cards/screens, each with its own checkbox.
- Checking a module selects all its child screens.
- Unchecking a module removes all its child screens.
- Selecting only some children puts the module checkbox into a partial state.
- A module remains visible on the launchpad whenever the role has at least one child screen.
- Only granted child cards are shown inside that module.
- Direct links and page content are protected by the same child permission, so hiding a card does not leave an unrestricted URL.
- Sharvi Admin continues to have full access without editable checkboxes.

## Implementation

1. Create one shared module-and-child permission catalog used by the launchpad, Screen Permissions page, card filtering, and page guards.
2. Add stable permission keys for every current child card/screen rather than relying on card titles.
3. Replace the flat permission matrix with expandable module rows, indeterminate parent checkboxes, and nested child rows.
4. Add a batch permission action so selecting a module updates all children together and cannot leave a partially saved state.
5. Update launchpad filtering so child permissions control individual cards and any granted child makes its parent module visible.
6. Update Sales & Distribution routes so Total Sales and Open Sales Orders are checked independently.
7. Apply child-level filtering to the shared Financial Accounting and Production Planning analytics pages, where multiple cards currently open one page.
8. Migrate every existing module grant to all of that module’s current children, preserving existing users’ access during the upgrade.
9. Provide the matching self-hosted upgrade SQL for Quality and Production.

## Verification

- Grant only Open Sales Orders: Sales & Distribution appears, only that card is visible, and Total Sales is denied.
- Grant only Total Sales: the reverse behavior is enforced.
- Grant some FI or PP children: the module is visible, only granted cards/content appear, and the parent checkbox is partial.
- Toggle a parent module on/off and confirm all children change together.
- Confirm Sharvi Admin retains every module and child screen.
- Verify desktop and mobile layouts and direct-link protection.
