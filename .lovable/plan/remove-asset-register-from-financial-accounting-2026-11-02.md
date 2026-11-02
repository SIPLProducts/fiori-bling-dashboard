## Remove Asset Register from Financial Accounting

- Remove the "Asset Register" entry from the Financial Accounting module list, so it disappears from navigation, launchpad, and the User Management permission tree.
- Delete the Asset Register page (`/reports/fi/asset-register`).
- Database: deactivate the `fi_asset_register` launchpad tile (set inactive, not deleted), mirrored in a timestamped file under supabase/migrations for Quality/Production.
- Other Financial Accounting screens stay unchanged.
