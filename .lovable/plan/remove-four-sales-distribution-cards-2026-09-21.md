# Remove four Sales & Distribution cards

## Scope
Remove these cards from the Sales & Distribution section:
- Billed Revenue
- Net Sales
- Backorders
- Sales Trend

Keep **Open Sales Orders**, the Sales & Distribution module, Sales Analytics, and their report pages unchanged.

## Implementation
1. Remove the three module card definitions for Net Sales, Backorders, and Sales Trend so they are no longer generated or treated as available SD KPIs.
2. Remove all four matching tile records from the active Lovable Cloud database, including the separately stored Billed Revenue card.
3. Add a safe self-hosted upgrade script that deletes the same four tile records in Quality and Production without touching sales data, permissions, or other cards.
4. Verify the launchpad shows none of the four removed cards and that Open Sales Orders still opens normally.

## Technical details
The database cleanup will target the stable KPI keys `zfi_sales_revenue`, `sd_net_sales`, `sd_backorders`, and `sd_sales_trend`, rather than matching visible card titles.
