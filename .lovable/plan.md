# Remove the nine unwanted screens

## Result

Completely remove these areas from the portal:

- Procurement Overview
- Purchase Order Processing
- Purchase Requisition Processing
- Supplier Evaluation
- Purchase Contract Processing
- Workflow
- Controlling
- Quality Management
- Project Systems

The remaining launchpad areas, including Net Sales, Financial Accounting, Production Planning, Tables Master, and administration, stay unchanged.

## Changes

1. Remove all cards and tabs belonging to the nine areas from the launchpad data.
2. Remove their choices from the Screen Permissions matrix and delete their existing role assignments.
3. Remove the standalone Procurement, Purchase Orders, and Suppliers report pages used by those procurement areas.
4. Remove CO, QM, and PS from the shared SAP module registry, so their dynamic report URLs become unavailable while SD, FI, and PP continue working.
5. Clean up navigation, card-link handling, role-based ordering, mock KPI/report definitions, and other references that become unused.
6. Add a database migration that deletes the nine tile groups and their cards, relying on the existing cascading relationship, and removes the corresponding permission assignments. Historical migrations remain untouched so existing installations can upgrade safely.
7. Update the roadmap and verify the launchpad, Screen Permissions, remaining module pages, removed URLs, desktop/mobile layouts, and browser console.

## Technical details

- Removed group keys: `procurement-overview`, `purchase-order`, `purchase-requisition`, `supplier-evaluation`, `purchase-contract`, `workflow`, `controlling`, `quality-management`, `project-systems`.
- Removed permission keys include their `group.*` entries, `reports.procurement`, `reports.purchase-orders`, `reports.suppliers`, `module.co`, `module.qm`, and `module.ps`.
- The shared `/reports/module/$module` page remains for supported modules; removed module keys will return the existing not-found state.
