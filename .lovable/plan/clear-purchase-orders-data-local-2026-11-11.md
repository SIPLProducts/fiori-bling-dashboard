# Clear Purchase Orders data (local)

- Delete all 87 saved lines from the Purchase Orders table in this app's database.
- Nothing else changes: the screen, the SAP API settings and the other reports stay as they are.
- After this the Purchase Orders screen will be empty until you click Sync.

## Technical
Run a single data change: `DELETE FROM public.purchase_orders WHERE id IS NOT NULL;`
